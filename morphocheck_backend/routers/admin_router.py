import logging
from datetime import date, datetime, timedelta
from io import BytesIO
from typing import List, Optional

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt, RGBColor
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile
from fastapi.responses import StreamingResponse
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from pydantic import BaseModel
from sqlalchemy import asc, case, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from models.audit import AuditLog
from models.blocked_ip import BlockedIP
from models.payment import Payment
from models.security_event import SecurityEvent
from models.schemas import (
    PatientData,
    PaymentCreate,
    PaymentOut,
    UserCreate,
    UserOut,
    UserUpdate,
    BlockIPRequest,
)
from models.user import User
from models.userdata import PatientAnalysis, ResearchRecord
from routers.auth_router import (
    get_current_admin,
    get_current_superadmin,
    get_current_user,
    get_current_admin_or_assistant,
)
from services.analyze_service import (
    _split_region_and_district,
    generate_advices,
)
from services.analyze_service import (
    calculate_bmi as calc_full_bmi,
)
from services.cache_service import cache_service
from services.clinical_service import clinical_service
from utils.admin_permissions import filter_payload_by_permissions, get_effective_admin_permissions, serialize_admin_permissions
from utils.audit_helper import record_audit_log
from utils.database import get_db
from utils.security import get_password_hash
from utils.translit import lat2cyr
from utils.blocked_ips import block_ips, is_ip_blocked
from utils.client_intel import describe_ip_location, describe_user_agent
from utils.privacy import (
    CHILD_PII_EXPORT_FIELDS,
    PRIVACY_MANAGED_ROLES,
    ROLE_PRIVACY_DEFAULTS,
    child_audit_reference,
    get_child_privacy_enabled,
    normalize_privacy_role,
    redact_child_payload,
)

# Router prefiksiz: main.py da /api/admin bilan ulangan bo'ladi
router = APIRouter(tags=["Admin"])
logger = logging.getLogger(__name__)

verify_admin = get_current_admin


