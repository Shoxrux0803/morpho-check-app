from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.schemas import PatientData
from models.user import User
from models.userdata import PatientAnalysis
from services.ai_advice_service import generate_parent_tips
from services.analyze_service import (
    build_growth_standards,
    build_progress_tracking,
    calculate_bmi,
    generate_advices,
    generate_region_based_id,
    get_bmi_range_by_age_and_gender,
    get_ideal_weight_by_age_and_gender,
    _split_region_and_district,
)
from services.cache_service import cache_service
from services.clinical_service import clinical_service
from services.indices_service import calculate_detailed_indices
from services.ml_service import get_ml_predictions
from utils.audit_helper import record_audit_log
from utils.clickhouse import insert_analysis_event  # ClickHouse sync


def store_raw_analysis(
    data: Dict[str, Any], db: Session, current_user: User
) -> PatientAnalysis:
    rec = PatientAnalysis(**data)
    rec.created_by_id = current_user.id
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def _ml_payload(
    data: PatientData, analysis: Dict[str, Any], gender_norm: str
) -> Dict[str, Any]:
    return {
        "age": int(data.age),
        "gender": gender_norm,
        "height": float(data.height),
        "bmi": float(analysis["bmi"]),
        "z_score": float(analysis["z_score"]),
        "somatotype": str(analysis["somatotype"]),
        "father_height": float(data.father_height) if data.father_height else None,
        "mother_height": float(data.mother_height) if data.mother_height else None,
    }


def _analysis_cache_payload(data: PatientData, lang: str) -> Dict[str, Any]:
    return {"lang": lang, "patient": data.model_dump(mode="json", by_alias=True)}


def build_fast_analysis_context(
    data: PatientData, db: Session, lang: str = "uz"
) -> Dict[str, Any]:
    cache_key = cache_service.make_key(
        "analysis:fast-context:v1", _analysis_cache_payload(data, lang)
    )
    cached = cache_service.get_json(cache_key)
    if cached is not None:
        return cached

    all_settings = clinical_service.get_all_settings(db)
    gender_norm = (data.gender or "").strip().lower()
    analysis = calculate_bmi(data, all_settings, lang=lang)
    advices = generate_advices(
        analysis["bmi"],
        analysis["weight_diff"],
        int(data.age),
        gender_norm,
        all_settings,
        bio_data=analysis["indices"],
        lang=lang,
    )
    ml_predictions = get_ml_predictions(
        _ml_payload(data, analysis, gender_norm), lang=lang
    )
    ai_tips = generate_parent_tips(
        patient_data={
            "age": int(data.age),
            "gender": gender_norm,
            "bmi": analysis["bmi"],
            "z_score": analysis["z_score"],
        },
        ml_predictions=ml_predictions,
        lang=lang,
    )
    result = {
        "gender_norm": gender_norm,
        "analysis": analysis,
        "advices": advices,
        "ml_predictions": ml_predictions,
        "ai_tips": ai_tips,
    }
    cache_service.set_json(cache_key, result)
    return result


