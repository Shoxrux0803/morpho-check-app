import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.schemas import PatientData
from models.user import User
from models.userdata import PatientAnalysis
from routers.auth_router import get_current_admin, get_optional_user, get_current_admin_or_assistant
from services.analyze_workflow_service import (
    analyze_and_store,
    build_pdf_report_data,
    build_pdf_report_data_by_id,
    store_raw_analysis,
)
from services.pdf_services import generate_pdf_report as generate_pdf_file
from utils.admin_permissions import filter_payload_by_permissions, get_effective_admin_permissions
from utils.database import get_db
from utils.audit_helper import record_audit_log
from utils.privacy import child_audit_reference, get_child_privacy_enabled, redact_child_payload

router = APIRouter(tags=["Tahlil"])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@router.post("/", tags=["Tahlil"])
def analyze_and_store_raw(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_assistant),
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
        result = analyze_and_store(
            data, db, request, lang=lang, current_user=current_user
        )
        if current_user:
            result = filter_payload_by_permissions(
                result, get_effective_admin_permissions(current_user)
            )
            return redact_child_payload(
                result,
                current_user,
                privacy_enabled=get_child_privacy_enabled(db, current_user),
            )
        return result
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
    request: Request,
    lang: str = Query(default="uz", description="Til: uz, tr, tm, ru, en, kz"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    try:
        report_data = build_pdf_report_data(data, db, lang=lang)
        if current_user:
            report_data = filter_payload_by_permissions(
                report_data, get_effective_admin_permissions(current_user)
            )
        pdf_buffer = generate_pdf_file(report_data, lang=lang)
        if current_user:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="DOWNLOAD",
                target_type="PatientAnalysis",
                details=f"Ota-ona nusxasi (PDF) yuklab olindi: {child_audit_reference(report_data)}",
                request=request,
            )
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_parent_{lang}.pdf",
                "X-Report-Audience": "parent",
                "Cache-Control": "no-store, private",
                "Access-Control-Expose-Headers": "Content-Disposition, X-Report-Audience",
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
    request: Request,
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
        report_data = filter_payload_by_permissions(
            report_data, get_effective_admin_permissions(current_user)
        )
        pdf_buffer = generate_pdf_file(report_data, lang=lang)
        record_audit_log(
            db=db,
            user_id=current_user.id,
            action="DOWNLOAD",
            target_type="PatientAnalysis",
            target_id=rec.id,
            details=f"Ota-ona nusxasi (PDF) yuklab olindi: {child_audit_reference(rec)}",
            request=request,
        )
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{patient_id}_{lang}.pdf",
                "X-Report-Audience": "parent",
                "Cache-Control": "no-store, private",
                "Access-Control-Expose-Headers": "Content-Disposition, X-Report-Audience",
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
