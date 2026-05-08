from fastapi import APIRouter, Request, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from io import BytesIO

from services.pdf_services import generate_pdf_file
from services.docx_services import generate_docx_report
from services.clinical_service import clinical_service
from routers.analyze_router import PatientData, calculate_bmi, generate_advices, generate_region_based_id
from utils.database import get_db
from models.userdata import PatientAnalysis
from sqlalchemy.orm import Session
from utils.audit_helper import record_audit_log
from routers.auth_router import get_current_admin
from models.user import User
from services.ml_service import get_ml_predictions
from utils.date_utils import calculate_age_precise
from services.ai_advice_service import generate_parent_tips

router = APIRouter(tags=["PDF / DOCX Generatsiya"])


def _frontend_base_url(request: Request) -> str:
    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin:
        return origin.split("/admin", 1)[0].rstrip("/")
    return str(request.base_url).rstrip("/")


class PDFRequest(BaseModel):
    patient_data: dict
    analysis: dict
    advices: dict


@router.post(
    "/report",
    response_description="PDF faylini yaratish",
    responses={
        200: {"content": {"application/pdf": {}}},
        400: {"description": "Noto'g'ri so'rov formati"},
        500: {"description": "Server xatosi"},
    },
)
async def generate_pdf_endpoint(
    request: Request,
    request_data: PatientData,
    lang: str = Query(default="uz", description="Til: uz, ru, en, kz"),
    db: Session = Depends(get_db)
):
    try:
        # Yoshni qayta hisoblash (umumiy xatoni to'g'irlash uchun)
        y, m, d = calculate_age_precise(request_data.birth_date, request_data.examination_date)
        if y is not None:
            request_data.age = y
            request_data.age_months = m
            request_data.age_days = d

        all_settings = clinical_service.get_all_settings(db)
        analysis = calculate_bmi(request_data, all_settings, lang=lang)
        gender_norm = (request_data.gender or "").strip().lower()
        advices = generate_advices(
            analysis["bmi"],
            analysis["weight_diff"],
            int(request_data.age),
            gender_norm,
            all_settings,
            bio_data=analysis.get("indices"),
            lang=lang
        )

        data_dict = request_data.model_dump(by_alias=False)

        if not data_dict.get("id_code"):
            clean_region = (data_dict.get("region") or "").strip()
            data_dict["id_code"] = generate_region_based_id(db, clean_region)
        qr_id = data_dict.get("analysis_id") or data_dict.get("analysisId")
        if qr_id:
            data_dict["record_url"] = _frontend_base_url(request) + f"/admin?analysis_id={qr_id}"

        data_dict["analysis"] = analysis
        data_dict["advices"] = advices
        data_dict["doctor_note"] = getattr(request_data, "doctor_note", None)

        # AI Predictions
        ml_data = {
            "age": int(request_data.age),
            "gender": gender_norm,
            "height": float(request_data.height),
            "bmi": float(analysis["bmi"]),
            "z_score": float(analysis["z_score"]),
            "somatotype": str(analysis["somatotype"]),
            "father_height": float(request_data.father_height) if request_data.father_height else None,
            "mother_height": float(request_data.mother_height) if request_data.mother_height else None
        }
        data_dict["ai_predictions"] = get_ml_predictions(ml_data)
        
        # Add AI Parent Tips
        data_dict["ai_parent_tips"] = generate_parent_tips(
            {
                "age": int(request_data.age),
                "gender": gender_norm,
                "bmi": float(analysis["bmi"]),
                "z_score": float(analysis["z_score"])
            },
            data_dict["ai_predictions"],
            lang=lang
        )

        buffer = generate_pdf_file(data_dict, lang=lang)

        if not isinstance(buffer, BytesIO):
            raise HTTPException(status_code=500, detail="PDF generatsiyasi noto'g'ri formatda")

        buffer.seek(0)
        return StreamingResponse(
            content=buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{lang}.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF generatsiyasida xato: {str(e)}")


@router.get(
    "/report-by-id/{patient_id}",
    response_description="Admin panel uchun ID bo'yicha PDF hisobot",
    responses={200: {"content": {"application/pdf": {}}}, 404: {"description": "Bemor topilmadi"}},
)
async def generate_pdf_by_id_endpoint(
    patient_id: int,
    request: Request,
    lang: str = Query(default="uz", description="Til: uz, ru, en, kz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Admin panel: DB dan bemor topib, tanlangan tilda PDF qaytaradi."""
    from routers.analyze_router import (
        get_bmi_range_by_age_and_gender,
        get_ideal_weight_by_age_and_gender,
    )
    from services.indices_service import calculate_detailed_indices

    rec = db.query(PatientAnalysis).filter(PatientAnalysis.id == patient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Bemor topilmadi: id={patient_id}")
    if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ushbu hisobotni yuklab olishga huquqingiz yo'q")

    try:
        name_parts = (rec.name or "").split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        h = rec.height or 0
        w = rec.weight or 0
        h2 = (h / 100.0) ** 2 if h > 0 else 1
        bmi_val = round(w / h2, 1) if h2 > 0 else 0

        manual_bio = {
            "body_length": rec.body_length,
            "total_body_water": rec.total_body_water,
            "fat_percent": rec.fat_percent,
            "fat_mass": rec.fat_mass,
            "muscle_mass": rec.muscle_mass,
            "bone_mass": rec.bone_mass,
            "acm": rec.acm,
            "visceral_fat": rec.visceral_fat,
        }
        # Recalculate age
        y, m, d = calculate_age_precise(rec.birth_date, rec.examination_date)
        actual_age = y if y is not None else (rec.age or 0)
        actual_months = m if y is not None else (rec.age_months or 0)
        actual_days = d if y is not None else (rec.age_days or 0)

        detailed = calculate_detailed_indices(actual_age, rec.gender or "", h, w, bmi_val, manual_bio, lang=lang)

        ideal_range = get_bmi_range_by_age_and_gender(actual_age, rec.gender or "")
        min_w = round(ideal_range["min"] * h2, 1)
        max_w = round(ideal_range["max"] * h2, 1)
        ideal_w = get_ideal_weight_by_age_and_gender(actual_age, h, rec.gender or "")

        # Localize BMI category
        from routers.analyze_router import BMI_CATEGORIES
        bmi_cat_key = "normal"
        if bmi_val < 16.0: bmi_cat_key = "v_low"
        elif bmi_val < 18.5: bmi_cat_key = "low"
        elif bmi_val < 25: bmi_cat_key = "normal"
        elif bmi_val < 30: bmi_cat_key = "overweight"
        else: bmi_cat_key = "obese"
        
        cat_info = BMI_CATEGORIES.get(bmi_cat_key, BMI_CATEGORIES.get("normal", {}))
        bmi_category_localized = cat_info.get(lang, cat_info.get("uz", "Noma'lum"))

        sh_breadth = rec.shoulder_breadth or 0
        th_circ = rec.thigh_circumference or 0

        analysis = {
            "bmi": bmi_val,
            "bmi_category": bmi_category_localized,
            "somatotype": detailed.get("morphological_type", ""),
            "ideal_weight": ideal_w,
            "ideal_weight_range": {"min": min_w, "max": max_w},
            "weight_diff": round(w - ideal_w, 1),
            "z_score": rec.z_score or 0,
            "shoulder_ratio": round((sh_breadth / h) * 100, 1) if h > 0 and sh_breadth else 0,
            "thigh_ratio": round((th_circ / h) * 100, 1) if h > 0 and th_circ else 0,
            "indices": detailed,
        }


        report_data = {
            "first_name": first_name,
            "last_name": last_name,
            "age": actual_age,
            "age_months": actual_months,
            "age_days": actual_days,
            "gender": rec.gender or "",
            "birth_date": rec.birth_date or "",
            "examination_date": rec.examination_date or "",
            "preschool_institution": rec.preschool_institution or "",
            "region": rec.region or "",
            "district": rec.district or "",
            "mahalla": getattr(rec, "mahalla", None) or "",
            "address": rec.address or "",
            "id_code": rec.id_code or "",
            "analysis": analysis,
            "doctor_note": rec.doctor_note or "",
            "record_url": _frontend_base_url(request) + f"/admin?analysis_id={rec.id}",
        }

        # AI Predictions
        ml_data = {
            "age": int(actual_age),
            "gender": (rec.gender or "").lower(),
            "height": float(rec.height or 0),
            "bmi": float(analysis["bmi"]),
            "z_score": float(analysis["z_score"]),
            "somatotype": str(analysis["somatotype"]),
            "father_height": float(rec.father_height) if rec.father_height else None,
            "mother_height": float(rec.mother_height) if rec.mother_height else None
        }
        report_data["ai_predictions"] = get_ml_predictions(ml_data)
        
        # Add AI Parent Tips
        report_data["ai_parent_tips"] = generate_parent_tips(
            {
                "age": int(actual_age),
                "gender": (rec.gender or "").lower(),
                "bmi": float(analysis["bmi"]),
                "z_score": float(analysis["z_score"])
            },
            report_data["ai_predictions"],
            lang=lang
        )

        buffer = generate_pdf_file(report_data, lang=lang)
        buffer.seek(0)
        
        if current_user:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="DOWNLOAD",
                target_type="PatientAnalysis",
                target_id=rec.id,
                details=f"Bemor hisoboti (PDF) yuklab olindi: {rec.name}",
                request=request
            )
            
        return StreamingResponse(
            content=buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{patient_id}_{lang}.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF yaratishda xato: {str(e)}")


@router.get(
    "/report-docx-by-id/{patient_id}",
    response_description="Admin panel uchun ID bo'yicha DOCX hisobot",
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}
            }
        },
        404: {"description": "Bemor topilmadi"},
        500: {"description": "Server xatosi"},
    },
)
async def generate_docx_by_id_endpoint(
    patient_id: int,
    request: Request,
    lang: str = Query(default="uz", description="Til: uz, ru, en, kz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Admin panel: DB dan bemor topib, tanlangan tilda DOCX (anketa) qaytaradi."""
    from routers.analyze_router import (
        get_bmi_range_by_age_and_gender,
        get_ideal_weight_by_age_and_gender,
    )
    from services.indices_service import calculate_detailed_indices

    rec = db.query(PatientAnalysis).filter(PatientAnalysis.id == patient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Bemor topilmadi: id={patient_id}")
    if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ushbu hujjatni yuklab olishga huquqingiz yo'q")

    try:
        name_parts = (rec.name or "").split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        h = rec.height or 0
        w = rec.weight or 0
        h2 = (h / 100.0) ** 2 if h > 0 else 1
        bmi_val = round(w / h2, 1) if h2 > 0 else 0

        manual_bio = {
            "body_length": rec.body_length,
            "total_body_water": rec.total_body_water,
            "fat_percent": rec.fat_percent,
            "fat_mass": rec.fat_mass,
            "muscle_mass": rec.muscle_mass,
            "bone_mass": rec.bone_mass,
            "acm": rec.acm,
            "visceral_fat": rec.visceral_fat,
        }
        # Recalculate age
        y, m, d = calculate_age_precise(rec.birth_date, rec.examination_date)
        actual_age = y if y is not None else (rec.age or 0)
        actual_months = m if y is not None else (rec.age_months or 0)
        actual_days = d if y is not None else (rec.age_days or 0)

        detailed = calculate_detailed_indices(actual_age, rec.gender or "", h, w, bmi_val, manual_bio, lang=lang)

        ideal_range = get_bmi_range_by_age_and_gender(actual_age, rec.gender or "")
        min_w = round(ideal_range["min"] * h2, 1)
        max_w = round(ideal_range["max"] * h2, 1)
        ideal_w = get_ideal_weight_by_age_and_gender(actual_age, h, rec.gender or "")

        # Localize BMI category
        from routers.analyze_router import BMI_CATEGORIES
        bmi_cat_key = "normal"
        if bmi_val < 16.0: bmi_cat_key = "v_low"
        elif bmi_val < 18.5: bmi_cat_key = "low"
        elif bmi_val < 25: bmi_cat_key = "normal"
        elif bmi_val < 30: bmi_cat_key = "overweight"
        else: bmi_cat_key = "obese"
        
        cat_info = BMI_CATEGORIES.get(bmi_cat_key, BMI_CATEGORIES.get("normal", {}))
        bmi_category_localized = cat_info.get(lang, cat_info.get("uz", "Noma'lum"))

        sh_breadth = rec.shoulder_breadth or 0
        th_circ = rec.thigh_circumference or 0

        analysis = {
            "bmi": bmi_val,
            "bmi_category": bmi_category_localized,
            "somatotype": detailed.get("morphological_type", ""),
            "ideal_weight": ideal_w,
            "ideal_weight_range": {"min": min_w, "max": max_w},
            "weight_diff": round(w - ideal_w, 1),
            "z_score": rec.z_score or 0,
            "shoulder_ratio": round((sh_breadth / h) * 100, 1) if h > 0 and sh_breadth else 0,
            "thigh_ratio": round((th_circ / h) * 100, 1) if h > 0 and th_circ else 0,
            "indices": detailed,
        }

        report_data = {
            "first_name": first_name,
            "last_name": last_name,
            "age": actual_age,
            "age_months": actual_months,
            "age_days": actual_days,
            "gender": rec.gender or "",
            "birth_date": rec.birth_date or "",
            "examination_date": rec.examination_date or "",
            "preschool_institution": rec.preschool_institution or "",
            "region": rec.region or "",
            "district": rec.district or "",
            "mahalla": getattr(rec, "mahalla", None) or "",
            "address": rec.address or "",
            "id_code": rec.id_code or "",
            "analysis": analysis,
        }

        # Barcha qo'shimcha ko'rsatkichlarni report_data'ga o'tkazamiz (DOCX uchun kerak)
        for col in [
            "height", "weight", "head", "chest", "waist", "shoulder_length", 
            "shoulder_breadth", "shoulder_circumference", "arm_elbow_length", 
            "hand_length", "thigh_length", "thigh_circumference", "calf_length", 
            "calf_circumference", "foot_length", "body_length"
        ]:
            report_data[col] = getattr(rec, col, 0) or 0

        buffer = generate_docx_report(report_data, lang=lang)
        buffer.seek(0)
        
        if current_user:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="DOWNLOAD",
                target_type="PatientAnalysis",
                target_id=rec.id,
                details=f"Bemor anketasi (DOCX) yuklab olindi: {rec.name}",
                request=request
            )
            
        return StreamingResponse(
            content=buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_anketa_{patient_id}_{lang}.docx",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"DOCX yaratishda xato: {str(e)}")


@router.post(
    "/generate-docx",
    response_description="DOCX faylini yaratish",
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}
            }
        },
        400: {"description": "Noto'g'ri so'rov formati"},
        500: {"description": "Server xatosi"},
    },
)
async def generate_docx_endpoint(
    request_data: PatientData,
    lang: str = Query(default="uz", description="Til: uz, ru, en, kz"),
    db: Session = Depends(get_db)
):
    """
    Kiritilgan ma'lumotlardan kirillcha DOCX anketasi yaratib yuklaydi.
    """
    try:
        # Reconstruct full data payload for docx builder
        all_settings = clinical_service.get_all_settings(db)
        analysis = calculate_bmi(request_data, all_settings, lang=lang)
        gender_norm = (request_data.gender or "").strip().lower()
        advices = generate_advices(
            analysis["bmi"],
            analysis["weight_diff"],
            int(request_data.age),
            gender_norm,
            all_settings,
            bio_data=analysis["indices"],
            lang=lang
        )
        
        data_dict = request_data.model_dump(by_alias=False)
        
        # Ensure ID code is present
        if not data_dict.get("id_code"):
            clean_region = (data_dict.get("region") or "").strip()
            data_dict["id_code"] = generate_region_based_id(db, clean_region)

        data_dict["analysis"] = analysis
        data_dict["advices"] = advices

        buffer = generate_docx_report(data_dict, lang=lang)

        if not isinstance(buffer, BytesIO):
            raise HTTPException(status_code=500, detail="DOCX generatsiyasi noto'g'ri formatda")

        buffer.seek(0)
        return StreamingResponse(
            content=buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=morphocheck_anketa.docx",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"DOCX generatsiyasida xato: {str(e)}")