def analyze_and_store(
    data: PatientData,
    db: Session,
    request: Request,
    lang: str = "uz",
    current_user: Optional[User] = None,
) -> Dict[str, Any]:
    fast_context = build_fast_analysis_context(data, db, lang=lang)
    gender_norm = fast_context["gender_norm"]
    analysis = fast_context["analysis"]
    advices = fast_context["advices"]
    ml_predictions = fast_context["ml_predictions"]
    clean_region, clean_district = _split_region_and_district(
        data.region, getattr(data, "district", None)
    )
    id_code = generate_region_based_id(db, clean_region)
    full_name = f"{data.first_name} {data.last_name}".strip()

    rec = PatientAnalysis(
        name=full_name,
        id_code=id_code,
        region=clean_region,
        district=clean_district,
        mahalla=(data.mahalla or "").strip() or None,
        address=(data.address or "").strip() or None,
        age=data.age,
        age_months=data.age_months,
        age_days=data.age_days,
        gender=gender_norm,
        height=float(data.height),
        weight=float(data.weight),
        chest=float(data.chest),
        waist=float(data.waist or 0.0),
        hip=0.0,
        head=float(data.head),
        father_height=float(data.father_height) if data.father_height else None,
        mother_height=float(data.mother_height) if data.mother_height else None,
        parents_phone=(data.parents_phone or "").strip() or None,
        examination_date=data.examination_date,
        birth_date=data.birth_date,
        preschool_institution=data.preschool_institution,
        shoulder_length=data.shoulder_length,
        shoulder_breadth=data.shoulder_breadth,
        shoulder_circumference=data.shoulder_circumference,
        arm_elbow_length=data.arm_elbow_length,
        hand_length=data.hand_length,
        thigh_length=data.thigh_length,
        thigh_circumference=data.thigh_circumference,
        calf_length=data.calf_length,
        calf_circumference=data.calf_circumference,
        foot_length=data.foot_length,
        body_length=data.body_length,
        bmi=float(analysis["bmi"]),
        z_score=float(analysis["z_score"]),
        somatotype=str(analysis["somatotype"]),
        total_body_water=data.total_body_water,
        fat_percent=data.fat_percent,
        fat_mass=data.fat_mass,
        muscle_mass=data.muscle_mass,
        bone_mass=data.bone_mass,
        acm=data.acm,
        visceral_fat=data.visceral_fat,
        doctor_note=(data.doctor_note or "").strip() or None,
        consent_confirmed=1 if data.consent_confirmed else 0,
        consent_guardian_name=(data.consent_guardian_name or "").strip() or None,
        consent_guardian_relationship=(data.consent_guardian_relationship or "").strip()
        or None,
        consent_guardian_phone=(
            data.consent_guardian_phone or data.parents_phone or ""
        ).strip()
        or None,
        consent_confirmed_at=datetime.utcnow() if data.consent_confirmed else None,
        consent_policy_version=data.consent_policy_version,
        recommendations=(
            f"Sport: {advices.get('sport', '')}; "
            f"Specialist: {advices.get('specialist', '')}; "
            f"Checkups: {advices.get('checkups', '')}"
        ),
        created_by_id=current_user.id if current_user else None,
    )
    db.add(rec)

    if current_user:
        now = datetime.utcnow()
        if current_user.last_form_open_at:
            diff = (now - current_user.last_form_open_at).total_seconds()
            if 0 < diff < 3600:
                current_user.total_entry_time_seconds = (
                    current_user.total_entry_time_seconds or 0
                ) + diff
                current_user.completed_entries_count = (
                    current_user.completed_entries_count or 0
                ) + 1
        current_user.last_form_open_at = None

    db.commit()
    db.refresh(rec)

    growth_standards = build_growth_standards(data, analysis)
    progress_tracking = build_progress_tracking(db, rec, full_name)
    record_audit_log(
        db=db,
        user_id=current_user.id if current_user else None,
        action="CREATE",
        target_type="PatientAnalysis",
        target_id=rec.id,
        details=f"Yangi tahlil yaratildi: {full_name} ({id_code})",
        request=request,
    )

    # ClickHouse ga ma'lumot jo'natish (analytics uchun)
    try:
        from routers.admin_router import to_dict_analysis

        insert_analysis_event(to_dict_analysis(rec))
    except Exception:
        pass

    ai_tips = fast_context["ai_tips"]

    return {
        "status": "success",
        "id": rec.id,
        "ai_parent_tips": ai_tips,
        "patient_info": {
            "id_code": id_code,
            "full_name": full_name,
            "age": data.age,
            "age_months": data.age_months,
            "age_days": data.age_days,
            "gender": gender_norm,
            "region": clean_region,
            "district": clean_district,
            "mahalla": data.mahalla,
            "address": data.address,
            "birth_date": data.birth_date,
            "examination_date": data.examination_date,
            "doctor_note": data.doctor_note,
            "parents_phone": data.parents_phone,
            "consent_confirmed": data.consent_confirmed,
            "consent_guardian_name": data.consent_guardian_name,
            "consent_guardian_relationship": data.consent_guardian_relationship,
            "consent_guardian_phone": data.consent_guardian_phone,
            "consent_policy_version": data.consent_policy_version,
        },
        "measurements": {
            "height": data.height,
            "weight": data.weight,
            "chest": data.chest,
            "waist": data.waist,
            "head": data.head,
        },
        "analysis": analysis,
        "risk_flags": growth_standards["metrics"],
        "growth_standards": growth_standards,
        "progress_tracking": progress_tracking,
        "advices": advices,
        "ai_predictions": ml_predictions,
    }


