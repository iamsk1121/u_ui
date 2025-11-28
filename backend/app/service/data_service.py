from sqlalchemy import case, cast,select, func, Float, FLOAT, REAL, INTEGER, NUMERIC
from app.model import inspection_result
from .query_build import NORMALIZED_RESULT, PRIORITY
from collections import Counter
import re

def safe_float(col):

    if isinstance(col.type, (FLOAT, REAL, INTEGER, NUMERIC)):
        return col
    
    return case(
        (
            col.op("~")(r'^[+-]?([0-9]*[.])?[0-9]+$'),
            cast(col, Float)
        ),
        else_=-1.0
    )

def get_value(row, key, default=None):

    return row._mapping.get(key, default)

def top_n_with_others(list_, n=8):
    if len(list_) <= n:
        return list_
    top_n = list_[:n]
    others_sum = sum(d["count"] for d in list_[n:])
    return top_n + [{"value": "OTHERS", "count": others_sum}]

def percent(num, total):
    if not total:
        return "0%"
    return f"{(num / total) * 100:.2f}%"

def count_by(rows, key):
    counter = Counter((get_value(r, key, "UNKNOWN") or "UNKNOWN") for r in rows)
    return sorted(
        [{"value": v, "count": c} for v, c in counter.items()],
        key=lambda x: x["count"],
        reverse=True
    )

def add_rate(list_, total):
    if not total:
        return list_
    return [{**item, "rate": percent(item["count"], total)} for item in list_]


def distribution(rows):
    total = len(rows)

    defectTop10 = add_rate(count_by(rows, "afvi_ai_defect"), total)[:10]

    unk_rows = [
        r for r in rows
        if "AI_UNKNOWN" in (get_value(r, "afvi_ai_keyin") or "")
    ]
    unk_total = len(unk_rows)

    unkDefectTop10 = add_rate(count_by(unk_rows, "afvi_ai_defect"), unk_total)[:10]

    ng_rows = [
        r for r in rows
        if "AI_NG" in (get_value(r, "afvi_ai_keyin") or "")
    ]
    ng_total = len(ng_rows)

    ngDefectTop10 = add_rate(count_by(ng_rows, "afvi_ai_defect"), ng_total)[:10]

    unkResultDistribution = add_rate(count_by(unk_rows, "afvi_ai_keyin"), unk_total)
    unkResultDistribution = sorted(unkResultDistribution, key=lambda x: x["count"], reverse=True)

    unkDetailMap = {}
    for item in unkResultDistribution:
        key = item["value"]
        target_rows = [r for r in unk_rows if get_value(r, "afvi_ai_keyin") == key]

        defect_map = count_by(target_rows, "afvi_ai_defect")
        defect_map = add_rate(defect_map, len(target_rows))

        unkDetailMap[key] = top_n_with_others(defect_map, 9)

    return {
        "defectTop10": defectTop10,
        "unkDefectTop10": unkDefectTop10,
        "ngDefectTop10": ngDefectTop10,
        "unkResultDistribution": unkResultDistribution,
        "unkDetailMap": unkDetailMap
    }


