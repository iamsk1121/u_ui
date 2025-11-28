from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, func, cast, Float
from app.database import get_db
from app.model.inspection_result import inspection_result
from app.service.query_build import NORMALIZED_RESULT, PRIORITY
from app.service.data_service import safe_float, build_summary_from_sql, load_detail_header

router = APIRouter(prefix="/api/pms/detail", tags=["PMS Detail"])

@router.get("/{test_id}")
def get_detail_header(test_id: int, db: Session = Depends(get_db)):
    return load_detail_header(db, test_id)

@router.get("/{test_id}/sorter")
def get_trials(test_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(inspection_result.c.bundle_no)
        .where(inspection_result.c.test_id == test_id)
        .where(inspection_result.c.bundle_no.isnot(None))
        .distinct()
        .order_by(inspection_result.c.bundle_no.asc())
    )

    rows = db.execute(stmt).fetchall()

    return [{"label": r.bundle_no, "value": r.bundle_no} for r in rows]

@router.get("/{test_id}/unique-values")
def get_unique_values(
    test_id: int,
    type: str = "point",
    sorters: str | None = None,
    db: Session = Depends(get_db),
):

    sorter_list = sorters.split(",") if sorters else None

    base = select(
        inspection_result.c.strip_id,
        inspection_result.c.bundle_no,
        inspection_result.c.defect_code,
        inspection_result.c.afvi_ai_keyin,
        inspection_result.c.afvi_ai_defect,
        inspection_result.c.afvi_clf_defect,
        inspection_result.c.ivs_keyin1,
        NORMALIZED_RESULT.label("norm")
    ).where(inspection_result.c.test_id == test_id)

    if sorter_list:
        base = base.where(inspection_result.c.bundle_no.in_(sorter_list))

    if type in ["unit", "underkill", "overkill"]:

        base = base.order_by(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y,
            PRIORITY.asc()
        ).distinct(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y
        )

    if type == "underkill":
        base = base.where(
            (NORMALIZED_RESULT == "OK")
            & inspection_result.c.ivs_keyin1.ilike("s%")
        )

    elif type == "overkill":
        base = base.where(
            (NORMALIZED_RESULT == "NG")
            & ((inspection_result.c.ivs_keyin1 == "") | (inspection_result.c.ivs_keyin1 == "Good"))
        )

    rows = db.execute(base).fetchall()

    target_columns = [
        "strip_id", "bundle_no", "defect_code",
        "afvi_ai_keyin", "afvi_ai_defect", "afvi_clf_defect", "afvi_false_defect","ivs_keyin1"
    ]

    result = {}

    for col in target_columns:
        values = set()

        for r in rows:
            val = r._mapping.get(col)

            if val in [None, ""]:
                values.add("N/A")  
            else:
                values.add(str(val))

        sorted_values = sorted([v for v in values if v != "N/A"])  
        if "N/A" in values:
            sorted_values.append("N/A")

        result[col] = sorted_values

    return result

@router.post("/{test_id}/data")
def get_detail_data(test_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):

    mode = payload.get("mode", "point")
    page = payload.get("page", 1)
    size = payload.get("size", 100)
    filters = payload.get("filters", {})
    sort = payload.get("sort")
    sorters = payload.get("sorters", [])

    stmt = select(
        inspection_result.c.strip_id,
        inspection_result.c.defect_code,
        inspection_result.c.afvi_ai_keyin,
        inspection_result.c.afvi_ai_defect,
        inspection_result.c.afvi_clf_defect,
        inspection_result.c.afvi_false_defect,
        inspection_result.c.afvi_ai_longest,
        inspection_result.c.afvi_ai_gv,
        inspection_result.c.ivs_keyin1,
        inspection_result.c.image_path,
        NORMALIZED_RESULT,
        PRIORITY,
        inspection_result.c.bundle_no,
        inspection_result.c.n_unit_x,
        inspection_result.c.n_unit_y,
        inspection_result.c.body_id,
    ).where(inspection_result.c.test_id == test_id)

    if sorters:
        stmt = stmt.where(inspection_result.c.bundle_no.in_(sorters))

    for col, vals in filters.items():
        if vals:
            stmt = stmt.where(getattr(inspection_result.c, col).in_(vals))

    if mode in ["unit", "underkill", "overkill"]:
        stmt = stmt.order_by(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y,
            PRIORITY.asc()
        ).distinct(
            inspection_result.c.strip_id,
            inspection_result.c.bundle_no,
            inspection_result.c.n_unit_x,
            inspection_result.c.n_unit_y
        )

    if mode == "underkill":
        stmt = stmt.where(
            (NORMALIZED_RESULT == "OK") &
            inspection_result.c.ivs_keyin1.ilike("s%")
        )

    elif mode == "overkill":
        stmt = stmt.where(
            (NORMALIZED_RESULT == "NG") &
            (
                (inspection_result.c.ivs_keyin1 == "") |
                (inspection_result.c.ivs_keyin1 == "Good")
            )
        )

    if sort and sort.get("field"):
        field = sort.get("field")
        direction = sort.get("direction", "asc")
        sort_column = getattr(inspection_result.c, field, None)

        if sort_column is not None:

            sort_column =  cast(safe_float(getattr(inspection_result.c, field)), Float)
 
            stmt = stmt.where(sort_column != -1)

            stmt = stmt.order_by(
                sort_column.desc() if direction == "desc" else sort_column.asc()
            )


    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    stmt = stmt.limit(size).offset((page - 1) * size)
    rows = db.execute(stmt).fetchall()

    visible = {
        "strip_id","defect_code","afvi_ai_keyin","afvi_ai_defect","afvi_false_defect",
        "afvi_clf_defect","afvi_ai_longest","afvi_ai_gv",
        "ivs_keyin1","image_path"
    }

    cleaned = [{k: v for k, v in r._mapping.items() if k in visible} for r in rows]

    return {
        "mode": mode,
        "page": page,
        "pageSize": size,
        "total": total,
        "hasMore": (page * size) < total,
        "rows": cleaned
    }

@router.get("/{test_id}/summary")
def get_single_summary(test_id: int, sorters: str | None = None, db: Session = Depends(get_db)):
    sorter_values = sorters.split(",") if sorters else None
    return build_summary_from_sql(db, test_id, sorter_values)