class LocationPing(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None


# --------------- Yordamchilar ------------------
def split_name(full: Optional[str]) -> tuple[str, str]:
    if not full:
        return "", ""
    parts = full.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def calc_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
    try:
        if not weight_kg or not height_cm:
            return None
        h = float(height_cm) / 100.0
        if h <= 0:
            return None
        return round(float(weight_kg) / (h * h), 1)
    except Exception:
        return None


def normalize_analysis_gender(value: Optional[str]) -> str:
    gender = (value or "").strip().lower()
    if (
        gender in {"ayol", "female", "f", "qiz", "girl"}
        or "ayol" in gender
        or "female" in gender
        or "qiz" in gender
    ):
        return "ayol"
    return "erkak"


def safe_iso_date(value: Optional[str], default: str) -> str:
    text = str(value or "").strip()
    if not text or text in {"Noma'lum", "unknown", "Unknown"}:
        return default
    try:
        date.fromisoformat(text[:10])
        return text[:10]
    except ValueError:
        return default


def build_patient_data_from_analysis(rec: PatientAnalysis) -> PatientData:
    first_name, last_name = split_name(getattr(rec, "name", None))
    today = datetime.now().strftime("%Y-%m-%d")
    return PatientData(
        firstName=first_name or "Noma'lum",
        lastName=last_name or "-",
        region=rec.region or "Noma'lum",
        district=rec.district,
        mahalla=getattr(rec, "mahalla", None),
        address=rec.address or "",
        examinationDate=safe_iso_date(rec.examination_date, today),
        birthDate=safe_iso_date(rec.birth_date, "Noma'lum"),
        preschoolInstitution=rec.preschool_institution or "Noma'lum",
        age=int(rec.age or 0),
        ageMonths=int(rec.age_months or 0),
        ageDays=int(rec.age_days or 0),
        gender=normalize_analysis_gender(rec.gender),
        height=float(rec.height or 0.0),
        weight=float(rec.weight or 0.0),
        chest=float(rec.chest or 0.0),
        waist=float(rec.waist or 0.0),
        head=float(rec.head or 0.0),
        fatherHeight=rec.father_height,
        motherHeight=rec.mother_height,
        parentsPhone=rec.parents_phone,
        consentConfirmed=bool(getattr(rec, "consent_confirmed", 0)),
        consentGuardianName=getattr(rec, "consent_guardian_name", None)
        or "Stored record",
        consentGuardianRelationship=getattr(rec, "consent_guardian_relationship", None)
        or "guardian",
        consentGuardianPhone=getattr(rec, "consent_guardian_phone", None)
        or rec.parents_phone,
        consentPolicyVersion=getattr(rec, "consent_policy_version", None)
        or "helsinki-declaration-consent-v1",
        shoulderLength=float(rec.shoulder_length or 0.0),
        shoulderBreadth=float(rec.shoulder_breadth or 0.0),
        shoulderCircumference=float(rec.shoulder_circumference or 0.0),
        armElbowLength=float(rec.arm_elbow_length or 0.0),
        handLength=float(rec.hand_length or 0.0),
        thighLength=float(rec.thigh_length or 0.0),
        thighCircumference=float(rec.thigh_circumference or 0.0),
        calfLength=float(rec.calf_length or 0.0),
        calfCircumference=float(rec.calf_circumference or 0.0),
        footLength=float(rec.foot_length or 0.0),
        bodyLength=rec.body_length,
        totalBodyWater=rec.total_body_water,
        fatPercent=rec.fat_percent,
        fatMass=rec.fat_mass,
        muscleMass=rec.muscle_mass,
        boneMass=rec.bone_mass,
        acm=rec.acm,
        visceralFat=rec.visceral_fat,
        doctorNote=rec.doctor_note,
    )


def recalculate_analysis_fields(
    rec: PatientAnalysis, db: Session, lang: str = "uz"
) -> dict:
    all_settings = clinical_service.get_all_settings(db)
    analysis = calc_full_bmi(
        build_patient_data_from_analysis(rec), all_settings=all_settings, lang=lang
    )
    rec.bmi = float(analysis["bmi"])
    rec.z_score = float(analysis["z_score"])
    rec.somatotype = str(analysis["somatotype"])
    return analysis


def bmi_status_by_age(bmi: Optional[float], age: Optional[int]) -> str:
    if bmi is None or age is None:
        return "-"
    if age >= 20:
        if bmi < 18.5:
            return "Ozg‘in"
        if bmi < 25:
            return "Normal"
        if bmi < 30:
            return "Ortiqcha"
        return "Semizlik"
    # 2–19: soddalashtirilgan (keyinchalik WHO Z-score bilan almashtirasiz)
    if bmi < 12:
        return "Ozg‘in?"
    if bmi < 18:
        return "Normal?"
    if bmi < 22:
        return "Ortiqcha?"
    return "Semizlik?"


def to_dict_analysis(
    row: PatientAnalysis,
    current_user: Optional[User] = None,
    privacy_enabled: Optional[bool] = None,
) -> dict:
    raw_name = getattr(row, "name", None)
    
    # Маскирование персональных данных для field_assistant
    if current_user and current_user.role == "field_assistant":
        if raw_name:
            parts = raw_name.split()
            if len(parts) > 1:
                masked_name = f"{parts[0]} {parts[1][0]}."
            elif len(parts) == 1:
                masked_name = f"{parts[0][0]}."
            else:
                masked_name = "***"
        else:
            masked_name = "***"
    else:
        masked_name = raw_name

    masked_name = raw_name
    first_name, last_name = split_name(masked_name)
    bmi_val = getattr(row, "bmi", None)
    if bmi_val is None:
        bmi_val = calc_bmi(getattr(row, "weight", None), getattr(row, "height", None))
    payload = {
        "id": getattr(row, "id", None),
        "id_code": getattr(row, "id_code", None),
        "created_at": getattr(row, "created_at", None),
        "name": masked_name,
        "first_name": first_name,
        "last_name": last_name,
        "gender": getattr(row, "gender", None),
        "age": getattr(row, "age", None),
        "age_months": getattr(row, "age_months", None),
        "age_days": getattr(row, "age_days", None),
        "height": getattr(row, "height", None),
        "weight": getattr(row, "weight", None),
        "chest": getattr(row, "chest", None),
        "waist": getattr(row, "waist", None),
        "hip": getattr(row, "hip", None),
        "head": getattr(row, "head", None),
        "bmi": bmi_val,
        "bmi_status": bmi_status_by_age(bmi_val, getattr(row, "age", None)),
        "z_score": getattr(row, "z_score", None),
        "somatotype": getattr(row, "somatotype", None),
        "recommendations": getattr(row, "recommendations", None),
        "ai_recommendations": getattr(row, "ai_recommendations", None),
        "doctor_note": getattr(row, "doctor_note", None),
        "parents_phone": getattr(row, "parents_phone", None),
        "consent_confirmed": bool(getattr(row, "consent_confirmed", 0)),
        "consent_guardian_name": getattr(row, "consent_guardian_name", None),
        "consent_guardian_relationship": getattr(
            row, "consent_guardian_relationship", None
        ),
        "consent_guardian_phone": getattr(row, "consent_guardian_phone", None),
        "consent_confirmed_at": getattr(row, "consent_confirmed_at", None),
        "consent_policy_version": getattr(row, "consent_policy_version", None),
    }
    # Agar modelda mavjud bo'lsa: region, yelka, oyoq uzunliklari va hk
    extra_fields = (
        "region",
        "district",
        "mahalla",
        "address",
        "examination_date",
        "birth_date",
        "preschool_institution",
        "shoulder_length",
        "shoulder_breadth",
        "shoulder_circumference",
        "arm_elbow_length",
        "hand_length",
        "thigh_length",
        "thigh_circumference",
        "calf_length",
        "calf_circumference",
        "foot_length",
    )
    for extra in extra_fields:
        if hasattr(row, extra):
            if current_user and current_user.role == "field_assistant" and extra in ["address", "mahalla"]:
                payload[extra] = "***"
            else:
                payload[extra] = getattr(row, extra)

    # Add creator name if requested
    payload["created_by_id"] = getattr(row, "created_by_id", None)
    if hasattr(row, "created_by") and row.created_by:
        payload["created_by_name"] = row.created_by.name
        payload["created_by_role"] = row.created_by.role
    else:
        payload["created_by_name"] = "Noma'lum"
        payload["created_by_role"] = None

    # Soft delete ma'lumotlari
    payload["is_deleted"] = bool(getattr(row, "is_deleted", False))
    payload["deleted_at"] = getattr(row, "deleted_at", None)
    if hasattr(row, "deleted_by") and row.deleted_by:
        payload["deleted_by_name"] = row.deleted_by.name
    else:
        payload["deleted_by_name"] = None

    if current_user:
        payload = filter_payload_by_permissions(payload, get_effective_admin_permissions(current_user))
        payload = redact_child_payload(
            payload, current_user, privacy_enabled=privacy_enabled
        )

    return payload


USER_LOCATION_FIELDS = (
    "region",
    "district",
    "mahalla",
    "address",
    "latitude",
    "longitude",
)


def clean_user_payload(data: dict, preserve_empty_location: bool = False) -> dict:
    cleaned = dict(data)
    for key in (
        "name",
        "email",
        "phone",
        "role",
        "region",
        "district",
        "mahalla",
        "address",
    ):
        if key in cleaned and isinstance(cleaned[key], str):
            cleaned[key] = cleaned[key].strip()

    for key in ("latitude", "longitude"):
        if key not in cleaned:
            continue
        value = cleaned[key]
        if value in ("", None):
            if preserve_empty_location:
                cleaned.pop(key, None)
            else:
                cleaned[key] = None
            continue
        try:
            cleaned[key] = float(value)
        except (TypeError, ValueError):
            cleaned.pop(key, None)

    if preserve_empty_location:
        for key in USER_LOCATION_FIELDS:
            if cleaned.get(key) == "":
                cleaned.pop(key, None)

    # supervisor_id: empty string or 0 → None (prevents FK constraint errors)
    if "admin_permissions" in cleaned:
        cleaned["admin_permissions"] = serialize_admin_permissions(cleaned["admin_permissions"])

    if "supervisor_id" in cleaned:
        sid = cleaned["supervisor_id"]
        if sid == "" or sid == 0:
            cleaned["supervisor_id"] = None
        elif sid is not None:
            try:
                cleaned["supervisor_id"] = int(sid)
            except (TypeError, ValueError):
                cleaned["supervisor_id"] = None

    return cleaned


def validate_assistant_supervisor(db: Session, role: str, supervisor_id: Optional[int]):
    """Field assistant must belong to one active admin or researcher."""
    if role != "field_assistant":
        return None
    if not supervisor_id:
        raise HTTPException(400, "Field Assistant uchun kurator tanlanishi shart.")
    supervisor = db.get(User, supervisor_id)
    if (
        not supervisor
        or supervisor.role not in {"admin", "researcher"}
        or getattr(supervisor, "is_deleted", 0) == 1
    ):
        raise HTTPException(400, "Kurator faol admin yoki izlanuvchi bo'lishi kerak.")
    return supervisor


# ------------------ USERS ----------------------
@router.get(
    "/users",
    response_model=List[UserOut],
    dependencies=[Depends(get_current_superadmin)],
)
def list_users(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(User).filter(User.is_deleted == 0)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(User.name.ilike(like), User.email.ilike(like), User.phone.ilike(like))
        )
    items = (
        query.options(joinedload(User.supervisor))
        .order_by(User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items


@router.get(
    "/users/deleted",
    response_model=List[UserOut],
    dependencies=[Depends(get_current_superadmin)],
)
def list_deleted_users(db: Session = Depends(get_db)):
    return (
        db.query(User)
        .options(joinedload(User.supervisor))
        .filter(User.is_deleted == 1)
        .order_by(desc(User.deleted_at), desc(User.id))
        .all()
    )


@router.post("/users", response_model=UserOut)
def create_user(
    payload: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    # Check if email exists
    if payload.email:
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise HTTPException(
                400, "Ushbu email bilan foydalanuvchi allaqachon mavjud."
            )

    user_data = clean_user_payload(payload.model_dump(exclude_unset=True))
    role = user_data.get("role", "user")
    if role == "field_assistant":
        validate_assistant_supervisor(db, role, user_data.get("supervisor_id"))
    else:
        user_data["supervisor_id"] = None

    # Hash password if provided
    if "password" in user_data:
        password = user_data.pop("password")
        if password:
            user_data["hashed_password"] = get_password_hash(password)
            user_data["plain_password"] = password

    # Remove password_confirm before DB model creation
    if "password_confirm" in user_data:
        user_data.pop("password_confirm")

    user = User(**user_data)
    db.add(user)
    db.commit()

    # Reload with joinedload to get supervisor_role populated
    user = (
        db.query(User)
        .options(joinedload(User.supervisor))
        .filter(User.id == user.id)
        .first()
    )

    # Audit Log
    record_audit_log(
        db=db,
        user_id=current_admin.id,
        action="CREATE",
        target_type="User",
        target_id=user.id,
        details=f"Yangi foydalanuvchi yaratildi: {user.name} ({user.role})",
        request=request,
    )

    return user


@router.get(
    "/users/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(get_current_superadmin)],
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.supervisor))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    user = (
        db.query(User)
        .options(joinedload(User.supervisor))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(404, "User not found")

    update_data = clean_user_payload(
        payload.model_dump(exclude_unset=True), preserve_empty_location=True
    )

    next_role = update_data.get("role", user.role)
    next_supervisor_id = update_data.get("supervisor_id", user.supervisor_id)
    if next_role == "field_assistant":
        validate_assistant_supervisor(db, next_role, next_supervisor_id)
    else:
        update_data["supervisor_id"] = None

    # Check if new email conflicts with other users
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = (
            db.query(User).filter(User.email == update_data["email"]).first()
        )
        if existing_user:
            raise HTTPException(
                400,
                "Ushbu email allaqachon boshqa foydalanuvchi tomonidan band etilgan.",
            )

    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            user.hashed_password = get_password_hash(password)
            user.plain_password = password

    for k, v in update_data.items():
        setattr(user, k, v)

    db.commit()

    # Reload with joinedload to get supervisor_role populated
    user = (
        db.query(User)
        .options(joinedload(User.supervisor))
        .filter(User.id == user_id)
        .first()
    )

    # Audit Log
    record_audit_log(
        db=db,
        user_id=current_admin.id,
        action="UPDATE",
        target_type="User",
        target_id=user.id,
        details=f"Foydalanuvchi ma'lumotlari yangilandi: {user.name}",
        request=request,
    )

    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    user.is_deleted = 1
    user.deleted_at = datetime.utcnow()
    user.deleted_by_id = current_admin.id
    db.commit()

    # Audit Log
    record_audit_log(
        db=db,
        user_id=current_admin.id,
        action="DELETE",
        target_type="User",
        target_id=user_id,
        details=f"Foydalanuvchi o'chirildi: {user.name}",
        request=request,
    )

    return {"status": "deleted"}


@router.post("/users/{user_id}/restore", response_model=UserOut)
def restore_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    user.is_deleted = 0
    user.deleted_at = None
    user.deleted_by_id = None
    db.commit()

    # Reload with joinedload
    user = (
        db.query(User)
        .options(joinedload(User.supervisor))
        .filter(User.id == user_id)
        .first()
    )

    record_audit_log(
        db=db,
        user_id=current_admin.id,
        action="RESTORE",
        target_type="User",
        target_id=user_id,
        details=f"Foydalanuvchi tiklandi: {user.name}",
        request=request,
    )

    return user


# ---------------- ANALYSES ---------------------
@router.get("/analyses")
def list_analyses(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_assistant),
    q: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    sort_key: str = "created_at",
    sort_dir: str = "desc",
    region: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 20,
    show_deleted: bool = Query(False),  # Super admin uchun o'chirilganlarni ko'rsatish
):
    response.headers["Cache-Control"] = "no-store, private"
    response.headers["Pragma"] = "no-cache"
    base = db.query(PatientAnalysis)

    if current_user.role == "field_assistant":
        base = base.filter(
            PatientAnalysis.created_by_id == current_user.id,
            PatientAnalysis.is_deleted == 0,
        )
    elif current_user.role != "superadmin":
        # Oddiy admin: o'z ma'lumotlari + biriktirilgan assistentlar kiritgan ma'lumotlar
        assistant_ids = db.query(User.id).filter(User.supervisor_id == current_user.id, User.role == "field_assistant").subquery()
        base = base.filter(
            ((PatientAnalysis.created_by_id == current_user.id) | (PatientAnalysis.created_by_id.in_(assistant_ids))) &
            (PatientAnalysis.is_deleted == 0)
        )
    else:
        # Super admin: barcha ma'lumotlar
        # Agar show_deleted=False bo'lsa — faqat o'chirilmaganlar
        if not show_deleted:
            base = base.filter(PatientAnalysis.is_deleted == 0)
        else:
            # show_deleted=True bo'lsa hech qanday filter yo'q — barcha ko'rinadi (o'chirilganlar ham)
            pass

    # Qidiruv
    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.id_code.ilike(like))

    # Filtrlar
    if gender:
        base = base.filter(func.lower(PatientAnalysis.gender) == gender.lower())
    if age_min is not None:
        base = base.filter(PatientAnalysis.age >= age_min)
    if age_max is not None:
        base = base.filter(PatientAnalysis.age <= age_max)
    if date_from:
        start_dt = datetime.combine(date_from, datetime.min.time())
        base = base.filter(PatientAnalysis.created_at >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, datetime.max.time())
        base = base.filter(PatientAnalysis.created_at <= end_dt)
    if region:
        base = base.filter(PatientAnalysis.region == region)

    # Jami
    total = base.with_entities(func.count(PatientAnalysis.id)).scalar() or 0

    # Sort — o'chirilganlar har doim oxirida
    sort_map = {
        "created_at": getattr(PatientAnalysis, "created_at", None),
        "name": getattr(PatientAnalysis, "id_code", None),
        "gender": getattr(PatientAnalysis, "gender", None),
        "age": getattr(PatientAnalysis, "age", None),
        "height": getattr(PatientAnalysis, "height", None),
        "weight": getattr(PatientAnalysis, "weight", None),
        "bmi": getattr(PatientAnalysis, "bmi", None),
        "last_name": getattr(PatientAnalysis, "id_code", None),
    }
    col = sort_map.get(sort_key) or getattr(PatientAnalysis, "created_at", None)
    if col is not None:
        base = base.order_by(asc(col) if sort_dir == "asc" else desc(col))

    base = base.options(
        joinedload(PatientAnalysis.created_by), joinedload(PatientAnalysis.deleted_by)
    )

    items_db = base.offset(max(0, (page - 1) * page_size)).limit(page_size).all()
    privacy_enabled = get_child_privacy_enabled(db, current_user)
    items = [
        to_dict_analysis(r, current_user, privacy_enabled=privacy_enabled)
        for r in items_db
    ]
    return {"items": items, "total": int(total)}


@router.get("/analyses/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_assistant),
):
    rec = db.get(PatientAnalysis, analysis_id)
    if not rec:
        raise HTTPException(404, "Analysis not found")

    # Ownership Check
    if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
        creator = db.get(User, rec.created_by_id)
        if not (creator and creator.supervisor_id == current_user.id):
            raise HTTPException(403, "Ushbu ma'lumotni ko'rishga huquqingiz yo'q")

    return to_dict_analysis(
        rec,
        current_user,
        privacy_enabled=get_child_privacy_enabled(db, current_user),
    )


class AdminDeleteRequestModel(BaseModel):
    ids: List[int]


@router.delete("/analyses")
def delete_analyses(
    payload: AdminDeleteRequestModel,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Soft delete: ma'lumot DB dan o'chirmaydi, is_deleted=1 deb belgilaydi."""
    if not payload.ids:
        return {"deleted": 0}
    try:
        q = db.query(PatientAnalysis).filter(PatientAnalysis.id.in_(payload.ids))
        if current_user.role != "superadmin":
            q = q.filter(PatientAnalysis.created_by_id == current_user.id)

        records = q.all()
        count = 0
        names = []
        for rec in records:
            rec.is_deleted = 1
            rec.deleted_by_id = current_user.id
            rec.deleted_at = datetime.utcnow()
            count += 1
            names.append(child_audit_reference(rec))

        db.commit()

        if count > 0:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="DELETE_SOFT",
                target_type="PatientAnalysis",
                details=f"{count} ta tahlil savatga yuborildi: {', '.join(names[:3])}{'...' if len(names) > 3 else ''}",
                request=request,
            )

        return {"deleted": count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {e}")


@router.post("/analyses/hard-delete")
def hard_delete_analyses(
    payload: AdminDeleteRequestModel,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """Haqiqiy o'chirish — faqat super admin. DB dan butunlay o'chiradi."""
    if not payload.ids:
        return {"deleted": 0}
    try:
        q = db.query(PatientAnalysis).filter(PatientAnalysis.id.in_(payload.ids))
        deleted = q.delete(synchronize_session=False)
        db.commit()

        if deleted:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="DELETE_HARD",
                target_type="PatientAnalysis",
                details=f"{deleted} ta tahlil butunlay o'chirildi (IDlar: {payload.ids[:5]})",
                request=request,
            )

        return {"deleted": int(deleted or 0)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {e}")


@router.post("/analyses/restore")
def restore_analyses(
    payload: AdminDeleteRequestModel,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    """O'chirilgan ma'lumotni tiklash — faqat super admin."""
    if not payload.ids:
        return {"restored": 0}
    try:
        q = db.query(PatientAnalysis).filter(PatientAnalysis.id.in_(payload.ids))
        count = q.update(
            {"is_deleted": 0, "deleted_by_id": None, "deleted_at": None},
            synchronize_session=False,
        )

        db.commit()

        if count:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="RESTORE",
                target_type="PatientAnalysis",
                details=f"{count} ta tahlil savatdan tiklandi (IDlar: {payload.ids[:5]})",
                request=request,
            )

        return {"restored": int(count)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {e}")


@router.put("/analyses/{analysis_id}")
def update_analysis(
    analysis_id: int,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    try:
        rec = db.get(PatientAnalysis, analysis_id)
        if not rec:
            raise HTTPException(404, "Analysis not found")

        # Ownership Check
        if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
            raise HTTPException(403, "Ushbu ma'lumotni o'zgartirishga huquqingiz yo'q")

        # ... logic for update (kept as is) ...
        # (Actually I need to keep the code here to avoid broken endpoint)

        # Admin roles can edit measurements, but never replace hidden child PII.
        # 1. Region/District yangilash
        if "region" in payload or "district" in payload:
            reg = payload.get("region", rec.region)
            dist = payload.get("district", rec.district)
            clean_reg, clean_dist = _split_region_and_district(reg, dist)
            rec.region = clean_reg
            rec.district = clean_dist

        # 2. Barcha o'lchovlarni yangilash
        fields_to_update = [
            "age",
            "age_months",
            "age_days",
            "gender",
            "height",
            "weight",
            "chest",
            "waist",
            "head",
            "shoulder_length",
            "shoulder_breadth",
            "shoulder_circumference",
            "arm_elbow_length",
            "hand_length",
            "thigh_length",
            "thigh_circumference",
            "calf_length",
            "calf_circumference",
            "foot_length",
            "body_length",
            "total_body_water",
            "fat_percent",
            "fat_mass",
            "muscle_mass",
            "bone_mass",
            "acm",
            "visceral_fat",
            "examination_date",
            "ai_recommendations",
            "doctor_note",
            "consent_guardian_relationship",
            "consent_policy_version",
        ]

        changes = []
        for f in fields_to_update:
            camel_f = "".join(x.capitalize() or "_" for x in f.split("_"))
            camel_f = camel_f[0].lower() + camel_f[1:]
            val = payload.get(camel_f)
            if val is None:
                val = payload.get(f)

            if val is not None:
                old_val = getattr(rec, f)
                if str(old_val) != str(val):
                    changes.append(f)
                setattr(rec, f, val)

        if "consent_confirmed" in payload or "consentConfirmed" in payload:
            consent_value = payload.get(
                "consent_confirmed", payload.get("consentConfirmed")
            )
            old_val = bool(getattr(rec, "consent_confirmed", 0))
            new_val = bool(consent_value)
            rec.consent_confirmed = 1 if new_val else 0
            if new_val and not getattr(rec, "consent_confirmed_at", None):
                rec.consent_confirmed_at = datetime.utcnow()
            if old_val != new_val:
                changes.append("consent_confirmed")

        # 3. Qayta hisoblash
        try:
            all_settings = clinical_service.get_all_settings(db)
            analysis = recalculate_analysis_fields(rec, db, lang="uz")
            advices = generate_advices(
                analysis["bmi"],
                analysis["weight_diff"],
                int(rec.age),
                rec.gender,
                all_settings,
                bio_data=analysis["indices"],
                lang="uz",
            )
            rec.recommendations = (
                f"General: {advices.get('general', '')}; "
                f"Nutrition: {advices.get('nutrition', '')}; "
                f"Sport: {advices.get('sport', '')}"
            )
        except Exception as exc:
            logger.warning(
                "Updated analysis recalculation failed for id=%s: %s",
                rec.id,
                exc,
                exc_info=True,
            )

        db.commit()
        db.refresh(rec)

        record_audit_log(
            db=db,
            user_id=current_user.id,
            action="UPDATE",
            target_type="PatientAnalysis",
            target_id=rec.id,
            details=f"Tahlil yangilandi: {child_audit_reference(rec)}. O'zgarishlar: {', '.join(changes[:3])}{'...' if len(changes) > 3 else ''}",
            request=request,
        )

        return to_dict_analysis(
            rec,
            current_user,
            privacy_enabled=get_child_privacy_enabled(db, current_user),
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("CRITICAL ERROR in update_analysis: %s", e)
        raise HTTPException(
            status_code=500, detail=f"Ma'lumotni yangilashda xatolik: {str(e)}"
        )


# ---------------- PAYMENTS ---------------------
@router.get("/payments")
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
):
    q = db.query(Payment)
    if user_id:
        q = q.filter(Payment.user_id == user_id)

    # Ownership Filter for payments if needed?
    # Current request focuses on Admin panel data (analyses).
    # Keep payments as is for now or filter by related analyses creator?
    # Usually payments are global for superadmin, but if we want to filter:
    # if current_user.role == "admin":
    #     ...
    items = (
        q.order_by(Payment.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items


@router.post(
    "/payments", response_model=PaymentOut, dependencies=[Depends(verify_admin)]
)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    p = Payment(**payload.model_dump(exclude_unset=True))
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ----------------- STATS ----------------------
@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_assistant),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    somatotype: Optional[str] = Query(None),
):
    # Base count of users (only for superadmin?)
    total_users = db.query(func.count(User.id)).scalar() or 0

    # Filter analyses stats by ownership and exclusion of deleted records
    analysis_q = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    if current_user.role == "field_assistant":
        analysis_q = analysis_q.filter(PatientAnalysis.created_by_id == current_user.id)
    elif current_user.role != "superadmin":
        assistant_ids = db.query(User.id).filter(User.supervisor_id == current_user.id, User.role == "field_assistant").subquery()
        analysis_q = analysis_q.filter(
            (PatientAnalysis.created_by_id == current_user.id) | (PatientAnalysis.created_by_id.in_(assistant_ids))
        )

    # Apply Filters
    if gender:
        analysis_q = analysis_q.filter(
            func.lower(PatientAnalysis.gender) == gender.lower()
        )
    if age_min is not None:
        analysis_q = analysis_q.filter(PatientAnalysis.age >= age_min)
    if age_max is not None:
        analysis_q = analysis_q.filter(PatientAnalysis.age <= age_max)
    if region:
        analysis_q = analysis_q.filter(PatientAnalysis.region == region)
    if somatotype:
        analysis_q = analysis_q.filter(PatientAnalysis.somatotype == somatotype)
    if date_from:
        start_dt = datetime.combine(date_from, datetime.min.time())
        analysis_q = analysis_q.filter(PatientAnalysis.created_at >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, datetime.max.time())
        analysis_q = analysis_q.filter(PatientAnalysis.created_at <= end_dt)

    total_analyses = (
        analysis_q.with_entities(func.count(PatientAnalysis.id)).scalar() or 0
    )
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0

    # Combined Query for Distribution Stats (Optimization)
    today_start = datetime.combine(date.today(), datetime.min.time())
    week_start = today_start - timedelta(days=today_start.weekday())
    prev_week_start = week_start - timedelta(days=7)
    current_month_start = datetime.combine(
        date.today().replace(day=1), datetime.min.time()
    )

    dist_stats = analysis_q.with_entities(
        func.count(case(((PatientAnalysis.bmi < 18.5), 1))).label("bmi_underweight"),
        func.count(
            case(((PatientAnalysis.bmi >= 18.5) & (PatientAnalysis.bmi < 25), 1))
        ).label("bmi_normal"),
        func.count(
            case(((PatientAnalysis.bmi >= 25) & (PatientAnalysis.bmi < 30), 1))
        ).label("bmi_overweight"),
        func.count(case(((PatientAnalysis.bmi >= 30), 1))).label("bmi_obese"),
        func.count(case(((PatientAnalysis.age <= 6), 1))).label("age_0_6"),
        func.count(
            case(((PatientAnalysis.age > 6) & (PatientAnalysis.age <= 12), 1))
        ).label("age_7_12"),
        func.count(
            case(((PatientAnalysis.age > 12) & (PatientAnalysis.age <= 18), 1))
        ).label("age_13_18"),
        func.count(case(((PatientAnalysis.age > 18), 1))).label("age_18_plus"),
        func.count(case(((PatientAnalysis.created_at >= today_start), 1))).label(
            "today_count"
        ),
        func.count(case(((PatientAnalysis.created_at >= week_start), 1))).label(
            "week_count"
        ),
        func.count(
            case(
                (
                    (PatientAnalysis.created_at >= prev_week_start)
                    & (PatientAnalysis.created_at < week_start),
                    1,
                )
            )
        ).label("prev_week_count"),
        func.count(
            case(((PatientAnalysis.created_at >= current_month_start), 1))
        ).label("monthly_count"),
        func.avg(PatientAnalysis.bmi).label("avg_bmi"),
    ).first()

    if not dist_stats:
        avg_bmi = 0
        bmi_dist = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
        age_groups = [
            {"name": "0-6", "value": 0},
            {"name": "7-12", "value": 0},
            {"name": "13-18", "value": 0},
            {"name": "18+", "value": 0},
        ]
        today_analyses = 0
        weekly_analyses = 0
        previous_week_analyses = 0
        monthly_analyses = 0
    else:
        avg_bmi = dist_stats.avg_bmi or 0
        bmi_dist = {
            "underweight": dist_stats.bmi_underweight or 0,
            "normal": dist_stats.bmi_normal or 0,
            "overweight": dist_stats.bmi_overweight or 0,
            "obese": dist_stats.bmi_obese or 0,
        }
        age_groups = [
            {"name": "0-6", "value": dist_stats.age_0_6 or 0},
            {"name": "7-12", "value": dist_stats.age_7_12 or 0},
            {"name": "13-18", "value": dist_stats.age_13_18 or 0},
            {"name": "18+", "value": dist_stats.age_18_plus or 0},
        ]
        today_analyses = dist_stats.today_count or 0
        weekly_analyses = dist_stats.week_count or 0
        previous_week_analyses = dist_stats.prev_week_count or 0
        monthly_analyses = dist_stats.monthly_count or 0

    if previous_week_analyses:
        weekly_growth_pct = round(
            ((weekly_analyses - previous_week_analyses) / previous_week_analyses) * 100,
            1,
        )
    else:
        weekly_growth_pct = 100.0 if weekly_analyses else 0.0

    # Somatotype Average Approximation (for Radar Chart)
    avg_fat = (
        analysis_q.with_entities(func.avg(PatientAnalysis.fat_percent)).scalar() or 20
    )
    # Use NULLIF to prevent ZeroDivisionError
    avg_muscle = (
        analysis_q.with_entities(
            func.avg(
                PatientAnalysis.muscle_mass / func.nullif(PatientAnalysis.weight, 0)
            )
        ).scalar()
        or 0.4
    )

    # Ectomorphy approximation using Reciprocal Ponderal Index (RPI) = height / weight^(1/3)
    rpi_avg = (
        analysis_q.with_entities(
            func.avg(
                PatientAnalysis.height
                / func.nullif(func.pow(PatientAnalysis.weight, 1.0 / 3.0), 0)
            )
        ).scalar()
        or 40
    )

    somato_avg = {
        "endomorph": min(7, max(1, (avg_fat / 5))),
        "mesomorph": min(7, max(1, (avg_muscle * 10))),
        "ectomorph": min(7, max(1, (rpi_avg - 36) / 2)),
    }

    # Gender Distribution
    gender_counts = (
        analysis_q.with_entities(PatientAnalysis.gender, func.count(PatientAnalysis.id))
        .group_by(PatientAnalysis.gender)
        .all()
    )
    gender_map = {"erkak": 0, "ayol": 0, "noma'lum": 0}
    for g, c in gender_counts:
        if not g:
            gender_map["noma'lum"] += int(c)
            continue
        gl = g.lower()
        is_male = (
            gl in ["erkak", "male", "boy", "m", "male"]
            or "o'g'il" in gl
            or "о'ғил" in gl
            or "муж" in gl
        )
        is_female = (
            gl in ["ayol", "female", "girl", "f"]
            or "qiz" in gl
            or "қиз" in gl
            or "жен" in gl
        )

        if is_male:
            gender_map["erkak"] += int(c)
        elif is_female:
            gender_map["ayol"] += int(c)
        else:
            gender_map["noma'lum"] += int(c)

    # Somatotype Distribution
    somatotype_counts = (
        analysis_q.with_entities(
            PatientAnalysis.somatotype, func.count(PatientAnalysis.id)
        )
        .group_by(PatientAnalysis.somatotype)
        .all()
    )
    somatotype_map = {s or "Noma'lum": int(c) for s, c in somatotype_counts}

    # Regional Distribution
    regional_counts = (
        analysis_q.with_entities(PatientAnalysis.region, func.count(PatientAnalysis.id))
        .group_by(PatientAnalysis.region)
        .all()
    )
    regional_data = [
        {"region": r or "Noma'lum", "count": int(c)} for r, c in regional_counts
    ]

    risk_region_counts = (
        analysis_q.with_entities(
            PatientAnalysis.region,
            func.count(PatientAnalysis.id).label("total"),
            func.count(
                case(
                    (
                        (
                            (PatientAnalysis.z_score > 2)
                            | (PatientAnalysis.z_score < -2)
                            | (PatientAnalysis.bmi >= 30)
                            | (PatientAnalysis.bmi < 18.5)
                        ),
                        1,
                    )
                )
            ).label("risk_count"),
        )
        .group_by(PatientAnalysis.region)
        .all()
    )
    top_risk_regions = sorted(
        [
            {
                "region": r or "Noma'lum",
                "count": int(risk_count or 0),
                "total": int(total or 0),
                "risk_rate": round((int(risk_count or 0) / int(total or 1)) * 100, 1),
            }
            for r, total, risk_count in risk_region_counts
            if int(risk_count or 0) > 0
        ],
        key=lambda item: (item["count"], item["risk_rate"]),
        reverse=True,
    )[:8]

    # Monthly Trend (Last 12 months)
    try:
        trend_counts = (
            analysis_q.with_entities(
                func.strftime("%Y-%m", PatientAnalysis.created_at).label("month"),
                func.count(PatientAnalysis.id),
                func.avg(PatientAnalysis.bmi).label("avg_bmi"),
            )
            .group_by("month")
            .order_by("month")
            .all()
        )
        monthly_trend = [
            {
                "month": str(m) if m else "Noma'lum",
                "count": int(c),
                "avg_bmi": float(b or 0),
            }
            for m, c, b in trend_counts
        ][-12:]

        monthly_avg = (
            sum(item["count"] for item in monthly_trend) / len(monthly_trend)
            if monthly_trend
            else 0
        )
    except Exception as e:
        logger.error(f"Monthly trend error: {e}")
        monthly_trend = []
        monthly_avg = 0

    # --- 🔬 Advanced Scientific Analysis & Risk Groups ---
    # Optimized: SQL-level aggregations to avoid loading all rows into Python
    # Cache key: based on user role + filters (5 min TTL for stats)
    _has_filters = any(
        [gender, age_min, age_max, region, date_from, date_to, somatotype]
    )
    _sci_cache_key = None
    bmi_dist = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
    bmi_histogram = []
    percentile_data = []
    z_score_dist = []
    corr_matrix = []

    if not _has_filters:
        _sci_cache_key = cache_service.make_key(
            "admin_sci_stats",
            {
                "role": current_user.role,
                "uid": current_user.id if current_user.role != "superadmin" else 0,
            },
        )
        _cached = cache_service.get_json(_sci_cache_key)
        if _cached:
            bmi_dist = _cached.get("bmi_dist", bmi_dist)
            bmi_histogram = _cached.get("bmi_histogram", [])
            percentile_data = _cached.get("percentile_data", [])
            z_score_dist = _cached.get("z_score_dist", [])
            corr_matrix = _cached.get("corr_matrix", [])
            _sci_cache_key = None  # already loaded, no need to save

    if _sci_cache_key or _has_filters:
        # SQL-level BMI distribution (much faster than Python loop)
        sci_agg = analysis_q.with_entities(
            # Child/adult BMI dist using SQL CASE
            func.count(
                case(((PatientAnalysis.age < 19) & (PatientAnalysis.z_score < -2), 1))
            ).label("c_under"),
            func.count(
                case(
                    (
                        (PatientAnalysis.age < 19)
                        & (PatientAnalysis.z_score.between(-2, 1)),
                        1,
                    )
                )
            ).label("c_normal"),
            func.count(
                case(
                    (
                        (PatientAnalysis.age < 19)
                        & (PatientAnalysis.z_score.between(1, 2)),
                        1,
                    )
                )
            ).label("c_over"),
            func.count(
                case(((PatientAnalysis.age < 19) & (PatientAnalysis.z_score > 2), 1))
            ).label("c_obese"),
            func.count(
                case(((PatientAnalysis.age >= 19) & (PatientAnalysis.bmi < 18.5), 1))
            ).label("a_under"),
            func.count(
                case(
                    (
                        (PatientAnalysis.age >= 19)
                        & (PatientAnalysis.bmi.between(18.5, 24.99)),
                        1,
                    )
                )
            ).label("a_normal"),
            func.count(
                case(
                    (
                        (PatientAnalysis.age >= 19)
                        & (PatientAnalysis.bmi.between(25, 29.99)),
                        1,
                    )
                )
            ).label("a_over"),
            func.count(
                case(((PatientAnalysis.age >= 19) & (PatientAnalysis.bmi >= 30), 1))
            ).label("a_obese"),
            # BMI histogram (SQL)
            func.count(case(((PatientAnalysis.bmi < 16), 1))).label("h_lt16"),
            func.count(case(((PatientAnalysis.bmi.between(16, 18.49)), 1))).label(
                "h_16_18"
            ),
            func.count(case(((PatientAnalysis.bmi.between(18.5, 24.99)), 1))).label(
                "h_18_25"
            ),
            func.count(case(((PatientAnalysis.bmi.between(25, 29.99)), 1))).label(
                "h_25_30"
            ),
            func.count(case(((PatientAnalysis.bmi.between(30, 34.99)), 1))).label(
                "h_30_35"
            ),
            func.count(case(((PatientAnalysis.bmi.between(35, 39.99)), 1))).label(
                "h_35_40"
            ),
            func.count(case(((PatientAnalysis.bmi >= 40), 1))).label("h_gt40"),
            # Z-score bins
            func.count(case(((PatientAnalysis.z_score < -2), 1))).label("z_lt_m2"),
            func.count(case(((PatientAnalysis.z_score.between(-2, -1)), 1))).label(
                "z_m2_m1"
            ),
            func.count(case(((PatientAnalysis.z_score.between(-1, 0)), 1))).label(
                "z_m1_0"
            ),
            func.count(case(((PatientAnalysis.z_score.between(0, 1)), 1))).label(
                "z_0_p1"
            ),
            func.count(case(((PatientAnalysis.z_score.between(1, 2)), 1))).label(
                "z_p1_p2"
            ),
            func.count(case(((PatientAnalysis.z_score > 2), 1))).label("z_gt_p2"),
            # Percentiles via aggregate stats
            func.min(PatientAnalysis.bmi).label("bmi_min"),
            func.max(PatientAnalysis.bmi).label("bmi_max"),
            func.avg(PatientAnalysis.bmi).label("bmi_avg2"),
            func.min(PatientAnalysis.height).label("h_min"),
            func.avg(PatientAnalysis.height).label("h_avg"),
            func.max(PatientAnalysis.height).label("h_max"),
            func.min(PatientAnalysis.weight).label("w_min"),
            func.avg(PatientAnalysis.weight).label("w_avg"),
            func.max(PatientAnalysis.weight).label("w_max"),
            func.count(PatientAnalysis.id).label("total_n"),
        ).first()

        if sci_agg and (sci_agg.total_n or 0) > 0:
            bmi_dist = {
                "underweight": (sci_agg.c_under or 0) + (sci_agg.a_under or 0),
                "normal": (sci_agg.c_normal or 0) + (sci_agg.a_normal or 0),
                "overweight": (sci_agg.c_over or 0) + (sci_agg.a_over or 0),
                "obese": (sci_agg.c_obese or 0) + (sci_agg.a_obese or 0),
            }
            bmi_histogram = [
                {"range": "<16", "count": int(sci_agg.h_lt16 or 0)},
                {"range": "16-18.5", "count": int(sci_agg.h_16_18 or 0)},
                {"range": "18.5-25", "count": int(sci_agg.h_18_25 or 0)},
                {"range": "25-30", "count": int(sci_agg.h_25_30 or 0)},
                {"range": "30-35", "count": int(sci_agg.h_30_35 or 0)},
                {"range": "35-40", "count": int(sci_agg.h_35_40 or 0)},
                {"range": ">40", "count": int(sci_agg.h_gt40 or 0)},
            ]
            total_n = int(sci_agg.total_n or 1)
            z_score_dist = [
                {
                    "category": "< -2 SD",
                    "count": int(sci_agg.z_lt_m2 or 0),
                    "pct": round((sci_agg.z_lt_m2 or 0) / total_n * 100, 1),
                    "zscore": -2.5,
                },
                {
                    "category": "-2 SD — -1 SD",
                    "count": int(sci_agg.z_m2_m1 or 0),
                    "pct": round((sci_agg.z_m2_m1 or 0) / total_n * 100, 1),
                    "zscore": -1.5,
                },
                {
                    "category": "-1 SD — 0",
                    "count": int(sci_agg.z_m1_0 or 0),
                    "pct": round((sci_agg.z_m1_0 or 0) / total_n * 100, 1),
                    "zscore": -0.5,
                },
                {
                    "category": "0 — +1 SD",
                    "count": int(sci_agg.z_0_p1 or 0),
                    "pct": round((sci_agg.z_0_p1 or 0) / total_n * 100, 1),
                    "zscore": 0.5,
                },
                {
                    "category": "+1 SD — +2 SD",
                    "count": int(sci_agg.z_p1_p2 or 0),
                    "pct": round((sci_agg.z_p1_p2 or 0) / total_n * 100, 1),
                    "zscore": 1.5,
                },
                {
                    "category": "> +2 SD (Risk)",
                    "count": int(sci_agg.z_gt_p2 or 0),
                    "pct": round((sci_agg.z_gt_p2 or 0) / total_n * 100, 1),
                    "zscore": 2.5,
                },
            ]
            # Approximate percentiles from min/avg/max (SQL doesn't have native percentile)
            # For accurate percentiles, a separate sampled query is done only when needed
            bmi_avg2 = float(sci_agg.bmi_avg2 or 0)
            percentile_data = [
                {
                    "percentile": "P10",
                    "bmi": round(float(sci_agg.bmi_min or 0) * 1.05, 1),
                    "height": round(float(sci_agg.h_min or 0) * 1.05, 1),
                    "weight": round(float(sci_agg.w_min or 0) * 1.05, 1),
                },
                {
                    "percentile": "P25",
                    "bmi": round(bmi_avg2 * 0.92, 1),
                    "height": round(float(sci_agg.h_avg or 0) * 0.96, 1),
                    "weight": round(float(sci_agg.w_avg or 0) * 0.85, 1),
                },
                {
                    "percentile": "P50",
                    "bmi": round(bmi_avg2, 1),
                    "height": round(float(sci_agg.h_avg or 0), 1),
                    "weight": round(float(sci_agg.w_avg or 0), 1),
                },
                {
                    "percentile": "P75",
                    "bmi": round(bmi_avg2 * 1.08, 1),
                    "height": round(float(sci_agg.h_avg or 0) * 1.04, 1),
                    "weight": round(float(sci_agg.w_avg or 0) * 1.15, 1),
                },
                {
                    "percentile": "P90",
                    "bmi": round(float(sci_agg.bmi_max or 0) * 0.95, 1),
                    "height": round(float(sci_agg.h_max or 0) * 0.95, 1),
                    "weight": round(float(sci_agg.w_max or 0) * 0.95, 1),
                },
            ]

        # Cache for 5 minutes if no filters applied
        if _sci_cache_key:
            cache_service.set_json(
                _sci_cache_key,
                {
                    "bmi_dist": bmi_dist,
                    "bmi_histogram": bmi_histogram,
                    "percentile_data": percentile_data,
                    "z_score_dist": z_score_dist,
                    "corr_matrix": corr_matrix,
                },
                ttl_seconds=300,
            )

    return {
        "total_users": int(total_users),
        "total_analyses": int(total_analyses),
        "today_analyses": int(today_analyses),
        "weekly_analyses": int(weekly_analyses),
        "weekly_growth_pct": float(weekly_growth_pct),
        "top_risk_regions": top_risk_regions,
        "total_revenue": float(total_revenue),
        "avg_bmi": float(avg_bmi),
        "monthly_growth": int(monthly_analyses),
        "monthly_avg": float(monthly_avg),
        "bmi_distribution": bmi_dist,
        "somatotype_avg": somato_avg,
        "by_gender": gender_map,
        "by_somatotype": somatotype_map,
        "by_age_group": age_groups,
        "by_region": regional_data,
        "monthly_trend": monthly_trend,
        # Advanced fields for ScientificAnalysis.js
        "bmi_histogram": bmi_histogram,
        "percentile_data": percentile_data,
        "z_score_distribution": z_score_dist,
        "correlation_matrix": corr_matrix,
    }


# ----------------- XLSX PREVIEW ------------------
@router.get("/export-xlsx-preview")
def preview_analyses_xlsx(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    q: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    region: Optional[str] = Query(None),
    somatotype: Optional[str] = Query(None),
    sort_key: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 200,
    lang: Optional[str] = Query("uz"),
):
    base = db.query(PatientAnalysis)

    if current_user.role != "superadmin":
        base = base.filter(PatientAnalysis.created_by_id == current_user.id)
    base = base.filter(PatientAnalysis.is_deleted == 0)

    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.id_code.ilike(like))
    if gender:
        base = base.filter(func.lower(PatientAnalysis.gender) == gender.lower())
    if age_min is not None:
        base = base.filter(PatientAnalysis.age >= age_min)
    if age_max is not None:
        base = base.filter(PatientAnalysis.age <= age_max)
    if date_from:
        start_dt = datetime.combine(date_from, datetime.min.time())
        base = base.filter(PatientAnalysis.created_at >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, datetime.max.time())
        base = base.filter(PatientAnalysis.created_at <= end_dt)
    if region:
        base = base.filter(PatientAnalysis.region == region)
    if somatotype:
        base = base.filter(PatientAnalysis.somatotype == somatotype)

    total = base.with_entities(func.count(PatientAnalysis.id)).scalar() or 0

    sort_map = {
        "created_at": PatientAnalysis.created_at,
        "name": PatientAnalysis.id_code,
        "gender": PatientAnalysis.gender,
        "age": PatientAnalysis.age,
        "height": PatientAnalysis.height,
        "weight": PatientAnalysis.weight,
        "bmi": PatientAnalysis.bmi,
        "last_name": PatientAnalysis.id_code,
    }
    sort_col = sort_map.get(sort_key, PatientAnalysis.created_at)
    base = base.order_by(asc(sort_col) if sort_dir == "asc" else desc(sort_col))
    base = base.options(joinedload(PatientAnalysis.created_by))

    safe_page_size = min(max(page_size, 1), 200)
    rows_db = base.offset(max(0, (page - 1) * safe_page_size)).limit(safe_page_size).all()
    all_settings = clinical_service.get_all_settings(db)

    items = []
    for r in rows_db:
        try:
            analysis = calc_full_bmi(
                build_patient_data_from_analysis(r),
                all_settings=all_settings,
                lang=lang,
            )
        except Exception as e:
            logger.error(f"Error calculating XLSX preview row (id={r.id}): {e}")
            analysis = {}

        weight_range = "-"
        if "ideal_weight_range" in analysis:
            rng = analysis["ideal_weight_range"] or {}
            weight_range = f"{rng.get('min', '-')}-{rng.get('max', '-')}"
        indices = analysis.get("indices", {}) or {}

        item = {
            "id": r.id,
            "created_at": r.created_at,
            "id_code": r.id_code,
            "name": r.name,
            "gender": r.gender,
            "age": r.age,
            "age_months": getattr(r, "age_months", None),
            "age_days": getattr(r, "age_days", None),
            "region": r.region,
            "district": r.district,
            "address": r.address,
            "created_by_name": r.created_by.name if r.created_by else "Noma'lum",
            "height": r.height or 0,
            "weight": r.weight or 0,
            "bmi": analysis.get("bmi", r.bmi or "-"),
            "bmi_status": analysis.get("bmi_category") or bmi_status_by_age(r.bmi, r.age),
            "somatotype": analysis.get("somatotype", r.somatotype or "-"),
            "ideal_weight": analysis.get("ideal_weight", "-"),
            "weight_diff": analysis.get("weight_diff", "-"),
            "weight_range": weight_range,
            "chest": r.chest or 0,
            "waist": getattr(r, "waist", 0) or 0,
            "head": r.head or 0,
            "shoulder_length": getattr(r, "shoulder_length", 0) or 0,
            "shoulder_breadth": getattr(r, "shoulder_breadth", 0) or 0,
            "shoulder_circumference": getattr(r, "shoulder_circumference", 0) or 0,
            "arm_elbow_length": getattr(r, "arm_elbow_length", 0) or 0,
            "hand_length": getattr(r, "hand_length", 0) or 0,
            "thigh_length": getattr(r, "thigh_length", 0) or 0,
            "thigh_circumference": getattr(r, "thigh_circumference", 0) or 0,
            "calf_length": getattr(r, "calf_length", 0) or 0,
            "calf_circumference": getattr(r, "calf_circumference", 0) or 0,
            "foot_length": getattr(r, "foot_length", 0) or 0,
            "shoulder_ratio": analysis.get("shoulder_ratio", "-"),
            "thigh_ratio": analysis.get("thigh_ratio", "-"),
            "hmai": indices.get("hmai", "-"),
            "mii": indices.get("mii", "-"),
            "adi": indices.get("adi", "-"),
            "tbw": indices.get("tbw_percent", getattr(r, "total_body_water", None) or "-"),
            "fat_percent": indices.get("fm_percent", getattr(r, "fat_percent", None) or "-"),
            "fat_mass": indices.get("fm", getattr(r, "fat_mass", None) or "-"),
            "muscle_mass": indices.get("muscle_mass", getattr(r, "muscle_mass", None) or "-"),
            "bone_mass": indices.get("bone_mass", getattr(r, "bone_mass", None) or "-"),
            "acm": indices.get("acm_percent", getattr(r, "acm", None) or "-"),
            "visceral_fat": indices.get("visceral_fat", getattr(r, "visceral_fat", None) or "-"),
            "body_length": r.body_length or 0,
            "parents_phone": r.parents_phone or "-",
        }
        items.append(
            redact_child_payload(
                item,
                current_user,
                privacy_enabled=get_child_privacy_enabled(db, current_user),
            )
        )

    return {"items": items, "total": int(total)}


# ----------------- EXPORT XLSX ------------------
@router.get("/export-xlsx")
def export_analyses_xlsx(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    q: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    region: Optional[str] = Query(None),
    somatotype: Optional[str] = Query(None),
    lang: Optional[str] = Query("uz"),
):
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)

    # Ownership Filter
    if current_user.role != "superadmin":
        base = base.filter(PatientAnalysis.created_by_id == current_user.id)

    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.id_code.ilike(like))
    if gender:
        base = base.filter(func.lower(PatientAnalysis.gender) == gender.lower())
    if age_min is not None:
        base = base.filter(PatientAnalysis.age >= age_min)
    if age_max is not None:
        base = base.filter(PatientAnalysis.age <= age_max)
    if date_from:
        start_dt = datetime.combine(date_from, datetime.min.time())
        base = base.filter(PatientAnalysis.created_at >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, datetime.max.time())
        base = base.filter(PatientAnalysis.created_at <= end_dt)
    if region:
        base = base.filter(PatientAnalysis.region == region)
    if somatotype:
        base = base.filter(PatientAnalysis.somatotype == somatotype)

    rows_db = (
        base.options(
            joinedload(PatientAnalysis.created_by),
            joinedload(PatientAnalysis.deleted_by),
        )
        .order_by(PatientAnalysis.created_at.desc())
        .all()
    )

    wb = Workbook()
    ws = wb.active
    ws.title = "Analyses"

    from utils.i18n_export import get_admin_headers, get_research_header

    base_headers = get_admin_headers(lang)
    export_permissions = get_effective_admin_permissions(current_user)
    legacy_column_keys = [
        "created_at", "id_code", "name", "gender", "age", "region", "district",
        "address", "created_by", "height", "weight", "bmi", "bmi_category",
        "somatotype", "ideal_weight", "weight_diff", "weight_range", "chest",
        "waist", "head", "shoulder_breadth", "shoulder_ratio",
        "thigh_circumference", "thigh_ratio", "hmai", "mii", "adi",
        "tbw", "fat_percent", "fat_mass", "muscle_mass", "bone_mass", "acm",
        "visceral_fat", "body_length", "parents_phone",
    ]
    header_by_key = {
        key: base_headers[i]
        for i, key in enumerate(legacy_column_keys)
        if i < len(base_headers)
    }
    research_header_keys = {
        "shoulder_length": "shoulder_length",
        "shoulder_breadth": "shoulder_width",
        "shoulder_circumference": "shoulder_circumference_rest",
        "arm_elbow_length": "forearm_length",
        "hand_length": "hand_length",
        "thigh_length": "thigh_length",
        "thigh_circumference": "thigh_circumference",
        "calf_length": "calf_length",
        "calf_circumference": "calf_circumference",
        "foot_length": "foot_length",
    }
    column_keys = [
        "created_at", "id_code", "name", "gender", "age", "region", "district",
        "address", "created_by", "height", "weight", "bmi", "bmi_category",
        "somatotype", "ideal_weight", "weight_diff", "weight_range", "chest",
        "waist", "head", "shoulder_length", "shoulder_breadth",
        "shoulder_circumference", "arm_elbow_length", "hand_length",
        "thigh_length", "thigh_circumference", "calf_length",
        "calf_circumference", "foot_length", "shoulder_ratio", "thigh_ratio",
        "hmai", "mii", "adi", "tbw", "fat_percent", "fat_mass",
        "muscle_mass", "bone_mass", "acm", "visceral_fat", "body_length",
        "parents_phone",
    ]
    permission_column_map = {
        "shoulder_length": "shoulder_length",
        "shoulder_breadth": "shoulder_breadth",
        "shoulder_circumference": "shoulder_circumference",
        "arm_elbow_length": "arm_elbow_length",
        "hand_length": "hand_length",
        "thigh_length": "thigh_length",
        "thigh_circumference": "thigh_circumference",
        "calf_length": "calf_length",
        "calf_circumference": "calf_circumference",
        "foot_length": "foot_length",
        "shoulder_ratio": "shoulder_breadth",
        "thigh_ratio": "thigh_circumference",
        "tbw": "bioimpedance",
        "fat_percent": "bioimpedance",
        "fat_mass": "bioimpedance",
        "muscle_mass": "bioimpedance",
        "bone_mass": "bioimpedance",
        "acm": "bioimpedance",
        "visceral_fat": "bioimpedance",
        "body_length": "bioimpedance",
    }
    anthropometry_permission_keys = (
        "shoulder_length", "shoulder_breadth", "shoulder_circumference",
        "arm_elbow_length", "hand_length", "thigh_length", "thigh_circumference",
        "calf_length", "calf_circumference", "foot_length",
    )

    def _xlsx_column_enabled(key: str) -> bool:
        if key in {"hmai", "mii", "adi"}:
            return any(export_permissions.get(k, True) for k in anthropometry_permission_keys)
        permission_key = permission_column_map.get(key)
        return export_permissions.get(permission_key, True) if permission_key else True

    def _xlsx_header_for(key: str) -> str:
        if key in header_by_key:
            return header_by_key[key]
        research_key = research_header_keys.get(key)
        if research_key:
            return get_research_header(lang, research_key)
        return key

    privacy_enabled = get_child_privacy_enabled(db, current_user)
    enabled_column_keys = [
        key
        for key in column_keys
        if _xlsx_column_enabled(key)
        and (not privacy_enabled or key not in CHILD_PII_EXPORT_FIELDS)
    ]
    headers = [_xlsx_header_for(key) for key in enabled_column_keys]
    # Header styling
    header_fill = PatternFill(
        start_color="3498DB", end_color="3498DB", fill_type="solid"
    )
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )

    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border

    # Fetch settings for calculations
    all_settings = clinical_service.get_all_settings(db)

    # Ma'lumotlarni yozish
    row_idx = 2
    for r in rows_db:
        try:
            analysis = calc_full_bmi(
                build_patient_data_from_analysis(r),
                all_settings=all_settings,
                lang=lang,
            )
        except Exception as e:
            logger.error(f"Error calculating analysis for XLSX row (id={r.id}): {e}")
            analysis = {}

        vazn_range = ""
        if "ideal_weight_range" in analysis:
            rng = analysis["ideal_weight_range"]
            vazn_range = f"{rng.get('min', '-')}-{rng.get('max', '-')}"
        indices = analysis.get("indices", {}) or {}

        age_labels = {
            "uz": ("y.", "o.", "k."),
            "ru": ("г.", "м.", "д."),
            "en": ("y.", "m.", "d."),
            "kk": ("ж.", "а.", "к."),
            "tg": ("с.", "м.", "р."),
        }
        y_label, m_label, d_label = age_labels.get(lang, ("й.", "о.", "к."))
        if lang in ["uz", "en", "kk", "tg"]:
            y_label, m_label, d_label = age_labels.get(lang, ("y.", "o.", "k."))
            if lang == "uz":
                # Provide fallback cyrillic if needed, but let's just stick to the labels
                pass

        age_m = getattr(r, "age_months", 0) or 0
        age_d = getattr(r, "age_days", 0) or 0
        age_str = f"{r.age} {y_label}"
        if age_m:
            age_str += f", {age_m} {m_label}"
        if age_d:
            age_str += f", {age_d} {d_label}"

        from services.ky_localization import report_text

        def _fmt(val):
            if not val:
                return "-"
            val_str = str(val)
            # Apply language-specific localization first
            localized = report_text(val_str, lang)
            # English, Turkmen, and Turkish use Latin alphabet
            if lang in ["en", "tm", "tr"]:
                return localized
            # Others use Cyrillic
            return lat2cyr(localized)

        value_by_key = {
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else "-",
            "id_code": r.id_code or "-",
            "name": _fmt(r.name),
            "gender": _fmt(r.gender),
            "age": age_str,
            "region": _fmt(r.region),
            "district": _fmt(r.district),
            "address": _fmt(r.address),
            "created_by": _fmt(r.created_by.name if r.created_by else ""),
            "height": r.height or 0,
            "weight": r.weight or 0,
            "bmi": analysis.get("bmi", r.bmi or "-"),
            "bmi_category": _fmt(analysis.get("bmi_category", "-")),
            "somatotype": _fmt(analysis.get("somatotype", r.somatotype or "-")),
            "ideal_weight": analysis.get("ideal_weight", "-"),
            "weight_diff": analysis.get("weight_diff", "-"),
            "weight_range": vazn_range,
            "chest": r.chest or 0,
            "waist": getattr(r, "waist", 0) or 0,
            "head": r.head or 0,
            "shoulder_length": getattr(r, "shoulder_length", 0) or 0,
            "shoulder_breadth": getattr(r, "shoulder_breadth", 0) or 0,
            "shoulder_circumference": getattr(r, "shoulder_circumference", 0) or 0,
            "arm_elbow_length": getattr(r, "arm_elbow_length", 0) or 0,
            "hand_length": getattr(r, "hand_length", 0) or 0,
            "thigh_length": getattr(r, "thigh_length", 0) or 0,
            "thigh_circumference": getattr(r, "thigh_circumference", 0) or 0,
            "calf_length": getattr(r, "calf_length", 0) or 0,
            "calf_circumference": getattr(r, "calf_circumference", 0) or 0,
            "foot_length": getattr(r, "foot_length", 0) or 0,
            "shoulder_ratio": analysis.get("shoulder_ratio", "-"),
            "thigh_ratio": analysis.get("thigh_ratio", "-"),
            "hmai": indices.get("hmai", "-"),
            "mii": indices.get("mii", "-"),
            "adi": indices.get("adi", "-"),
            "tbw": indices.get("tbw_percent", getattr(r, "total_body_water", None) or "-"),
            "fat_percent": indices.get("fm_percent", getattr(r, "fat_percent", None) or "-"),
            "fat_mass": indices.get("fm", getattr(r, "fat_mass", None) or "-"),
            "muscle_mass": indices.get("muscle_mass", getattr(r, "muscle_mass", None) or "-"),
            "bone_mass": indices.get("bone_mass", getattr(r, "bone_mass", None) or "-"),
            "acm": indices.get("acm_percent", getattr(r, "acm", None) or "-"),
            "visceral_fat": indices.get("visceral_fat", getattr(r, "visceral_fat", None) or "-"),
            "body_length": r.body_length or 0,
            "parents_phone": r.parents_phone or "-",
        }

        # Barcha string qiymatlarni lat2cyr orqali o'girish shart emas —
        # sarlavhalar allaqachon kirill yozuvida

        vals = [value_by_key.get(key, "-") for key in enabled_column_keys]

        for col_num, val in enumerate(vals, 1):
            cell = ws.cell(row=row_idx, column=col_num, value=val)
            cell.alignment = Alignment(horizontal="left", vertical="center")
            cell.border = border
            # Alt rows styling (zebra)
            if row_idx % 2 == 0:
                cell.fill = PatternFill(
                    start_color="F2F2F2", end_color="F2F2F2", fill_type="solid"
                )

        row_idx += 1

    # Avto-column width
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                cell_length = len(str(cell.value))
            except (TypeError, ValueError):
                continue
            if cell_length > max_length:
                max_length = cell_length
        adjusted_width = max_length + 2
        ws.column_dimensions[column].width = adjusted_width

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"morphocheck_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-store, private",
        },
    )


# -------------- O'CHIRILGAN MA'LUMOTLAR (Super Admin) ------------------
@router.get("/deleted-analyses")
def list_deleted_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    q: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 20,
):
    """
    Faqat super admin: barcha soft-deleted ma'lumotlarni ro'yxati.
    """
    base = db.query(PatientAnalysis).filter((PatientAnalysis.is_deleted == 1))
    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.id_code.ilike(like))

    total = base.with_entities(func.count(PatientAnalysis.id)).scalar() or 0
    items_db = (
        base.options(
            joinedload(PatientAnalysis.created_by),
            joinedload(PatientAnalysis.deleted_by),
        )
        .order_by(desc(PatientAnalysis.deleted_at))
        .offset(max(0, (page - 1) * page_size))
        .limit(page_size)
        .all()
    )
    privacy_enabled = get_child_privacy_enabled(db, current_user)
    items = [
        to_dict_analysis(r, current_user, privacy_enabled=privacy_enabled)
        for r in items_db
    ]
    return {"items": items, "total": int(total)}


@router.get("/export-deleted-docx", dependencies=[Depends(get_current_superadmin)])
def export_deleted_docx(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None),
):
    """
    Super admin: o'chirilgan barcha ma'lumotlarni DOCX formatda yuklab olish.
    """
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 1)
    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.id_code.ilike(like))

    rows_db = (
        base.options(
            joinedload(PatientAnalysis.created_by),
            joinedload(PatientAnalysis.deleted_by),
        )
        .order_by(desc(PatientAnalysis.deleted_at))
        .all()
    )

    doc = Document()

    # Hujjat sarlavhasi
    title = doc.add_heading("", 0)
    title_run = title.add_run("O'chirilgan Ma'lumotlar Hisoboti")
    title_run.font.size = Pt(16)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0xC0, 0x39, 0x2B)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Meta info
    meta_para = doc.add_paragraph()
    meta_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_run = meta_para.add_run(
        f"Hisobot sanasi: {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  Jami: {len(rows_db)} ta yozuv"
    )
    meta_run.font.size = Pt(10)
    meta_run.font.color.rgb = RGBColor(0x7F, 0x8C, 0x8D)

    doc.add_paragraph()

    # Jadval sarlavhalari
    headers = [
        "№",
        "ID Kod",
        "Jins",
        "Yosh",
        "Viloyat / Tuman",
        "Bo'y (sm)",
        "Vazn (kg)",
        "BMI",
        "Somatotip",
        "O'chirgan Admin",
        "O'chirilgan Sana",
    ]
    col_widths_cm = [0.8, 2.0, 1.5, 1.2, 3.0, 1.5, 1.5, 1.5, 2.5, 3.0, 3.0]

    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"

    # Header row styling
    hdr_cells = table.rows[0].cells
    for i, (h, w) in enumerate(zip(headers, col_widths_cm)):
        cell = hdr_cells[i]
        cell.width = Cm(w)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        para = cell.paragraphs[0]
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = para.add_run(h)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        # Header fon — qizil
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn

        tc = cell._tc
        tcPr = tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), "C0392B")
        tcPr.append(shd)

    # Ma'lumot satrlari
    for idx, r in enumerate(rows_db, 1):
        row_cells = table.add_row().cells
        bmi_val = getattr(r, "bmi", None) or calc_bmi(
            getattr(r, "weight", None), getattr(r, "height", None)
        )
        bmi_str = f"{round(bmi_val, 1)}" if bmi_val else "-"

        age_str = f"{r.age} y."
        if getattr(r, "age_months", None):
            age_str += f" {r.age_months} oy"

        deleted_at_str = (
            r.deleted_at.strftime("%Y-%m-%d %H:%M")
            if getattr(r, "deleted_at", None)
            else "-"
        )
        deleted_by_str = (
            r.deleted_by.name
            if (hasattr(r, "deleted_by") and r.deleted_by)
            else "Noma'lum"
        )
        region_str = f"{r.region or '-'} / {getattr(r, 'district', '') or '-'}"

        values = [
            str(idx),
            r.id_code or "-",
            lat2cyr(r.gender) if r.gender else "-",
            age_str,
            lat2cyr(region_str),
            str(r.height or "-"),
            str(r.weight or "-"),
            bmi_str,
            lat2cyr(r.somatotype) if r.somatotype else "-",
            lat2cyr(deleted_by_str),
            deleted_at_str,
        ]

        fill_color = "FADBD8" if idx % 2 == 0 else "FFFFFF"  # alternating pink-white

        for i, val in enumerate(values):
            cell = row_cells[i]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = para.add_run(val)
            run.font.size = Pt(8)

            # Alternating row color
            from docx.oxml import OxmlElement
            from docx.oxml.ns import qn

            tc = cell._tc
            tcPr = tc.get_or_add_tcPr()
            shd = OxmlElement("w:shd")
            shd.set(qn("w:val"), "clear")
            shd.set(qn("w:color"), "auto")
            shd.set(qn("w:fill"), fill_color)
            tcPr.append(shd)

    # Pastki izoh
    doc.add_paragraph()
    footer_para = doc.add_paragraph()
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_para.add_run(
        "MORPHO CHECK PRO — Super Admin Hisoboti — Maxfiy hujjat"
    )
    footer_run.font.size = Pt(8)
    footer_run.font.italic = True
    footer_run.font.color.rgb = RGBColor(0xA9, 0xA9, 0xA9)

    output = BytesIO()
    doc.save(output)
    output.seek(0)

    filename = f"morphocheck_deleted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-store, private",
        },
    )


# ----------------- BULK IMPORT / TEMPLATE ------------------

ANTHROPOMETRY_IMPORT_FIELDS = {
    "shoulder_length",
    "shoulder_breadth",
    "shoulder_circumference",
    "arm_elbow_length",
    "hand_length",
    "thigh_length",
    "thigh_circumference",
    "calf_length",
    "calf_circumference",
    "foot_length",
}
BIOIMPEDANCE_IMPORT_FIELDS = {
    "body_length",
    "total_body_water",
    "fat_percent",
    "fat_mass",
    "muscle_mass",
    "bone_mass",
    "acm",
    "visceral_fat",
}
IMPORT_TEMPLATE_COLUMNS = [
    ("first_name", "first_name (Ism) *", "Ali"),
    ("last_name", "last_name (Familiya) *", "Valiyev"),
    ("gender", "gender (erkak/ayol) *", "erkak"),
    ("age", "age (Yosh) *", 10),
    ("age_months", "age_months (Yosh oylar)", 5),
    ("age_days", "age_days (Yosh kunlar)", 12),
    ("id_code", "id_code (ID kod)", "MC-001"),
    ("region", "region (Viloyat) *", "Toshkent"),
    ("district", "district (Tuman)", "Yunusobod"),
    ("mahalla", "mahalla", "Minor"),
    ("address", "address (Manzil)", "Amir Temur ko'chasi"),
    ("height", "height (Bo'y, sm) *", 140.5),
    ("weight", "weight (Vazn, kg) *", 35.2),
    ("chest", "chest (Ko'krak qafasi, sm) *", 70),
    ("waist", "waist (Bel aylanasi, sm) *", 65),
    ("hip", "hip (Son/dumba aylanasi, sm)", 72),
    ("head", "head (Bosh aylanasi, sm) *", 52),
    ("birth_date", "birth_date (Tug'ilgan sana: YYYY-MM-DD)", "2014-05-10"),
    ("examination_date", "examination_date (Sana: YYYY-MM-DD)", "2024-05-10"),
    ("preschool_institution", "preschool_institution (Muassasa)", "123-maktab"),
    ("parents_phone", "parents_phone", "+998901234567"),
    ("father_height", "father_height", 172),
    ("mother_height", "mother_height", 164),
    ("doctor_note", "doctor_note", "Sog'lom"),
    ("shoulder_length", "shoulder_length", 15),
    ("shoulder_breadth", "shoulder_breadth", 30),
    ("shoulder_circumference", "shoulder_circumference", 25),
    ("arm_elbow_length", "arm_elbow_length", 20),
    ("hand_length", "hand_length", 15),
    ("thigh_length", "thigh_length", 40),
    ("thigh_circumference", "thigh_circumference", 35),
    ("calf_length", "calf_length", 25),
    ("calf_circumference", "calf_circumference", 20),
    ("foot_length", "foot_length", 22),
    ("body_length", "body_length", 135),
    ("total_body_water", "total_body_water", None),
    ("fat_percent", "fat_percent", None),
    ("fat_mass", "fat_mass", None),
    ("muscle_mass", "muscle_mass", None),
    ("bone_mass", "bone_mass", None),
    ("acm", "acm", None),
    ("visceral_fat", "visceral_fat", None),
]
IMPORT_FIELD_NAMES = {field for field, _header, _sample in IMPORT_TEMPLATE_COLUMNS}
LEGACY_IMPORT_FIELD_MAP = {i: field for i, (field, _header, _sample) in enumerate(IMPORT_TEMPLATE_COLUMNS)}


def import_field_enabled(
    field: str,
    permissions: dict[str, bool],
    privacy_enabled: bool = False,
) -> bool:
    if privacy_enabled and field in CHILD_PII_EXPORT_FIELDS:
        return False
    if field in ANTHROPOMETRY_IMPORT_FIELDS:
        return permissions.get(field, True)
    if field in BIOIMPEDANCE_IMPORT_FIELDS:
        return permissions.get("bioimpedance", True)
    return True


def parse_import_header_field(value) -> Optional[str]:
    raw = str(value or "").strip()
    if not raw:
        return None
    token = raw.split()[0].split("(")[0].strip().strip("*").strip().lower()
    return token if token in IMPORT_FIELD_NAMES else None


@router.get("/export-template")
def export_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Import uchun Excel shablonini yuklab olish."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Template"

    # Sarlavhalar (Lotin yozuvida, import qilish oson bo'lishi uchun)
    # Ammo userga tushunarli bo'lishi uchun Kirillda ham qoldirish mumkin.
    # Biz Lotin (field name) + Izoh (Kirill) kombinatsiyasini ishlatamiz.

    permissions = get_effective_admin_permissions(current_user)
    privacy_enabled = get_child_privacy_enabled(db, current_user)
    enabled_template_columns = [
        column
        for column in IMPORT_TEMPLATE_COLUMNS
        if import_field_enabled(column[0], permissions, privacy_enabled)
    ]
    headers = [header for _field, header, _sample in enabled_template_columns]
    sample = [sample for _field, _header, sample in enabled_template_columns]

    header_fill = PatternFill(
        start_color="2ECC71", end_color="2ECC71", fill_type="solid"
    )
    header_font = Font(color="FFFFFF", bold=True)

    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    for col_num, val in enumerate(sample, 1):
        ws.cell(row=2, column=col_num, value=val)

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=morphocheck_template.xlsx",
            "Cache-Control": "no-store, private",
        },
    )


@router.post("/import-xlsx")
async def import_analyses_xlsx(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Excel orqali ommaviy ma'lumot yuklash."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Faqat Excel fayllari (.xlsx, .xls) qabul qilinadi.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "Fayl hajmi 10 MB dan oshmasligi kerak.")
    if not contents:
        raise HTTPException(400, "Bo'sh fayl yuklanmaydi.")
    wb = load_workbook(BytesIO(contents), data_only=True)
    ws = wb.active
    import_permissions = get_effective_admin_permissions(current_user)
    privacy_enabled = get_child_privacy_enabled(db, current_user)

    region_offsets = {}

    # Header-based mapping keeps imports compatible with permission-shortened templates.
    header_values = [cell.value for cell in ws[1]]
    field_map = {
        idx: field
        for idx, header in enumerate(header_values)
        if (field := parse_import_header_field(header))
        and import_field_enabled(field, import_permissions, privacy_enabled)
    }
    if not field_map:
        field_map = {
            idx: field
            for idx, field in LEGACY_IMPORT_FIELD_MAP.items()
            if import_field_enabled(field, import_permissions, privacy_enabled)
        }
    imported_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []

    def safe_cell_value(v):
        if isinstance(v, (datetime, date)):
            return v.strftime("%Y-%m-%d")
        return "" if v is None else str(v)

    def add_import_error(row, field, message, value=None):
        errors.append(
            {
                "row": row,
                "field": field,
                "message": message,
                "value": safe_cell_value(value),
            }
        )

    def is_blank(v):
        return v is None or str(v).strip() == ""

    def is_number_like(v):
        if is_blank(v):
            return False
        if isinstance(v, (int, float)):
            return True
        try:
            float(str(v).strip().replace(",", "."))
            return True
        except Exception:
            return False

    def format_val(v, default=0.0):
        if v is None or v == "":
            return default
        if isinstance(v, (int, float)):
            return float(v)
        try:
            ts = str(v).strip().replace(",", ".")
            if not ts or ts.lower() == "nan":
                return default
            return float(ts)
        except (TypeError, ValueError):
            return default

    def format_int(v, default=0):
        if v is None or v == "":
            return default
        if isinstance(v, int):
            return v
        if isinstance(v, float):
            return int(v)
        try:
            ts = str(v).strip().split(".")[0]  # handle '10.0' as string
            if not ts:
                return default
            return int(ts)
        except (TypeError, ValueError):
            return default

    def format_date(v, default=""):
        if not v:
            return default
        if isinstance(v, (datetime, date)):
            return v.strftime("%Y-%m-%d")
        return str(v).strip()

    # Skip header (row 1)
    for row_idx, row in enumerate(ws.iter_rows(min_row=2), 2):
        row_values = [cell.value for cell in row]
        if not any(row_values):
            continue  # Bo'sh qator

        try:
            data = {}
            for col_idx, field in field_map.items():
                if col_idx < len(row_values):
                    data[field] = row_values[col_idx]

            row_errors = []
            required_fields = {
                **({} if privacy_enabled else {
                    "first_name": "Ism majburiy.",
                    "last_name": "Familiya majburiy.",
                }),
                "gender": "Jins majburiy.",
                "age": "Yosh majburiy.",
                "region": "Viloyat majburiy.",
                "height": "Bo'y majburiy.",
                "weight": "Vazn majburiy.",
                "chest": "Ko'krak qafasi majburiy.",
                "waist": "Bel aylanasi majburiy.",
                "head": "Bosh aylanasi majburiy.",
            }
            for field, message in required_fields.items():
                if is_blank(data.get(field)):
                    row_errors.append((field, message, data.get(field)))

            gender_raw = str(data.get("gender") or "").strip().lower()
            valid_gender = (
                gender_raw in ["m", "f"]
                or "erkak" in gender_raw
                or "ayol" in gender_raw
                or "male" in gender_raw
                or "female" in gender_raw
            )
            if gender_raw and not valid_gender:
                row_errors.append(
                    (
                        "gender",
                        "Jins 'erkak' yoki 'ayol' bo'lishi kerak.",
                        data.get("gender"),
                    )
                )

            numeric_fields = [
                field
                for field in (
                    "age",
                    "age_months",
                    "age_days",
                    "height",
                    "weight",
                    "chest",
                    "waist",
                    "hip",
                    "head",
                    "father_height",
                    "mother_height",
                    "shoulder_length",
                    "shoulder_breadth",
                    "shoulder_circumference",
                    "arm_elbow_length",
                    "hand_length",
                    "thigh_length",
                    "thigh_circumference",
                    "calf_length",
                    "calf_circumference",
                    "foot_length",
                    "body_length",
                    "total_body_water",
                    "fat_percent",
                    "fat_mass",
                    "muscle_mass",
                    "bone_mass",
                    "acm",
                    "visceral_fat",
                )
                if import_field_enabled(field, import_permissions, privacy_enabled)
            ]
            for field in numeric_fields:
                if not is_blank(data.get(field)) and not is_number_like(
                    data.get(field)
                ):
                    row_errors.append(
                        (field, "Raqam formatida bo'lishi kerak.", data.get(field))
                    )

            if is_number_like(data.get("age")) and not (
                0 <= format_int(data.get("age"), -1) <= 19
            ):
                row_errors.append(
                    ("age", "Yosh 0 dan 19 gacha bo'lishi kerak.", data.get("age"))
                )

            if is_number_like(data.get("height")) and not (
                30 <= format_val(data.get("height"), 0) <= 250
            ):
                row_errors.append(
                    (
                        "height",
                        "Bo'y 30-250 sm oralig'ida bo'lishi kerak.",
                        data.get("height"),
                    )
                )

            if is_number_like(data.get("weight")) and not (
                1 <= format_val(data.get("weight"), 0) <= 250
            ):
                row_errors.append(
                    (
                        "weight",
                        "Vazn 1-250 kg oralig'ida bo'lishi kerak.",
                        data.get("weight"),
                    )
                )

            if row_errors:
                skipped_count += 1
                for field, message, value in row_errors:
                    add_import_error(row_idx, field, message, value)
                continue

            # Convert types
            full_name = (
                f"Maxfiy import {row_idx}"
                if privacy_enabled
                else f"{data['first_name']} {data['last_name']}".strip()
            )
            gender = str(data.get("gender") or "erkak").lower()
            if "ayol" in gender or "fem" in gender:
                gender = "ayol"
            else:
                gender = "erkak"

            # Check existing record (full match by name and birth_date/region if available)
            existing = db.query(PatientAnalysis).filter(
                PatientAnalysis.name == full_name,
                PatientAnalysis.created_by_id == current_user.id,
                PatientAnalysis.is_deleted == 0,
            )
            if data.get("birth_date"):
                existing = existing.filter(
                    PatientAnalysis.birth_date == str(data["birth_date"])
                )

            rec = existing.first()
            is_new = False
            if not rec:
                rec = PatientAnalysis()
                rec.created_by_id = current_user.id
                is_new = True

            # Populate model
            rec.name = full_name
            rec.gender = gender
            rec.age = format_int(data.get("age"), 0)
            rec.age_months = format_int(data.get("age_months"), 0)
            rec.age_days = format_int(data.get("age_days"), 0)
            rec.region = str(data.get("region") or "").strip()
            rec.district = str(data.get("district") or "").strip()
            rec.id_code = str(data.get("id_code") or "").strip() or None

            # Auto-generate or fix id_code if missing or not in MC- format
            if not rec.id_code or not rec.id_code.startswith("MC-"):
                from services.analyze_service import generate_region_based_id
                clean_region, _ = _split_region_and_district(rec.region, rec.district)
                if clean_region not in region_offsets:
                    base_id = generate_region_based_id(db, clean_region)
                    parts = base_id.split("-")
                    if len(parts) >= 3 and parts[-1].isdigit():
                        region_offsets[clean_region] = {
                            "prefix": "-".join(parts[:-1]),
                            "count": int(parts[-1])
                        }
                    else:
                        region_offsets[clean_region] = {"prefix": "MC-UNK", "count": 1}
                
                pfx = region_offsets[clean_region]["prefix"]
                cnt = region_offsets[clean_region]["count"]
                rec.id_code = f"{pfx}-{cnt:04d}"
                region_offsets[clean_region]["count"] += 1
            if not privacy_enabled:
                rec.mahalla = str(data.get("mahalla") or "").strip()
                rec.address = str(data.get("address") or "").strip()
            rec.height = format_val(data.get("height"), 0.0)
            rec.weight = format_val(data.get("weight"), 0.0)
            rec.chest = format_val(data.get("chest"), 0.0)
            rec.waist = format_val(data.get("waist"), 0.0)
            rec.head = format_val(data.get("head"), 0.0)
            rec.hip = format_val(data.get("hip"), 0.0)
            if not privacy_enabled:
                rec.birth_date = format_date(data.get("birth_date"), "")
            rec.examination_date = format_date(
                data.get("examination_date"), datetime.now().strftime("%Y-%m-%d")
            )
            if not privacy_enabled:
                rec.preschool_institution = str(data.get("preschool_institution") or "")
                rec.parents_phone = str(data.get("parents_phone") or "").strip() or None
            if privacy_enabled:
                rec.name = f"Maxfiy {rec.id_code}"
            rec.father_height = format_val(data.get("father_height"), None)
            rec.mother_height = format_val(data.get("mother_height"), None)
            rec.doctor_note = str(data.get("doctor_note") or "").strip() or None

            # Bio fields
            bio_fields = [
                field
                for field in (
                    "shoulder_length",
                    "shoulder_breadth",
                    "shoulder_circumference",
                    "arm_elbow_length",
                    "hand_length",
                    "thigh_length",
                    "thigh_circumference",
                    "calf_length",
                    "calf_circumference",
                    "foot_length",
                    "body_length",
                    "total_body_water",
                    "fat_percent",
                    "fat_mass",
                    "muscle_mass",
                    "bone_mass",
                    "acm",
                    "visceral_fat",
                )
                if import_field_enabled(field, import_permissions, privacy_enabled)
            ]
            for bf in bio_fields:
                val = data.get(bf)
                if val is not None:
                    setattr(rec, bf, format_val(val, 0.0))

            all_settings = clinical_service.get_all_settings(db)
            analysis = recalculate_analysis_fields(rec, db, lang="uz")
            advices = generate_advices(
                analysis["bmi"],
                analysis["weight_diff"],
                int(rec.age),
                rec.gender,
                all_settings,
                bio_data=analysis["indices"],
                lang="uz",
            )

            rec.recommendations = (
                f"General: {advices.get('general', '')}; "
                f"Nutrition: {advices.get('nutrition', '')}; "
                f"Sport: {advices.get('sport', '')}; "
                f"Activity: {advices.get('activity', '')}; "
                f"Specialist: {advices.get('specialist', '')}; "
                f"Checkups: {advices.get('checkups', '')}"
            )

            if is_new:
                db.add(rec)
                imported_count += 1
            else:
                updated_count += 1

        except Exception as e:
            skipped_count += 1
            add_import_error(
                row_idx, "row", f"Qatorni import qilishda xatolik: {str(e)}"
            )

    try:
        db.commit()
    except Exception as commit_err:
        db.rollback()
        logger.error(f"Excel import DB commit error: {commit_err}")
        # Agar commit fail qilsa, error qaytaramiz (500 o'rniga tushunarli matn)
        raise HTTPException(
            status_code=500, detail=f"Ma'lumotlarni saqlashda xatolik: {commit_err}"
        )

    return {
        "status": "success",
        "imported": imported_count,
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": errors,
    }


# ----------------- AUDIT LOGS (Removed duplicate, see lower implementation) ------------------



# ----------------- ADMIN ACTIVITY -----------------


@router.post("/activity/ping-form-start")
def ping_form_start(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Admin forma ochganini belgilash (vaqtni hisoblash uchun)."""
    current_user.last_form_open_at = datetime.utcnow()
    db.commit()
    return {"status": "ok"}


@router.post("/activity/location")
def update_live_location(
    payload: LocationPing,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Field assistant joriy koordinatasini SuperAdmin xaritasi uchun yangilaydi."""
    if current_user.role != "field_assistant":
        raise HTTPException(status_code=403, detail="Only field assistants can share live location")

    lat = float(payload.latitude)
    lng = float(payload.longitude)
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=422, detail="Invalid coordinates")

    current_user.latitude = lat
    current_user.longitude = lng
    current_user.last_active_at = datetime.utcnow()
    db.commit()
    return {
        "status": "ok",
        "latitude": current_user.latitude,
        "longitude": current_user.longitude,
        "last_active_at": current_user.last_active_at,
    }


@router.get("/activity", response_model=dict)
def get_admin_activity(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)
):
    """Faqat Super Admin uchun: barcha adminlar va izlanuvchilar faolligini ko'rish."""
    # Adminlar va Researcherlarni olamiz
    users = db.query(User).filter(User.role.in_(["admin", "researcher", "field_assistant"])).all()

    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    week_start = today_start - timedelta(days=date.today().weekday())
    month_start = datetime.combine(date.today().replace(day=1), datetime.min.time())

    result = []
    for u in users:
        # Status calculation
        status = "offline"
        is_typing = False

        if u.last_active_at:
            diff = (now - u.last_active_at).total_seconds()
            if diff < 60:  # 1 minut
                status = "online"
                # Agar oxirgi faollik juda yaqin bo'lsa va forma ochiq bo'lsa
                if u.last_form_open_at:
                    is_typing = True
            elif diff < 300:  # 5 minut
                status = "online"
            elif diff < 900:  # 15 minut
                status = "away"

        # Stats based on role
        if u.role == "researcher":
            model_class = ResearchRecord
        else:
            model_class = PatientAnalysis

        stats_today = (
            db.query(func.count(model_class.id))
            .filter(
                model_class.created_by_id == u.id,
                model_class.created_at >= today_start,
                model_class.is_deleted == 0,
            )
            .scalar()
            or 0
        )

        stats_week = (
            db.query(func.count(model_class.id))
            .filter(
                model_class.created_by_id == u.id,
                model_class.created_at >= week_start,
                model_class.is_deleted == 0,
            )
            .scalar()
            or 0
        )

        stats_month = (
            db.query(func.count(model_class.id))
            .filter(
                model_class.created_by_id == u.id,
                model_class.created_at >= month_start,
                model_class.is_deleted == 0,
            )
            .scalar()
            or 0
        )

        total_entries = (
            db.query(func.count(model_class.id))
            .filter(model_class.created_by_id == u.id, model_class.is_deleted == 0)
            .scalar()
            or 0
        )

        # Avg time
        avg_time = 0
        if u.completed_entries_count and u.completed_entries_count > 0:
            avg_time = round(
                (u.total_entry_time_seconds or 0) / u.completed_entries_count, 1
            )
        elif total_entries > 1:
            first_entry_at = (
                db.query(func.min(model_class.created_at))
                .filter(model_class.created_by_id == u.id, model_class.is_deleted == 0)
                .scalar()
            )
            last_entry_at = (
                db.query(func.max(model_class.created_at))
                .filter(model_class.created_by_id == u.id, model_class.is_deleted == 0)
                .scalar()
            )
            if first_entry_at and last_entry_at and last_entry_at > first_entry_at:
                avg_time = round(
                    (last_entry_at - first_entry_at).total_seconds()
                    / (total_entries - 1),
                    1,
                )

        # Most active hour
        most_active_hour = None
        try:
            # SQLite uchun strftime ishlatamiz
            hour_query = (
                db.query(
                    func.strftime("%H", model_class.created_at).label("hour"),
                    func.count(model_class.id).label("count"),
                )
                .filter(model_class.created_by_id == u.id, model_class.is_deleted == 0)
                .group_by("hour")
                .order_by(desc("count"))
                .first()
            )

            if hour_query:
                most_active_hour = f"{hour_query.hour}:00"
        except Exception as exc:
            logger.warning(
                "Unable to calculate most active hour for user %s: %s", u.id, exc
            )

        result.append(
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "region": u.region,
                "district": getattr(u, "district", None),
                "mahalla": getattr(u, "mahalla", None),
                "address": getattr(u, "address", None),
                "latitude": getattr(u, "latitude", None),
                "longitude": getattr(u, "longitude", None),
                "status": status,
                "is_typing": is_typing,
                "last_active_at": u.last_active_at,
                "stats_today": stats_today,
                "stats_week": stats_week,
                "stats_month": stats_month,
                "avg_entry_time": avg_time,
                "avg_entry_minutes": round(avg_time / 60, 1) if avg_time else 0,
                "most_active_hour": most_active_hour,
                "total_entries": total_entries,
            }
        )

    return {"items": result}

# ----------------- SECURITY EVENTS -------------------
def _security_event_to_dict(event: SecurityEvent) -> dict:
    return {
        "id": event.id,
        "event_type": event.event_type,
        "severity": event.severity,
        "status": event.status,
        "email": event.email,
        "ip_address": event.ip_address,
        "ip_location": describe_ip_location(event.ip_address),
        "user_agent": event.user_agent,
        "client_info": describe_user_agent(event.user_agent),
        "method": event.method,
        "path": event.path,
        "details": event.details,
        "threat_type": event.threat_type,
        "risk_score": event.risk_score or 0,
        "action_taken": event.action_taken,
        "matched_signals": event.matched_signals,
        "attempts": event.attempts,
        "created_at": event.created_at,
        "read_at": event.read_at,
        "is_blocked": is_ip_blocked(event.ip_address) if event.ip_address else False,
    }

@router.get("/security-events")
def list_security_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
):
    page = max(1, int(page or 1))
    page_size = min(100, max(1, int(page_size or 20)))
    query = db.query(SecurityEvent)
    if status and status != "ALL":
        query = query.filter(SecurityEvent.status == status)
    if severity and severity != "ALL":
        query = query.filter(SecurityEvent.severity == severity)

    total = query.count()
    unread = db.query(SecurityEvent).filter(SecurityEvent.status == "new").count()
    critical = db.query(SecurityEvent).filter(
        SecurityEvent.status == "new",
        SecurityEvent.severity == "critical",
    ).count()
    blocked = db.query(BlockedIP).count()
    high_risk = db.query(SecurityEvent).filter(SecurityEvent.risk_score >= 75).count()
    threat_rows = (
        db.query(SecurityEvent.threat_type, func.count(SecurityEvent.id))
        .filter(SecurityEvent.threat_type.isnot(None))
        .group_by(SecurityEvent.threat_type)
        .order_by(desc(func.count(SecurityEvent.id)))
        .limit(8)
        .all()
    )
    items = (
        query.order_by(desc(SecurityEvent.created_at), desc(SecurityEvent.id))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "items": [_security_event_to_dict(item) for item in items],
        "total": total,
        "unread": unread,
        "critical": critical,
        "blocked": blocked,
        "high_risk": high_risk,
        "threat_summary": [
            {"threat_type": row[0], "count": int(row[1] or 0)} for row in threat_rows
        ],
    }

@router.post("/security-events/mark-read")
def mark_security_events_read(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    now = datetime.utcnow()
    updated = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.status == "new")
        .update({"status": "read", "read_at": now}, synchronize_session=False)
    )
    db.commit()
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="SECURITY_EVENTS_READ",
        target_type="SecurityEvent",
        details=f"Security event notifications marked as read: {updated}",
        request=request,
    )
    return {"updated": updated}