def build_summary_from_sql(db, test_id: int, sorter_values=None):

    filters = [inspection_result.c.test_id == test_id]
    if sorter_values:
        filters.append(inspection_result.c.bundle_no.in_(sorter_values))

    point_stmt = (
        select(NORMALIZED_RESULT, func.count())
        .where(*filters)
        .group_by(NORMALIZED_RESULT)
    )

    dis_stmt =(
        select(
        inspection_result.c.afvi_ai_keyin,
        inspection_result.c.afvi_ai_defect,
        ).where(*filters)
    )

    dis_row = db.execute(dis_stmt).fetchall()
    dist  = distribution(dis_row)




    point_data = dict(db.execute(point_stmt).fetchall())

    total_point = sum(point_data.values())
    ok = point_data.get("OK", 0)
    ng = point_data.get("NG", 0)
    unk = point_data.get("UNKNOWN", 0)
    ics = point_data.get("ICS_Recheck", 0)

    unit_stmt = (
        select(
            NORMALIZED_RESULT.label("result"),
            inspection_result.c.ivs_keyin1,
        )
        .where(*filters)
        .order_by(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y,
            PRIORITY.asc()
        )
        .distinct(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y
        )
    )

    unit_rows = db.execute(unit_stmt).fetchall()

    unit_summary = {}
    underkill = 0
    overkill = 0

    for row in unit_rows:
        r = row.result
        keyin = (row.ivs_keyin1 or "").strip()

        unit_summary[r] = unit_summary.get(r, 0) + 1

        if r == "OK" and keyin.lower().startswith("s"):
            underkill += 1
        if r == "NG" and (keyin == "" or keyin == "Good"):
            overkill += 1

    unit_total = sum(unit_summary.values())
    unit_ok = unit_summary.get("OK", 0)
    unit_ng = unit_summary.get("NG", 0)
    unit_unk = unit_summary.get("UNKNOWN", 0)
    unit_ics = unit_summary.get("ICS_Recheck", 0)

    under_ppm = ((underkill / unit_ok) * 1_000_000) if unit_ok > 0 else 0
    
    return {
        "resultSummary": [
            {"type": "OK", "count": ok, "rate": f"{(ok/total_point)*100:.2f}%"},
            {"type": "UNK", "count": unk, "rate": f"{(unk/total_point)*100:.2f}%"},
            {"type": "NG", "count": ng, "rate": f"{(ng/total_point)*100:.2f}%"},
            {"type": "TOTAL", "count": total_point, "rate": "100%"},
        ],
        "resultUnitSummary": [
            {"type": "OK", "count": unit_ok, "rate": f"{(unit_ok/unit_total)*100:.2f}%"},
            {"type": "UNK", "count": unit_unk, "rate": f"{(unit_unk/unit_total)*100:.2f}%"},
            {"type": "NG", "count": unit_ng, "rate": f"{(unit_ng/unit_total)*100:.2f}%"},
            {"type": "TOTAL", "count": unit_total, "rate": "100%"},
        ],
        "defectTop10": dist["defectTop10"],
        "unkDefectTop10": dist["unkDefectTop10"],
        "ngDefectTop10": dist["ngDefectTop10"],
        "unkResultDistribution": dist["unkResultDistribution"],
        "unkDetailMap": dist["unkDetailMap"],
        "gtSummary": [
            {"desc": "UnderKill", "count": underkill, "rate": f"{under_ppm:.2f}"},
            {"desc": "OverKill", "count": overkill,
             "rate": f"{(overkill/unit_ng)*100:.2f}%" if unit_ng else "0%" }
        ]
    }

def build_multi_summary(db, test_id: int):

    base_filter = inspection_result.c.test_id == test_id

    info_stmt = select(
        inspection_result.c.lot_no,
        inspection_result.c.inspection_machine,
        inspection_result.c.rms_customer,
        inspection_result.c.core_version,
        inspection_result.c.ai_date_time,
        inspection_result.c.file_name
    ).where(base_filter).limit(1)

    info = db.execute(info_stmt).fetchone()
    if not info:
        return None

    itemcode = (info.file_name or "").split("/")[-1].split("_")[0]

    point_stmt = (
        select(NORMALIZED_RESULT, func.count())
        .where(base_filter)
        .group_by(NORMALIZED_RESULT)
    )
    point_data = dict(db.execute(point_stmt).fetchall())

    total_point = sum(point_data.values())
    ok = point_data.get("OK", 0)
    ng = point_data.get("NG", 0)
    unk = point_data.get("UNKNOWN", 0)
    ics = point_data.get("ICS_Recheck", 0)

    unit_stmt = (
        select(
            NORMALIZED_RESULT.label("result"),
            inspection_result.c.ivs_keyin1
        )
        .where(base_filter)
        .order_by(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y,
            PRIORITY.asc()
        )
        .distinct(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y
        )
    )
    unit_rows = db.execute(unit_stmt).fetchall()

    unit_count = {"OK": 0, "NG": 0, "UNKNOWN": 0, "ICS_Recheck": 0}
    underkill = 0
    overkill = 0

    for r in unit_rows:
        result = r.result
        keyin = (r.ivs_keyin1 or "").strip()

        if result in unit_count:
            unit_count[result] += 1

        if result == "OK" and keyin.lower().startswith("s"):
            underkill += 1

        if result == "NG" and (keyin == "" or keyin == "Good"):
            overkill += 1

    unit_total = sum(unit_count.values())

    under_ppm = (round((underkill / unit_count["OK"]) * 1_000_000, 2) if unit_count["OK"] > 0 else 0)
    over_rate = (overkill / unit_count["NG"]) if unit_count["NG"] > 0 else 0

    return {
        "lot": info.lot_no,
        "machine": info.inspection_machine,
        "customer": info.rms_customer,
        "itemcode": itemcode,
        "version": info.core_version,
        "ai_date_time": info.ai_date_time,

        "total": total_point,
        "ok_cnt": ok,
        "ng_cnt": ng,
        "unk_cnt": unk,
        "ics_cnt": ics,

        "ok_rate": ok / total_point if total_point else 0,
        "ng_rate": ng / total_point if total_point else 0,
        "unk_rate": unk / total_point if total_point else 0,

        "unit_total": unit_total,
        "unit_ok_cnt": unit_count["OK"],
        "unit_ng_cnt": unit_count["NG"],
        "unit_unk_cnt": unit_count["UNKNOWN"],
        "unit_ics_cnt": unit_count["ICS_Recheck"],

        "unit_ok_rate": unit_count["OK"] / unit_total if unit_total else 0,
        "unit_ng_rate": unit_count["NG"] / unit_total if unit_total else 0,
        "unit_unk_rate": unit_count["UNKNOWN"] / unit_total if unit_total else 0,

        "underk_cnt": underkill,
        "underk_ppm": under_ppm,

        "overk_cnt": overkill,
        "overk_rate": over_rate
    }

