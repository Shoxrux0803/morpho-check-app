import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.schemas import PatientData
from models.user import User
from models.userdata import PatientAnalysis
from routers.auth_router import get_current_admin, get_optional_user
from services.analyze_workflow_service import (
    analyze_and_store,
    build_pdf_report_data,
    build_pdf_report_data_by_id,
    store_raw_analysis,
)
from services.pdf_services import generate_pdf_report as generate_pdf_file
from utils.database import get_db

router = APIRouter(tags=["Tahlil"])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@router.post("/", tags=["Tahlil"])
def analyze_and_store_raw(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    try:
        rec = store_raw_analysis(data, db, current_user)
        return {"message": "Ma'lumotlar saqlandi", "user_id": rec.id}
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Raw analysis save failed")
        raise HTTPException(status_code=400, detail=f"Saqlash xatosi: {exc}") from exc


@router.post("/full", response_model=Dict[str, Any], tags=["Tahlil"])
def analyze_full(
    data: PatientData,
    request: Request,
    lang: str = Query(default="uz", description="Til: uz, tr, tm, ru, en, kz"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    try:
        return analyze_and_store(
            data, db, request, lang=lang, current_user=current_user
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("To'liq tahlilda xato")
        raise HTTPException(
            status_code=500,
            detail=f"Tahlil yoki saqlash xatosi: {exc}",
        ) from exc


@router.post("/pdf-report", tags=["PDF Hisobot"])
def generate_pdf_report_endpoint(
    data: PatientData,
    lang: str = Query(default="uz", description="Til: uz, tr, tm, ru, en, kz"),
    db: Session = Depends(get_db),
):
    try:
        report_data = build_pdf_report_data(data, db, lang=lang)
        pdf_buffer = generate_pdf_file(report_data, lang=lang)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{data.first_name}_{lang}.pdf"
            },
        )
    except Exception as exc:
        logger.exception("PDF yaratishda xatolik")
        raise HTTPException(
            status_code=500,
            detail=f"PDF yaratishda xatolik: {exc}",
        ) from exc


@router.get("/pdf-by-id/{patient_id}", tags=["PDF Hisobot"])
def generate_pdf_by_patient_id(
    patient_id: int,
    lang: str = Query(default="uz", description="Til: uz, tr, tm, ru, en, kz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    rec = db.query(PatientAnalysis).filter(PatientAnalysis.id == patient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Bemor topilmadi: id={patient_id}")
    if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Ushbu hisobotni yuklab olishga huquqingiz yo'q"
        )

    try:
        report_data = build_pdf_report_data_by_id(patient_id, db, lang=lang)
        pdf_buffer = generate_pdf_file(report_data, lang=lang)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{patient_id}_{lang}.pdf"
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF by ID yaratishda xatolik")
        raise HTTPException(
            status_code=500,
            detail=f"PDF yaratishda xatolik: {exc}",
        ) from exc
