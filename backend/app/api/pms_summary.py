from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.service.data_service import build_multi_summary

router = APIRouter(prefix="/api/pms/summary", tags=["PMS Summary"])

@router.post("/multi")
def get_summary_multi(test_ids: list[int], db: Session = Depends(get_db)):
    return {tid: build_multi_summary(db, tid) for tid in test_ids}