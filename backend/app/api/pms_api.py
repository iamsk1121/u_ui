from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, distinct
from datetime import datetime
from typing import List, Dict
from sqlalchemy import cast, DateTime

from app.database import get_db
from app.model.inspection_result import inspection_result

router = APIRouter(prefix="/api/pms")


def extract_itemcode_from_filename(name: str):
    if not name:
        return None
    base = name.split("/")[-1]
    return base.split("_")[0]


itemcode_expr = func.split_part(
    func.split_part(inspection_result.c.file_name, "/", -1),
    "_",
    1
)


@router.get("/search")
def pms_search(
    machine: str = None,
    item: str = None,
    lot: str = None,
    trial: str = None,
    startDate: str = None,
    endDate: str = None,
    text: str = None,
    db: Session = Depends(get_db)
):
    ai_dt = cast(inspection_result.c.ai_date_time, DateTime)

    stmt = select(
        inspection_result.c.test_id,
        inspection_result.c.lot_no,
        inspection_result.c.inspection_machine,
        inspection_result.c.file_name,
        inspection_result.c.bundle_no,
        inspection_result.c.core_version,
        inspection_result.c.rms_customer,
        inspection_result.c.ai_date_time,
    )

    if startDate:
        try:
            start_dt = datetime.strptime(startDate, "%Y-%m-%d")
            stmt = stmt.where(ai_dt >= start_dt)
        except:
            pass

    if endDate:
        try:
            end_dt = datetime.strptime(endDate, "%Y-%m-%d")
            stmt = stmt.where(ai_dt <= end_dt)
        except:
            pass

    if machine:
        stmt = stmt.where(inspection_result.c.inspection_machine == machine)

    if item:
        stmt = stmt.where(itemcode_expr == item)

    if lot:
        stmt = stmt.where(inspection_result.c.lot_no == lot)

    if trial:
        stmt = stmt.where(inspection_result.c.bundle_no == trial)

    if text:
        stmt = stmt.where(
            itemcode_expr.ilike(f"%{text}%") | inspection_result.c.lot_no.ilike(f"%{text}%")
        )

    rows = db.execute(stmt).fetchall()

    groups = {}
    for r in rows:
        if r.test_id not in groups:
            groups[r.test_id] = {
                "id": r.test_id,
                "lot": r.lot_no,
                "itemcode": extract_itemcode_from_filename(r.file_name),
                "version": r.core_version,
                "customer": r.rms_customer,
                "machine": r.inspection_machine,
                "trial": r.bundle_no,
                "ai_dt": r.ai_date_time,
            }

    return list(groups.values())


@router.get("/machines")
def get_machines(db: Session = Depends(get_db)):
    stmt = select(distinct(inspection_result.c.inspection_machine))
    rows = db.execute(stmt).fetchall()
    return [{"label": r[0], "value": r[0]} for r in rows if r[0]]


@router.get("/items")
def get_items(machine: str, db: Session = Depends(get_db)):
    stmt = select(distinct(itemcode_expr)).where(
        inspection_result.c.inspection_machine == machine
    )
    rows = db.execute(stmt).fetchall()
    return [{"label": r[0], "value": r[0]} for r in rows if r[0]]


@router.get("/lots")
def get_lots(item: str, db: Session = Depends(get_db)):
    stmt = select(distinct(inspection_result.c.lot_no)).where(
        itemcode_expr == item
    )
    rows = db.execute(stmt).fetchall()
    return [{"label": r[0], "value": r[0]} for r in rows if r[0]]


@router.get("/sorter")
def get_trials(lot: str, db: Session = Depends(get_db)):
    stmt = select(distinct(inspection_result.c.bundle_no)).where(
        func.trim(func.upper(inspection_result.c.lot_no)) == lot.strip().upper()
    )
    rows = db.execute(stmt).fetchall()
    return [{"label": r[0], "value": r[0]} for r in rows if r[0]]