@router.post("/security-events/block-ips")
def block_security_ips(
    payload: BlockIPRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    from utils.blocked_ips import block_ips
    
    count = block_ips(db, payload.ips, payload.reason)
    
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="BLOCK_IP",
        target_type="BlockedIP",
        details=f"{count} ta IP manzillar bloklandi: {payload.ips}",
        request=request,
    )
    return {"blocked_count": count, "ips": payload.ips}

@router.post("/security-events/{event_id}/false-positive")
def mark_security_event_false_positive(
    event_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    event = db.get(SecurityEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    event.status = "false_positive"
    event.action_taken = "marked_false_positive"
    event.read_at = datetime.utcnow()
    db.commit()
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="SECURITY_FALSE_POSITIVE",
        target_type="SecurityEvent",
        details=f"Security event {event_id} marked as false positive",
        request=request,
    )
    return {"updated": 1, "event_id": event_id}


@router.post("/security-events/unblock-ips")
def unblock_security_ips(
    payload: BlockIPRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    from utils.blocked_ips import BLOCKED_IPS_CACHE

    removed = 0
    for ip in payload.ips:
        if not ip:
            continue
        deleted = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).delete()
        if deleted:
            removed += int(deleted)
        BLOCKED_IPS_CACHE.discard(ip)
    db.commit()
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="UNBLOCK_IP",
        target_type="BlockedIP",
        details=f"{removed} ta IP blokdan chiqarildi: {payload.ips}",
        request=request,
    )
    return {"unblocked_count": removed, "ips": payload.ips}

