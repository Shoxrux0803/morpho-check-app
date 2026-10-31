import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.schemas import PatientData
from models.user import User
from models.userdata import PatientAnalysis
from routers.auth_router import (
    get_current_admin,
    get_current_admin_or_assistant,
    get_optional_user,
)
from services.analyze_workflow_service import (
    analyze_and_store,
    build_pdf_report_data,
    build_pdf_report_data_by_id,
    store_raw_analysis,
)
from services.pdf_services import generate_pdf_report as generate_pdf_file
from utils.admin_permissions import (
    filter_payload_by_permissions,
    get_effective_admin_permissions,
)
from utils.audit_helper import record_audit_log
from utils.database import get_db
from utils.privacy import (
    child_audit_reference,
    get_child_privacy_enabled,
    redact_child_payload,
)

router = APIRouter(tags=["Tahlil"])
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Uvicorn development console can be detached from the terminal that reports a
# browser error.  Keep a small rotating error log so a 500 from this endpoint
# can be diagnosed without logging the patient payload itself.
_error_log_path = Path(__file__).resolve().parent.parent / "logs" / "analyze_errors.log"
_error_log_path.parent.mkdir(parents=True, exist_ok=True)
if not any(
    isinstance(handler, RotatingFileHandler)
    and Path(handler.baseFilename) == _error_log_path
    for handler in logger.handlers
):
    _error_handler = RotatingFileHandler(
        _error_log_path,
        maxBytes=1_000_000,
        backupCount=3,
        encoding="utf-8",
    )
    _error_handler.setLevel(logging.ERROR)
    _error_handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    )
    logger.addHandler(_error_handler)


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
    idempotency_key: Optional[str] = Header(
        default=None, alias="Idempotency-Key", max_length=120
    ),
):
    try:
        if idempotency_key and current_user:
            existing = (
                db.query(PatientAnalysis)
                .filter(
                    PatientAnalysis.created_by_id == current_user.id,
                    PatientAnalysis.offline_submission_id == idempotency_key,
                )
                .first()
            )
            if existing:
                return {
                    "status": "duplicate",
                    "id": existing.id,
                    "id_code": existing.id_code,
                    "message": "Bu offline yozuv avval sinxronlangan.",
                }
        result = analyze_and_store(
            data,
            db,
            request,
            lang=lang,
            current_user=current_user,
            offline_submission_id=idempotency_key if current_user else None,
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
        error_id = uuid4().hex[:12]
        import traceback as _tb
        _tb_str = _tb.format_exc()
        logger.exception("To'liq tahlilda xato [error_id=%s]", error_id)
        # Xatoni alohida faylga ham yozamiz (debug uchun)
        try:
            with open("analyze_debug.log", "a", encoding="utf-8") as _f:
                _f.write(f"\n{'='*60}\nerror_id={error_id}\nexc={exc}\n{_tb_str}\n")
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Tahlil yoki saqlash xatosi [{error_id}]: {exc}",
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
            report_data = redact_child_payload(
                report_data,
                current_user,
                privacy_enabled=get_child_privacy_enabled(db, current_user),
            )
        else:
            report_data = redact_child_payload(report_data, force=True)
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
        report_data = redact_child_payload(
            report_data,
            current_user,
            privacy_enabled=get_child_privacy_enabled(db, current_user),
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