def load_detail_header(db, test_id):

    itemcode_expr = func.split_part(
        func.split_part(inspection_result.c.file_name, '/', -1),
        '_',
        1
    ).label("itemcode")

    stmt = (
        select(
            inspection_result.c.test_id,
            inspection_result.c.lot_no,
            inspection_result.c.inspection_machine,
            inspection_result.c.rms_customer,
            inspection_result.c.core_version,
            inspection_result.c.ai_date_time,
            itemcode_expr,
        )
        .where(inspection_result.c.test_id == test_id)
        .order_by(inspection_result.c.ai_date_time.desc())
        .limit(1)
    )

    row = db.execute(stmt).fetchone()
    if not row:
        return None

    return {
        "test_id": test_id,
        "lot": row.lot_no,
        "machine": row.inspection_machine,
        "customer": row.rms_customer,
        "itemcode": row.itemcode,
        "version": row.core_version,
        "ai_date_time": row.ai_date_time,
    }


def load_lot_rows_all(db, test_ids):
    if isinstance(test_ids, int):
        test_ids = [test_ids]

    itemcode_expr = func.split_part(
        func.split_part(inspection_result.c.file_name, '/', -1),
        '_',
        1
    ).label("itemcode")

    stmt = select(
        inspection_result,      
        itemcode_expr 
    ).distinct(
        inspection_result.c.body_id           
    ).where(
        inspection_result.c.test_id.in_(test_ids)
    )

    rows = db.execute(stmt).fetchall()

    grouped = {}
    for r in rows:
        grouped.setdefault(r.test_id, []).append(r)

    return grouped

def build_unit_groups(rows):

    priority_order = {
        "NG": 1,
        "ICS_Recheck": 2,
        "UNKNOWN": 3,
        "OK": 4,
    }

    groups = {}      
    ui_map = {}      

    for r in rows:
        key = (r.strip_id, r.bundle_no, r.n_unit_x, r.n_unit_y)

        ai = normalize_result(r.afvi_ai_keyin)
        pri = priority_order.get(ai, 999)


        if key not in groups:
            groups[key] = []
        groups[key].append(ai)

        if key not in ui_map:
            ui_map[key] = (pri, r)
        else:

            if pri < ui_map[key][0]:
                ui_map[key] = (pri, r)

    ui_list = [row for (_, row) in ui_map.values()]

    return groups, ui_list

def normalize_result(value):
    if value and isinstance(value, str) and "AI_OK" in value:
        return "OK"
    if value in [
        "AI_UNKNOWN_NG1", "AI_UNKNOWN_NG1_LOGIT",
        "AI_NG_NG1", "AI_NG_NG1_LOGIT", "AI_NG_NG1_UNDERCUT"
    ]:
        return "NG"
    if value == "AI_ICS_Recheck":
        return "ICS_Recheck"
    if isinstance(value, str) and value.startswith("AI_UNKNOWN"):
        return "UNKNOWN"
    return value

def calculate_under_over_kill(rows):
    underkill = []
    overkill = []

    for r in rows:
        ai = normalize_result(r.afvi_ai_keyin)
        ivs = (r.ivs_keyin1 or "").strip()

        if ai == "OK" and re.match(r"^s\d+", ivs.lower()):
            underkill.append(r)

        if ai == "NG" and (ivs == "" or ivs == "Good"):
            overkill.append(r)

    return underkill, overkill