# ----------------- AUDIT LOGS -------------------
@router.get("/audit-logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    page: int = 1,
    page_size: int = 50,
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    target_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    from sqlalchemy import or_
    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if target_type and target_type != "ALL":
        query = query.filter(AuditLog.target_type == target_type)
    if search:
        search_filter = f"%{search}%"
        query = query.outerjoin(AuditLog.user).filter(
            or_(
                AuditLog.details.ilike(search_filter),
                AuditLog.ip_address.ilike(search_filter),
                AuditLog.target_type.ilike(search_filter),
                User.name.ilike(search_filter),
                User.email.ilike(search_filter),
            )
        )

    total = query.count()
    logs_db = (
        query.order_by(desc(AuditLog.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for log in logs_db:
        items.append(
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": log.user.name if log.user else ("Mehmon" if log.user_id is None else "Noma'lum"),
                "user_email": log.user.email if log.user else None,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at,
            }
        )

    return {"items": items, "total": total}


@router.delete("/audit-logs/clear")
def clear_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    action: Optional[str] = Query(None),
):
    query = db.query(AuditLog)
    if action and action != "ALL":
        query = query.filter(AuditLog.action == action)

    count = query.delete(synchronize_session=False)
    db.commit()

    # After deleting, we must record that an admin cleared the logs
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE_HARD",
        target_type="AuditLog",
        details=f"Audit jurnali tozalandi: {action or 'Barchasi'} ({count} ta yozuv)",
        request=request,
    )

    return {"deleted": count}


# --- Role Settings ---
from models.settings import RoleSettings
from models.schemas import (
    PrivacyRoleSettingsOut,
    PrivacyRoleSettingsUpdate,
    RoleSettingsOut,
    RoleSettingsUpdate,
)

@router.get("/role-settings", response_model=List[RoleSettingsOut])
def get_role_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin), # Any admin can view
):
    roles = ["admin", "researcher", "user", "guest", "field_assistant"]
    settings = db.query(RoleSettings).all()
    existing_roles = {s.role_name for s in settings}
    
    missing_roles = [r for r in roles if r not in existing_roles]
    if missing_roles:
        for r in missing_roles:
            new_setting = RoleSettings(
                role_name=r,
                ai_chat_enabled=True,
                internal_chat_enabled=True,
                child_data_privacy_enabled=ROLE_PRIVACY_DEFAULTS.get(r, True),
            )
            db.add(new_setting)
        db.commit()
        settings = db.query(RoleSettings).all()
        
    return settings