def build_pdf_report_data(
    data: PatientData, db: Session, lang: str = "uz"
) -> Dict[str, Any]:
    fast_context = build_fast_analysis_context(data, db, lang=lang)
    analysis = fast_context["analysis"]
    ai_preds = fast_context["ml_predictions"]
    advices = fast_context["advices"]
    ai_tips = fast_context["ai_tips"]

    report_data = data.model_dump(by_alias=True)
    report_data["analysis"] = analysis
    report_data["ai_predictions"] = ai_preds
    report_data["advices"] = advices
    report_data["ai_parent_tips"] = ai_tips
    report_data["doctor_note"] = data.doctor_note
    report_data["parents_phone"] = data.parents_phone
    report_data["consent_confirmed"] = data.consent_confirmed
    report_data["consent_guardian_name"] = data.consent_guardian_name
    report_data["consent_guardian_relationship"] = data.consent_guardian_relationship
    report_data["consent_guardian_phone"] = data.consent_guardian_phone
    report_data["consent_policy_version"] = data.consent_policy_version
    return report_data


class _StoredAnalysisData(BaseModel):
    age: int = 0
    gender: str = ""
    height: float = 0.0
    weight: float = 0.0
    chest: float = 0.0
    waist: float = 0.0
    head: float = 0.0
    shoulder_length: float = 0.0
    shoulder_breadth: float = 0.0
    shoulder_circumference: float = 0.0
    arm_elbow_length: float = 0.0
    hand_length: float = 0.0
    thigh_length: float = 0.0
    thigh_circumference: float = 0.0
    calf_length: float = 0.0
    calf_circumference: float = 0.0
    foot_length: float = 0.0
    body_length: Optional[float] = None
    total_body_water: Optional[float] = None
    fat_percent: Optional[float] = None
    fat_mass: Optional[float] = None
    muscle_mass: Optional[float] = None
    bone_mass: Optional[float] = None
    acm: Optional[float] = None
    visceral_fat: Optional[float] = None