def _ensure_privacy_role_settings(db: Session) -> List[RoleSettings]:
    settings = {
        item.role_name: item
        for item in db.query(RoleSettings)
        .filter(RoleSettings.role_name.in_(PRIVACY_MANAGED_ROLES))
        .all()
    }
    for role_name in PRIVACY_MANAGED_ROLES:
        if role_name not in settings:
            setting = RoleSettings(
                role_name=role_name,
                ai_chat_enabled=True,
                internal_chat_enabled=True,
                child_data_privacy_enabled=ROLE_PRIVACY_DEFAULTS[role_name],
            )
            db.add(setting)
            settings[role_name] = setting
    db.commit()
    return [settings[role_name] for role_name in PRIVACY_MANAGED_ROLES]


@router.get("/privacy-settings", response_model=List[PrivacyRoleSettingsOut])
def get_privacy_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    return _ensure_privacy_role_settings(db)


@router.put(
    "/privacy-settings/{role_name}",
    response_model=PrivacyRoleSettingsOut,
)
def update_privacy_setting(
    role_name: str,
    update_data: PrivacyRoleSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    role_name = normalize_privacy_role(role_name)
    if role_name not in PRIVACY_MANAGED_ROLES:
        raise HTTPException(status_code=400, detail="Bu rol uchun maxfiylik boshqarilmaydi")
    _ensure_privacy_role_settings(db)
    setting = (
        db.query(RoleSettings).filter(RoleSettings.role_name == role_name).first()
    )
    setting.child_data_privacy_enabled = update_data.child_data_privacy_enabled
    db.commit()
    db.refresh(setting)
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_PRIVACY",
        target_type="RoleSettings",
        details=(
            f"{role_name} roli uchun bolalar shaxsiy ma'lumotlari maxfiyligi: "
            f"{'yoqildi' if setting.child_data_privacy_enabled else 'o‘chirildi'}"
        ),
        request=request,
    )
    return setting

@router.put("/role-settings/{role_name}", response_model=RoleSettingsOut)
def update_role_setting(
    role_name: str,
    update_data: RoleSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin), # Only superadmin can edit
):
    setting = db.query(RoleSettings).filter(RoleSettings.role_name == role_name).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Role setting topilmadi")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    if "ai_chat_enabled" in update_dict:
        setting.ai_chat_enabled = update_dict["ai_chat_enabled"]
    if "internal_chat_enabled" in update_dict:
        setting.internal_chat_enabled = update_dict["internal_chat_enabled"]

    db.commit()
    db.refresh(setting)
    
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        target_type="RoleSettings",
        details=f"{role_name} roli uchun Chat holati o'zgartirildi: AI={setting.ai_chat_enabled}, Ichki={setting.internal_chat_enabled}",
        request=request,
    )
    
    return setting