def build_pdf_report_data_by_id(
    patient_id: int, db: Session, lang: str = "uz"
) -> Dict[str, Any]:
    rec = db.query(PatientAnalysis).filter(PatientAnalysis.id == patient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Bemor topilmadi: id={patient_id}")

    name_parts = (rec.name or "").split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    mini = _StoredAnalysisData(
        age=rec.age or 0,
        gender=rec.gender or "",
        height=rec.height or 0,
        weight=rec.weight or 0,
        chest=rec.chest or 0,
        waist=rec.waist or 0,
        head=rec.head or 0,
        shoulder_length=rec.shoulder_length or 0,
        shoulder_breadth=rec.shoulder_breadth or 0,
        shoulder_circumference=rec.shoulder_circumference or 0,
        arm_elbow_length=rec.arm_elbow_length or 0,
        hand_length=rec.hand_length or 0,
        thigh_length=rec.thigh_length or 0,
        thigh_circumference=rec.thigh_circumference or 0,
        calf_length=rec.calf_length or 0,
        calf_circumference=rec.calf_circumference or 0,
        foot_length=rec.foot_length or 0,
        body_length=rec.body_length,
        total_body_water=rec.total_body_water,
        fat_percent=rec.fat_percent,
        fat_mass=rec.fat_mass,
        muscle_mass=rec.muscle_mass,
        bone_mass=rec.bone_mass,
        acm=rec.acm,
        visceral_fat=rec.visceral_fat,
    )

    h2 = (mini.height / 100.0) ** 2 if mini.height > 0 else 1
    bmi_val = round(mini.weight / h2, 1) if h2 > 0 else 0
    manual_bio = {
        "body_length": mini.body_length,
        "total_body_water": mini.total_body_water,
        "fat_percent": mini.fat_percent,
        "fat_mass": mini.fat_mass,
        "muscle_mass": mini.muscle_mass,
        "bone_mass": mini.bone_mass,
        "acm": mini.acm,
        "visceral_fat": mini.visceral_fat,
    }
    all_settings = clinical_service.get_all_settings(db)
    detailed = calculate_detailed_indices(
        mini.age,
        mini.gender,
        mini.height,
        mini.weight,
        bmi_val,
        manual_bio,
        lang=lang,
        all_settings=all_settings,
    )
    ideal_range = get_bmi_range_by_age_and_gender(mini.age, mini.gender)
    ideal_w = get_ideal_weight_by_age_and_gender(mini.age, mini.height, mini.gender)
    analysis = {
        "bmi": bmi_val,
        "bmi_category": rec.somatotype or "",
        "somatotype": detailed.get("morphological_type", rec.somatotype or ""),
        "ideal_weight": ideal_w,
        "ideal_weight_range": {
            "min": round(ideal_range["min"] * h2, 1),
            "max": round(ideal_range["max"] * h2, 1),
        },
        "weight_diff": round(mini.weight - ideal_w, 1),
        "z_score": rec.z_score or 0,
        "shoulder_ratio": round((mini.shoulder_breadth / mini.height) * 100, 1)
        if mini.height > 0 and mini.shoulder_breadth
        else 0,
        "thigh_ratio": round((mini.thigh_circumference / mini.height) * 100, 1)
        if mini.height > 0 and mini.thigh_circumference
        else 0,
        "indices": detailed,
    }
    advices = generate_advices(
        analysis["bmi"],
        analysis["weight_diff"],
        int(mini.age),
        (mini.gender or "").lower(),
        all_settings,
        bio_data=analysis["indices"],
        lang=lang,
    )
    ai_preds = get_ml_predictions(
        {
            "age": int(mini.age),
            "gender": (mini.gender or "").lower(),
            "height": float(mini.height),
            "bmi": float(analysis["bmi"]),
            "z_score": float(analysis["z_score"]),
            "somatotype": str(analysis["somatotype"]),
            "father_height": float(rec.father_height) if rec.father_height else None,
            "mother_height": float(rec.mother_height) if rec.mother_height else None,
        },
        lang=lang,
    )
    ai_tips = generate_parent_tips(
        patient_data={
            "age": int(mini.age),
            "gender": (mini.gender or "").lower(),
            "bmi": analysis["bmi"],
            "z_score": analysis["z_score"],
        },
        ml_predictions=ai_preds,
        lang=lang,
    )
    return {
        "first_name": first_name,
        "last_name": last_name,
        "age": rec.age or 0,
        "age_months": rec.age_months or 0,
        "age_days": rec.age_days or 0,
        "gender": rec.gender or "",
        "birth_date": rec.birth_date or "",
        "examination_date": rec.examination_date or "",
        "preschool_institution": rec.preschool_institution or "",
        "region": rec.region or "",
        "district": rec.district or "",
        "mahalla": getattr(rec, "mahalla", None) or "",
        "address": rec.address or "",
        "parents_phone": rec.parents_phone or "",
        "consent_confirmed": bool(getattr(rec, "consent_confirmed", 0)),
        "consent_guardian_name": getattr(rec, "consent_guardian_name", None) or "",
        "consent_guardian_relationship": getattr(
            rec, "consent_guardian_relationship", None
        )
        or "",
        "consent_guardian_phone": getattr(rec, "consent_guardian_phone", None) or "",
        "consent_confirmed_at": getattr(rec, "consent_confirmed_at", None),
        "consent_policy_version": getattr(rec, "consent_policy_version", None) or "",
        "analysis": analysis,
        "advices": advices,
        "ai_parent_tips": ai_tips,
        "ai_predictions": ai_preds,
        "doctor_note": rec.doctor_note or "",
        "record_url": f"/admin?analysis_id={rec.id}",
    }
