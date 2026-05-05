from fastapi import APIRouter, Depends, HTTPException, Header, Query, File, UploadFile, Request
from models.audit import AuditLog
from utils.audit_helper import record_audit_log
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, asc, desc, cast, Date, case
from datetime import datetime, date, timedelta
from typing import Optional, List

import os
import logging
import numpy as np
from io import BytesIO
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL


from utils.database import get_db
from models.user import User
from models.payment import Payment 
from models.userdata import PatientAnalysis, ResearchRecord
from routers.auth_router import get_current_user, get_current_admin, get_current_superadmin
from models.schemas import (
    UserCreate, UserUpdate, UserOut,
    PaymentCreate, PaymentOut
)
from routers.analyze_router import calculate_bmi as calc_full_bmi, PatientData, generate_advices, _split_region_and_district
from utils.translit import lat2cyr
from utils.security import get_password_hash
from services.clinical_service import clinical_service

# Router prefiksiz: main.py da /api/admin bilan ulangan bo'ladi
router = APIRouter(tags=["Admin"])
logger = logging.getLogger(__name__)

verify_admin = get_current_admin


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

def bmi_status_by_age(bmi: Optional[float], age: Optional[int]) -> str:
    if bmi is None or age is None:
        return "-"
    if age >= 20:
        if bmi < 18.5: return "Ozg‘in"
        if bmi < 25:   return "Normal"
        if bmi < 30:   return "Ortiqcha"
        return "Semizlik"
    # 2–19: soddalashtirilgan (keyinchalik WHO Z-score bilan almashtirasiz)
    if bmi < 12: return "Ozg‘in?"
    if bmi < 18: return "Normal?"
    if bmi < 22: return "Ortiqcha?"
    return "Semizlik?"

def to_dict_analysis(row: PatientAnalysis) -> dict:
    first_name, last_name = split_name(getattr(row, "name", None))
    bmi_val = getattr(row, "bmi", None)
    if bmi_val is None:
        bmi_val = calc_bmi(getattr(row, "weight", None), getattr(row, "height", None))
    payload = {
        "id": getattr(row, "id", None),
        "id_code": getattr(row, "id_code", None),
        "created_at": getattr(row, "created_at", None),
        "name": getattr(row, "name", None),
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
    }
    # Agar modelda mavjud bo'lsa: region, yelka, oyoq uzunliklari va hk
    extra_fields = (
        "region", "district", "address",
        "examination_date", "birth_date", "preschool_institution",
        "shoulder_length", "shoulder_breadth", "shoulder_circumference",
        "arm_elbow_length", "hand_length",
        "thigh_length", "thigh_circumference",
        "calf_length", "calf_circumference",
        "foot_length"
    )
    for extra in extra_fields:
        if hasattr(row, extra):
            payload[extra] = getattr(row, extra)
    
    # Add creator name if requested
    payload["created_by_id"] = getattr(row, "created_by_id", None)
    if hasattr(row, "created_by") and row.created_by:
        payload["created_by_name"] = row.created_by.name
    else:
        payload["created_by_name"] = "Noma'lum"

    # Soft delete ma'lumotlari
    payload["is_deleted"] = bool(getattr(row, "is_deleted", False))
    payload["deleted_at"] = getattr(row, "deleted_at", None)
    if hasattr(row, "deleted_by") and row.deleted_by:
        payload["deleted_by_name"] = row.deleted_by.name
    else:
        payload["deleted_by_name"] = None
        
    return payload

# ------------------ USERS ----------------------
@router.get("/users", response_model=List[UserOut], dependencies=[Depends(get_current_superadmin)])
def list_users(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(User)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like), User.phone.ilike(like)))
    items = (
        query.order_by(User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items

@router.post("/users", response_model=UserOut)
def create_user(
    payload: UserCreate, 
    request: Request, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_superadmin)
):
    # Check if email exists
    if payload.email:
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise HTTPException(400, "Ushbu email bilan foydalanuvchi allaqachon mavjud.")
            
    user_data = payload.model_dump(exclude_unset=True)
    
    # Hash password if provided
    if "password" in user_data:
        password = user_data.pop("password")
        if password:
            user_data["hashed_password"] = get_password_hash(password)
            
    # Remove password_confirm before DB model creation
    if "password_confirm" in user_data:
        user_data.pop("password_confirm")
            
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Audit Log
    record_audit_log(
        db=db,
        user_id=current_admin.id,
        action="CREATE",
        target_type="User",
        target_id=user.id,
        details=f"Yangi foydalanuvchi yaratildi: {user.name} ({user.role})",
        request=request
    )
    
    return user

@router.get("/users/{user_id}", response_model=UserOut, dependencies=[Depends(get_current_superadmin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, 
    payload: UserUpdate, 
    request: Request, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    
    # Check if new email conflicts with other users
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = db.query(User).filter(User.email == update_data["email"]).first()
        if existing_user:
            raise HTTPException(400, "Ushbu email allaqachon boshqa foydalanuvchi tomonidan band etilgan.")

    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            user.hashed_password = get_password_hash(password)

    for k, v in update_data.items():
        setattr(user, k, v)
        
    db.commit()
    db.refresh(user)
    
    # Audit Log
    record_audit_log(
        db=db,
        user_id=current_admin.id,
        action="UPDATE",
        target_type="User",
        target_id=user.id,
        details=f"Foydalanuvchi ma'lumotlari yangilandi: {user.name}",
        request=request
    )
    
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    request: Request, 
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_superadmin)
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
        request=request
    )
    
    return {"status": "deleted"}

# ---------------- ANALYSES ---------------------
@router.get("/analyses")
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
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
    base = db.query(PatientAnalysis)

    if current_user.role != "superadmin":
        # Oddiy admin: faqat o'z ma'lumotlari + o'chirilmaganlar
        base = base.filter(
            PatientAnalysis.created_by_id == current_user.id,
            (PatientAnalysis.is_deleted == 0) | (PatientAnalysis.is_deleted == None)
        )
    else:
        # Super admin: barcha ma'lumotlar
        # Agar show_deleted=False bo'lsa — faqat o'chirilmaganlar
        if not show_deleted:
            base = base.filter(
                (PatientAnalysis.is_deleted == 0) | (PatientAnalysis.is_deleted == None)
            )
        else:
            # show_deleted=True bo'lsa hech qanday filter yo'q — barcha ko'rinadi (o'chirilganlar ham)
            pass

    # Qidiruv
    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.name.ilike(like))

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
        "name": getattr(PatientAnalysis, "name", None),
        "gender": getattr(PatientAnalysis, "gender", None),
        "age": getattr(PatientAnalysis, "age", None),
        "height": getattr(PatientAnalysis, "height", None),
        "weight": getattr(PatientAnalysis, "weight", None),
        "bmi": getattr(PatientAnalysis, "bmi", None),
        "last_name": getattr(PatientAnalysis, "name", None),
    }
    col = sort_map.get(sort_key) or getattr(PatientAnalysis, "created_at", None)
    if col is not None:
        base = base.order_by(asc(col) if sort_dir == "asc" else desc(col))

    base = base.options(joinedload(PatientAnalysis.created_by), joinedload(PatientAnalysis.deleted_by))

    items_db = base.offset(max(0, (page - 1) * page_size)).limit(page_size).all()
    items = [to_dict_analysis(r) for r in items_db]
    return {"items": items, "total": int(total)}

@router.get("/analyses/{analysis_id}")
def get_analysis(
    analysis_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    rec = db.get(PatientAnalysis, analysis_id)
    if not rec:
        raise HTTPException(404, "Analysis not found")
    
    # Ownership Check
    if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
        raise HTTPException(403, "Ushbu ma'lumotni ko'rishga huquqingiz yo'q")
        
    return to_dict_analysis(rec)

class AdminDeleteRequestModel(BaseModel):
    ids: List[int]

@router.delete("/analyses")
def delete_analyses(
    payload: AdminDeleteRequestModel, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Soft delete: ma'lumot DB dan o'chirmaydi, is_deleted=1 deb belgilaydi.
    """
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
            names.append(rec.name)
        
        db.commit()
        
        if count > 0:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="DELETE_SOFT",
                target_type="PatientAnalysis",
                details=f"{count} ta tahlil savatga yuborildi: {', '.join(names[:3])}{'...' if len(names)>3 else ''}",
                request=request
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
    current_user: User = Depends(get_current_superadmin)
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
                request=request
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
    current_user: User = Depends(get_current_superadmin)
):
    """O'chirilgan ma'lumotni tiklash — faqat super admin."""
    if not payload.ids:
        return {"restored": 0}
    try:
        q = db.query(PatientAnalysis).filter(PatientAnalysis.id.in_(payload.ids))
        count = q.update({
            "is_deleted": 0,
            "deleted_by_id": None,
            "deleted_at": None
        }, synchronize_session=False)
        
        db.commit()
        
        if count:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="RESTORE",
                target_type="PatientAnalysis",
                details=f"{count} ta tahlil savatdan tiklandi (IDlar: {payload.ids[:5]})",
                request=request
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
    current_user: User = Depends(get_current_admin)
):
    try:
        rec = db.get(PatientAnalysis, analysis_id)
        if not rec:
            raise HTTPException(404, "Analysis not found")
            
        # Ownership Check
        if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
            raise HTTPException(403, "Ushbu ma'lumotni o'zgartirishga huquqingiz yo'q")
            
        old_name = rec.name
        
        # ... logic for update (kept as is) ...
        # (Actually I need to keep the code here to avoid broken endpoint)
        
        # 1. Ismni yangilash
        first_name = payload.get("firstName")
        last_name = payload.get("lastName")
        if first_name is not None or last_name is not None:
            old_first, old_last = split_name(rec.name)
            new_first = first_name if first_name is not None else old_first
            new_last = last_name if last_name is not None else old_last
            rec.name = f"{new_first or ''} {new_last or ''}".strip()

        # 2. Region/District yangilash
        if "region" in payload or "district" in payload:
            reg = payload.get("region", rec.region)
            dist = payload.get("district", rec.district)
            clean_reg, clean_dist = _split_region_and_district(reg, dist)
            rec.region = clean_reg
            rec.district = clean_dist

        # 3. Barcha o'lchovlarni yangilash
        fields_to_update = [
            "age", "age_months", "age_days", "gender", "height", "weight", "chest", "waist", "head",
            "shoulder_length", "shoulder_breadth", "shoulder_circumference",
            "arm_elbow_length", "hand_length", "thigh_length", "thigh_circumference",
            "calf_length", "calf_circumference", "foot_length", "body_length",
            "total_body_water", "fat_percent", "fat_mass", "muscle_mass", "bone_mass", "acm", "visceral_fat",
            "address", "examination_date", "birth_date", "preschool_institution", "ai_recommendations"
        ]
        
        changes = []
        for f in fields_to_update:
            camel_f = "".join(x.capitalize() or "_" for x in f.split("_"))
            camel_f = camel_f[0].lower() + camel_f[1:] 
            val = payload.get(camel_f)
            if val is None: val = payload.get(f)
                
            if val is not None:
                old_val = getattr(rec, f)
                if str(old_val) != str(val):
                    changes.append(f"{f}: {old_val} -> {val}")
                setattr(rec, f, val)

        # 4. Qayta hisoblash
        try:
            # Re-calculate using calc_full_bmi (skipped for brevity here but keeping original logic flow)
            p_data = PatientData(
                firstName=split_name(rec.name)[0],
                lastName=split_name(rec.name)[1],
                region=rec.region or "",
                district=rec.district,
                address=rec.address or "",
                examinationDate=rec.examination_date or "",
                birthDate=rec.birth_date or "Noma'lum",
                preschoolInstitution=rec.preschool_institution or "Noma'lum",
                age=int(rec.age or 0),
                ageMonths=int(rec.age_months or 0),
                ageDays=int(rec.age_days or 0),
                gender=rec.gender or "noma'lum",
                height=float(rec.height or 0.0),
                weight=float(rec.weight or 0.0),
                chest=float(rec.chest or 0.0),
                waist=float(rec.waist or 0.0),
                head=float(rec.head or 0.0),
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
                visceralFat=rec.visceral_fat
            )
            analysis = calc_full_bmi(p_data)
            advices = generate_advices(analysis["bmi"], analysis["weight_diff"], int(rec.age), rec.gender, bio_data=analysis["indices"])
            rec.bmi = float(analysis["bmi"])
            rec.z_score = float(analysis["z_score"])
            rec.somatotype = str(analysis["somatotype"])
            rec.recommendations = f"General: {advices.get('general', '')}; Nutrition: {advices.get('nutrition', '')}"
        except: pass

        db.commit()
        db.refresh(rec)
        
        record_audit_log(
            db=db,
            user_id=current_user.id,
            action="UPDATE",
            target_type="PatientAnalysis",
            target_id=rec.id,
            details=f"Tahlil yangilandi: {rec.name}. O'zgarishlar: {', '.join(changes[:3])}{'...' if len(changes)>3 else ''}",
            request=request
        )
        
        return to_dict_analysis(rec)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR in update_analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Ma'lumotni yangilashda xatolik: {str(e)}")


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

@router.post("/payments", response_model=PaymentOut, dependencies=[Depends(verify_admin)])
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
    current_user: User = Depends(get_current_admin),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    region: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    somatotype: Optional[str] = Query(None)
):
    # Base count of users (only for superadmin?)
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    # Filter analyses stats by ownership and exclusion of deleted records
    analysis_q = db.query(PatientAnalysis).filter(
        (PatientAnalysis.is_deleted == 0) | (PatientAnalysis.is_deleted == None)
    )
    if current_user.role != "superadmin":
        analysis_q = analysis_q.filter(PatientAnalysis.created_by_id == current_user.id)

    # Apply Filters
    if gender:
        analysis_q = analysis_q.filter(func.lower(PatientAnalysis.gender) == gender.lower())
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
        
    total_analyses = analysis_q.with_entities(func.count(PatientAnalysis.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    
    # Combined Query for Distribution Stats (Optimization)
    today_start = datetime.combine(date.today(), datetime.min.time())
    current_month_start = datetime.combine(date.today().replace(day=1), datetime.min.time())
    
    dist_stats = analysis_q.with_entities(
        func.count(case(((PatientAnalysis.bmi < 18.5), 1))).label("bmi_underweight"),
        func.count(case(((PatientAnalysis.bmi >= 18.5) & (PatientAnalysis.bmi < 25), 1))).label("bmi_normal"),
        func.count(case(((PatientAnalysis.bmi >= 25) & (PatientAnalysis.bmi < 30), 1))).label("bmi_overweight"),
        func.count(case(((PatientAnalysis.bmi >= 30), 1))).label("bmi_obese"),
        func.count(case(((PatientAnalysis.age <= 6), 1))).label("age_0_6"),
        func.count(case(((PatientAnalysis.age > 6) & (PatientAnalysis.age <= 12), 1))).label("age_7_12"),
        func.count(case(((PatientAnalysis.age > 12) & (PatientAnalysis.age <= 18), 1))).label("age_13_18"),
        func.count(case(((PatientAnalysis.age > 18), 1))).label("age_18_plus"),
        func.count(case(((PatientAnalysis.created_at >= today_start), 1))).label("today_count"),
        func.count(case(((PatientAnalysis.created_at >= current_month_start), 1))).label("monthly_count"),
        func.avg(PatientAnalysis.bmi).label("avg_bmi")
    ).first()

    if not dist_stats:
        avg_bmi = 0
        bmi_dist = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
        age_groups = [{"name": "0-6", "value": 0}, {"name": "7-12", "value": 0}, {"name": "13-18", "value": 0}, {"name": "18+", "value": 0}]
        today_analyses = 0
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
        monthly_analyses = dist_stats.monthly_count or 0

    # Somatotype Average Approximation (for Radar Chart)
    avg_fat = analysis_q.with_entities(func.avg(PatientAnalysis.fat_percent)).scalar() or 20
    # Use NULLIF to prevent ZeroDivisionError
    avg_muscle = analysis_q.with_entities(
        func.avg(PatientAnalysis.muscle_mass / func.nullif(PatientAnalysis.weight, 0))
    ).scalar() or 0.4
    
    # Ectomorphy approximation using Reciprocal Ponderal Index (RPI) = height / weight^(1/3)
    rpi_avg = analysis_q.with_entities(
        func.avg(PatientAnalysis.height / func.nullif(func.pow(PatientAnalysis.weight, 1.0/3.0), 0))
    ).scalar() or 40

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
        is_male = gl in ['erkak', 'male', 'boy', 'm', 'male'] or "o'g'il" in gl or "о'ғил" in gl or 'муж' in gl
        is_female = gl in ['ayol', 'female', 'girl', 'f'] or 'qiz' in gl or 'қиз' in gl or 'жен' in gl
        
        if is_male:
            gender_map["erkak"] += int(c)
        elif is_female:
            gender_map["ayol"] += int(c)
        else:
            gender_map["noma'lum"] += int(c)

    # Somatotype Distribution
    somatotype_counts = (
        analysis_q.with_entities(PatientAnalysis.somatotype, func.count(PatientAnalysis.id))
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
    regional_data = [{"region": r or "Noma'lum", "count": int(c)} for r, c in regional_counts]

    # Monthly Trend (Last 12 months)
    try:
        trend_counts = (
            analysis_q.with_entities(
                func.strftime('%Y-%m', PatientAnalysis.created_at).label("month"),
                func.count(PatientAnalysis.id),
                func.avg(PatientAnalysis.bmi).label("avg_bmi")
            )
            .group_by("month")
            .order_by("month")
            .all()
        )
        monthly_trend = [
            {"month": str(m) if m else "Noma'lum", "count": int(c), "avg_bmi": float(b or 0)} 
            for m, c, b in trend_counts
        ][-12:]
        
        monthly_avg = sum(item["count"] for item in monthly_trend) / len(monthly_trend) if monthly_trend else 0
    except Exception as e:
        logger.error(f"Monthly trend error: {e}")
        monthly_trend = []
        monthly_avg = 0

    # --- 🔬 Advanced Scientific Analysis & Risk Groups ---
    # Fetch data for calculations (only what's needed)
    sci_rows = analysis_q.with_entities(
        PatientAnalysis.age,
        PatientAnalysis.height,
        PatientAnalysis.weight,
        PatientAnalysis.bmi,
        PatientAnalysis.chest,
        PatientAnalysis.z_score
    ).all()
    
    # Initialize response fields
    bmi_dist = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
    bmi_histogram = []
    percentile_data = []
    z_score_dist = []
    corr_matrix = []
    
    if sci_rows:
        # Robustly extract data as numpy arrays
        # row objects from with_entities are like named tuples
        ages = np.array([float(r[0] or 0) for r in sci_rows])
        heights = np.array([float(r[1] or 0) for r in sci_rows])
        weights = np.array([float(r[2] or 0) for r in sci_rows])
        bmis = np.array([float(r[3] or 0) for r in sci_rows])
        chests = np.array([float(r[4] or 0) for r in sci_rows])
        z_vals = np.array([float(r[5] or 0) for r in sci_rows])
        
        # A. Scientific BMI Distribution (Risk Groups)
        # Uses age-appropriate criteria: Z-score for children (<19), BMI for adults
        for i in range(len(sci_rows)):
            a, z, b = ages[i], z_vals[i], bmis[i]
            if a < 19:
                if z < -2: bmi_dist["underweight"] += 1
                elif z <= 1: bmi_dist["normal"] += 1
                elif z <= 2: bmi_dist["overweight"] += 1
                else: bmi_dist["obese"] += 1
            else:
                if b < 18.5: bmi_dist["underweight"] += 1
                elif b < 25: bmi_dist["normal"] += 1
                elif b < 30: bmi_dist["overweight"] += 1
                else: bmi_dist["obese"] += 1

        # B. Real Percentiles
        try:
            for p in [10, 25, 50, 75, 90]:
                percentile_data.append({
                    "percentile": f"P{p}",
                    "bmi": round(float(np.percentile(bmis, p)), 1),
                    "height": round(float(np.percentile(heights, p)), 1),
                    "weight": round(float(np.percentile(weights, p)), 1)
                })
        except: pass
            
        # C. BMI Histogram (Traditional ranges)
        hist_ranges = [
            ("<16", 0, 16), ("16-18.5", 16, 18.5), ("18.5-25", 18.5, 25),
            ("25-30", 25, 30), ("30-35", 30, 35), ("35-40", 35, 40), (">40", 40, 999)
        ]
        for label, low, high in hist_ranges:
            count = np.sum((bmis >= low) & (bmis < high))
            bmi_histogram.append({"range": label, "count": int(count)})
            
        # D. Correlation Matrix
        try:
            matrix_data = np.stack([bmis, ages, heights, weights, chests], axis=0)
            corr = np.corrcoef(matrix_data)
            labels = ["BMI", "Yosh", "Bo'y", "Vazn", "Ko'krak"]
            for i, label in enumerate(labels):
                row_data = {"param": label}
                for j, target_label in enumerate(labels):
                    key = target_label.lower().replace("'", "").replace("o'", "o").replace("u'", "u").replace(" ", "_")
                    if "krak" in key: key = "ko_krak"
                    val = corr[i, j]
                    # Handle NaN values for JSON serialization
                    row_data[key] = float(val) if not np.isnan(val) else 0.0
                corr_matrix.append(row_data)
        except Exception as e:
            logger.error(f"Correlation matrix error: {e}")
            pass

        # E. Z-Score Distribution (WHO-standard bins)
        # Using standard sigma labels, ensuring they are valid UTF-8
        z_bins = [
            ("< -2 SD", -999, -2, -2.5),
            ("-2 SD — -1 SD", -2, -1, -1.5),
            ("-1 SD — 0 (Norm-)", -1, 0, -0.5),
            ("0 — +1 SD (Norm+)", 0, 1, 0.5),
            ("+1 SD — +2 SD", 1, 2, 1.5),
            ("> +2 SD (Risk)", 2, 999, 2.5)
        ]
        total_n = len(z_vals)
        for label, low, high, mid_z in z_bins:
            count = np.sum((z_vals >= low) & (z_vals < high))
            z_score_dist.append({
                "category": label,
                "count": int(count),
                "pct": round(float(count / total_n * 100), 1) if total_n > 0 else 0,
                "zscore": mid_z
            })

    return {
        "total_users": int(total_users),
        "total_analyses": int(total_analyses),
        "today_analyses": int(today_analyses),
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
        "correlation_matrix": corr_matrix
    }



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
):
    base = db.query(PatientAnalysis)
    
    # Ownership Filter
    if current_user.role != "superadmin":
        base = base.filter(PatientAnalysis.created_by_id == current_user.id)
        
    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.name.ilike(like))
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

    rows_db = base.options(joinedload(PatientAnalysis.created_by), joinedload(PatientAnalysis.deleted_by)).order_by(PatientAnalysis.created_at.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Analyses"

    # Sarlavhalar (To'liq o'zbekcha kirill yozuvida, texnik qismlar lotinda)
    headers = [
        "Сана", "ID код", "Ф.И.Ш.", "Жинс", "Ёш", "Вилоят", "Туман", "Манзил", "Киритди",
        "Бўй (см)", "Вазн (кг)", "ИАВ", "Ҳолат", "Соматотип",
        "Идеал Вазн (кг)", "Фарқ (кг)", "Вазн Оралиғи",
        "Кўкрак айл.", "Бел айл.", "Бош айл.",
        "Елка кенг.", "Елка проп.", "Сон айл.", "Сон проп.",
        "HMAI", "MII", "ADI",
        "TBW (%)", "Ёғ (%)", "Ёғ (кг)",
        "Мускул (кг)", "Суяк (кг)",
        "ACM (%)", "Висцерал Ёғ", "Тана узунлиги (см)"
    ]
    
    # Header styling
    header_fill = PatternFill(start_color="3498DB", end_color="3498DB", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = border

    # Fetch settings for calculations
    all_settings = clinical_service.get_all_settings(db)

    # Ma'lumotlarni yozish
    row_idx = 2
    for r in rows_db:
        # Hisob-kitoblar uchun PatientData yaratamiz (Mocking for calculate_bmi)
        try:
            p_data = PatientData(
                firstName="", lastName=r.name or "", region=r.region or "", 
                address=r.address or "", examinationDate="", age=r.age or 0, 
                gender=r.gender or "noma'lum", height=r.height or 0.0, 
                weight=r.weight or 0.0, chest=r.chest or 0.0, head=r.head or 0.0,
                shoulderBreadth=getattr(r, "shoulder_breadth", 0.0) or 0.0,
                thighCircumference=getattr(r, "thigh_circumference", 0.0) or 0.0,
                waist=getattr(r, "waist", 0.0) or 0.0,
                # Bioimpedance fields from DB
                totalBodyWater=getattr(r, "total_body_water", None),
                fatPercent=getattr(r, "fat_percent", None),
                fatMass=getattr(r, "fat_mass", None),
                muscleMass=getattr(r, "muscle_mass", None),
                boneMass=getattr(r, "bone_mass", None),
                acm=getattr(r, "acm", None),
                visceralFat=getattr(r, "visceral_fat", None),
                bodyLength=getattr(r, "body_length", None)
            )
            analysis = calc_full_bmi(p_data, all_settings=all_settings, lang="uz")
        except Exception as e:
            logger.error(f"Error calculating analysis for XLSX row (id={r.id}): {e}")
            analysis = {}

        vazn_range = ""
        if "ideal_weight_range" in analysis:
            rng = analysis["ideal_weight_range"]
            vazn_range = f"{rng.get('min', '-')}-{rng.get('max', '-')}"

        # Yosh formati
        age_m = getattr(r, "age_months", 0) or 0
        age_d = getattr(r, "age_days", 0) or 0
        age_str = f"{r.age} й."
        if age_m:
            age_str += f", {age_m} о."
        if age_d:
            age_str += f", {age_d} к."

        vals = [
            r.created_at.strftime("%Y-%m-%d") if r.created_at else "-",
            r.id_code or "-",
            lat2cyr(r.name) if r.name else "-",
            lat2cyr(r.gender) if r.gender else "-",
            age_str,
            lat2cyr(r.region) if r.region else "-",
            lat2cyr(r.district) if r.district else "-",
            lat2cyr(r.address) if r.address else "-",
            lat2cyr(r.created_by.name) if r.created_by and r.created_by.name else "-",
            r.height or 0,
            r.weight or 0,
            analysis.get("bmi", r.bmi or "-"),
            lat2cyr(analysis.get("bmi_category", "-")),
            lat2cyr(analysis.get("somatotype", r.somatotype or "-")),
            analysis.get("ideal_weight", "-"),
            analysis.get("weight_diff", "-"),
            vazn_range,
            r.chest or 0,
            getattr(r, "waist", 0) or 0,
            r.head or 0,
            getattr(r, "shoulder_breadth", 0) or 0,
            analysis.get("shoulder_ratio", "-"),
            getattr(r, "thigh_circumference", 0) or 0,
            analysis.get("thigh_ratio", "-"),
            analysis.get("indices", {}).get("hmai", "-"),
            analysis.get("indices", {}).get("mii", "-"),
            analysis.get("indices", {}).get("adi", "-"),
            analysis.get("indices", {}).get("tbw_percent", "-"),
            analysis.get("indices", {}).get("fm_percent", "-"),
            analysis.get("indices", {}).get("fm", "-"),
            analysis.get("indices", {}).get("muscle_mass", "-"),
            analysis.get("indices", {}).get("bone_mass", "-"),
            analysis.get("indices", {}).get("acm_percent", "-"),
            analysis.get("indices", {}).get("visceral_fat", "-"),
            r.body_length or 0,
        ]
        
        # Barcha string qiymatlarni lat2cyr orqali o'girish shart emas —
        # sarlavhalar allaqachon kirill yozuvida

        for col_num, val in enumerate(vals, 1):
            cell = ws.cell(row=row_idx, column=col_num, value=val)
            cell.alignment = Alignment(horizontal='left', vertical='center')
            cell.border = border
            # Alt rows styling (zebra)
            if row_idx % 2 == 0:
                cell.fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
        
        row_idx += 1

    # Avto-column width
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"morphocheck_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# -------------- O'CHIRILGAN MA'LUMOTLAR (Super Admin) ------------------
@router.get("/deleted-analyses", dependencies=[Depends(get_current_superadmin)])
def list_deleted_analyses(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 20,
):
    """
    Faqat super admin: barcha soft-deleted ma'lumotlarni ro'yxati.
    """
    base = db.query(PatientAnalysis).filter(
        (PatientAnalysis.is_deleted == 1)
    )
    if q:
        like = f"%{q}%"
        base = base.filter(PatientAnalysis.name.ilike(like))

    total = base.with_entities(func.count(PatientAnalysis.id)).scalar() or 0
    items_db = (
        base.options(joinedload(PatientAnalysis.created_by), joinedload(PatientAnalysis.deleted_by))
        .order_by(desc(PatientAnalysis.deleted_at))
        .offset(max(0, (page - 1) * page_size))
        .limit(page_size)
        .all()
    )
    items = [to_dict_analysis(r) for r in items_db]
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
        base = base.filter(PatientAnalysis.name.ilike(like))

    rows_db = base.options(joinedload(PatientAnalysis.created_by), joinedload(PatientAnalysis.deleted_by)).order_by(desc(PatientAnalysis.deleted_at)).all()

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
        "№", "ID Kod", "F.I.Sh.", "Jins", "Yosh",
        "Viloyat / Tuman", "Bo'y (sm)", "Vazn (kg)", "BMI",
        "Somatotip", "O'chirgan Admin", "O'chirilgan Sana"
    ]
    col_widths_cm = [
        0.8, 2.0, 3.5, 1.5, 1.2,
        3.0, 1.5, 1.5, 1.5,
        2.5, 3.0, 3.0
    ]

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
        from docx.oxml.ns import qn
        from docx.oxml import OxmlElement
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
        bmi_val = getattr(r, "bmi", None) or calc_bmi(getattr(r, "weight", None), getattr(r, "height", None))
        bmi_str = f"{round(bmi_val, 1)}" if bmi_val else "-"

        age_str = f"{r.age} y."
        if getattr(r, "age_months", None):
            age_str += f" {r.age_months} oy"

        deleted_at_str = (
            r.deleted_at.strftime("%Y-%m-%d %H:%M") if getattr(r, "deleted_at", None) else "-"
        )
        deleted_by_str = (
            r.deleted_by.name if (hasattr(r, "deleted_by") and r.deleted_by) else "Noma'lum"
        )
        region_str = f"{r.region or '-'} / {getattr(r, 'district', '') or '-'}"

        values = [
            str(idx),
            r.id_code or "-",
            lat2cyr(r.name) if r.name else "-",
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
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 2 else WD_ALIGN_PARAGRAPH.LEFT
            run = para.add_run(val)
            run.font.size = Pt(8)

            # Alternating row color
            from docx.oxml.ns import qn
            from docx.oxml import OxmlElement
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
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ----------------- BULK IMPORT / TEMPLATE ------------------

@router.get("/export-template")
def export_template():
    """Import uchun Excel shablonini yuklab olish."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Template"

    # Sarlavhalar (Lotin yozuvida, import qilish oson bo'lishi uchun)
    # Ammo userga tushunarli bo'lishi uchun Kirillda ham qoldirish mumkin.
    # Biz Lotin (field name) + Izoh (Kirill) kombinatsiyasini ishlatamiz.
    
    headers = [
        "first_name (Ism) *", "last_name (Familiya) *", "gender (erkak/ayol) *", 
        "age (Yosh) *", "age_months (Yosh oylar)", "age_days (Yosh kunlar)",
        "region (Viloyat) *", "district (Tuman)", "address (Manzil)",
        "height (Bo'y, sm) *", "weight (Vazn, kg) *", "chest (Ko'krak qafasi, sm) *",
        "waist (Bel айланаси, sm) *", "head (Bosh айланаси, sm) *",
        "birth_date (Tug'ilgan sana: YYYY-MM-DD)", "examination_date (Sana: YYYY-MM-DD)", 
        "preschool_institution (Muassasa)",
        "shoulder_length", "shoulder_breadth", "shoulder_circumference",
        "arm_elbow_length", "hand_length", "thigh_length", "thigh_circumference",
        "calf_length", "calf_circumference", "foot_length", "body_length",
        "total_body_water", "fat_percent", "fat_mass", "muscle_mass", "bone_mass", "acm", "visceral_fat"
    ]

    header_fill = PatternFill(start_color="2ECC71", end_color="2ECC71", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center')

    # Namuna qator
    sample = [
        "Ali", "Valiyev", "erkak", 10, 5, 12,
        "Toshkent", "Yunusobod", "Amir Temur ko'chasi",
        140.5, 35.2, 70, 65, 52,
        "2014-05-10", "2024-05-10", "123-maktab",
        15, 30, 25, 20, 15, 40, 35, 25, 20, 22, 135,
        None, None, None, None, None, None, None
    ]
    for col_num, val in enumerate(sample, 1):
        ws.cell(row=2, column=col_num, value=val)

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=morphocheck_template.xlsx"}
    )


@router.post("/import-xlsx")
async def import_analyses_xlsx(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Excel orqali ommaviy ma'lumot yuklash."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "Faqat Excel fayllari (.xlsx, .xls) qabul qilinadi.")

    contents = await file.read()
    wb = load_workbook(BytesIO(contents), data_only=True)
    ws = wb.active

    # Field mapping (header index -> field name)
    field_map = {
        0: "first_name", 1: "last_name", 2: "gender", 3: "age", 4: "age_months", 5: "age_days",
        6: "region", 7: "district", 8: "address",
        9: "height", 10: "weight", 11: "chest", 12: "waist", 13: "head",
        14: "birth_date", 15: "examination_date", 16: "preschool_institution",
        17: "shoulder_length", 18: "shoulder_breadth", 19: "shoulder_circumference",
        20: "arm_elbow_length", 21: "hand_length", 22: "thigh_length", 23: "thigh_circumference",
        24: "calf_length", 25: "calf_circumference", 26: "foot_length", 27: "body_length",
        28: "total_body_water", 29: "fat_percent", 30: "fat_mass", 31: "muscle_mass", 32: "bone_mass",
        33: "acm", 34: "visceral_fat"
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
        errors.append({
            "row": row,
            "field": field,
            "message": message,
            "value": safe_cell_value(value)
        })

    def is_blank(v):
        return v is None or str(v).strip() == ""

    def is_number_like(v):
        if is_blank(v):
            return False
        if isinstance(v, (int, float)):
            return True
        try:
            float(str(v).strip().replace(',', '.'))
            return True
        except Exception:
            return False

    def format_val(v, default=0.0):
        if v is None or v == "": return default
        if isinstance(v, (int, float)): return float(v)
        try:
            ts = str(v).strip().replace(',', '.')
            if not ts or ts.lower() == 'nan': return default
            return float(ts)
        except:
            return default

    def format_int(v, default=0):
        if v is None or v == "": return default
        if isinstance(v, int): return v
        if isinstance(v, float): return int(v)
        try:
            ts = str(v).strip().split('.')[0] # handle '10.0' as string
            if not ts: return default
            return int(ts)
        except:
            return default

    def format_date(v, default=""):
        if not v: return default
        if isinstance(v, (datetime, date)):
            return v.strftime("%Y-%m-%d")
        return str(v).strip()

    # Skip header (row 1)
    for row_idx, row in enumerate(ws.iter_rows(min_row=2), 2):
        row_values = [cell.value for cell in row]
        if not any(row_values): continue # Bo'sh qator

        try:
            data = {}
            for col_idx, field in field_map.items():
                if col_idx < len(row_values):
                    data[field] = row_values[col_idx]
            
            row_errors = []
            required_fields = {
                "first_name": "Ism majburiy.",
                "last_name": "Familiya majburiy.",
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
                row_errors.append(("gender", "Jins 'erkak' yoki 'ayol' bo'lishi kerak.", data.get("gender")))

            numeric_fields = [
                "age", "age_months", "age_days", "height", "weight", "chest", "waist", "head",
                "shoulder_length", "shoulder_breadth", "shoulder_circumference",
                "arm_elbow_length", "hand_length", "thigh_length", "thigh_circumference",
                "calf_length", "calf_circumference", "foot_length", "body_length",
                "total_body_water", "fat_percent", "fat_mass", "muscle_mass", "bone_mass", "acm", "visceral_fat"
            ]
            for field in numeric_fields:
                if not is_blank(data.get(field)) and not is_number_like(data.get(field)):
                    row_errors.append((field, "Raqam formatida bo'lishi kerak.", data.get(field)))

            if is_number_like(data.get("age")) and not (0 <= format_int(data.get("age"), -1) <= 19):
                row_errors.append(("age", "Yosh 0 dan 19 gacha bo'lishi kerak.", data.get("age")))

            if is_number_like(data.get("height")) and not (30 <= format_val(data.get("height"), 0) <= 250):
                row_errors.append(("height", "Bo'y 30-250 sm oralig'ida bo'lishi kerak.", data.get("height")))

            if is_number_like(data.get("weight")) and not (1 <= format_val(data.get("weight"), 0) <= 250):
                row_errors.append(("weight", "Vazn 1-250 kg oralig'ida bo'lishi kerak.", data.get("weight")))

            if row_errors:
                skipped_count += 1
                for field, message, value in row_errors:
                    add_import_error(row_idx, field, message, value)
                continue

            # Convert types
            full_name = f"{data['first_name']} {data['last_name']}".strip()
            gender = str(data.get("gender") or "erkak").lower()
            if "ayol" in gender or "fem" in gender: gender = "ayol"
            else: gender = "erkak"

            # Check existing record (full match by name and birth_date/region if available)
            existing = db.query(PatientAnalysis).filter(
                PatientAnalysis.name == full_name,
                PatientAnalysis.created_by_id == current_user.id,
                (PatientAnalysis.is_deleted == 0) | (PatientAnalysis.is_deleted == None)
            )
            if data.get("birth_date"):
                existing = existing.filter(PatientAnalysis.birth_date == str(data["birth_date"]))
            
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
            rec.address = str(data.get("address") or "").strip()
            rec.height = format_val(data.get("height"), 0.0)
            rec.weight = format_val(data.get("weight"), 0.0)
            rec.chest = format_val(data.get("chest"), 0.0)
            rec.waist = format_val(data.get("waist"), 0.0)
            rec.head = format_val(data.get("head"), 0.0)
            rec.hip = 0.0 # Mandatory in model but not in template
            rec.birth_date = format_date(data.get("birth_date"), "")
            rec.examination_date = format_date(data.get("examination_date"), datetime.now().strftime("%Y-%m-%d"))
            rec.preschool_institution = str(data.get("preschool_institution") or "")
            
            # Bio fields
            bio_fields = [
                "shoulder_length", "shoulder_breadth", "shoulder_circumference",
                "arm_elbow_length", "hand_length", "thigh_length", "thigh_circumference",
                "calf_length", "calf_circumference", "foot_length", "body_length",
                "total_body_water", "fat_percent", "fat_mass", "muscle_mass", "bone_mass", "acm", "visceral_fat"
            ]
            for bf in bio_fields:
                val = data.get(bf)
                if val is not None:
                    setattr(rec, bf, format_val(val, 0.0))

            # Trigger Calculation
            p_data = PatientData(
                firstName=data["first_name"],
                lastName=data["last_name"],
                region=rec.region,
                district=rec.district,
                address=rec.address,
                examinationDate=rec.examination_date,
                birthDate=rec.birth_date,
                preschoolInstitution=rec.preschool_institution,
                age=rec.age,
                ageMonths=rec.age_months,
                ageDays=rec.age_days,
                gender=rec.gender,
                height=rec.height,
                weight=rec.weight,
                chest=rec.chest,
                waist=rec.waist,
                head=rec.head,
                shoulderLength=rec.shoulder_length or 0,
                shoulderBreadth=rec.shoulder_breadth or 0,
                shoulderCircumference=rec.shoulder_circumference or 0,
                armElbowLength=rec.arm_elbow_length or 0,
                handLength=rec.hand_length or 0,
                thighLength=rec.thigh_length or 0,
                thighCircumference=rec.thigh_circumference or 0,
                calfLength=rec.calf_length or 0,
                calfCircumference=rec.calf_circumference or 0,
                footLength=rec.foot_length or 0,
                bodyLength=rec.body_length,
                totalBodyWater=rec.total_body_water,
                fatPercent=rec.fat_percent,
                fatMass=rec.fat_mass,
                muscleMass=rec.muscle_mass,
                boneMass=rec.bone_mass,
                acm=rec.acm,
                visceralFat=rec.visceral_fat
            )
            
            analysis = calc_full_bmi(p_data)
            advices = generate_advices(
                analysis["bmi"],
                analysis["weight_diff"],
                int(rec.age),
                rec.gender,
                bio_data=analysis["indices"]
            )
            
            rec.bmi = float(analysis["bmi"])
            rec.z_score = float(analysis["z_score"])
            rec.somatotype = str(analysis["somatotype"])
            rec.recommendations = (
                f"General: {advices.get('general', '')}; "
                f"Nutrition: {advices.get('nutrition', '')}; "
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
            add_import_error(row_idx, "row", f"Qatorni import qilishda xatolik: {str(e)}")

    try:
        db.commit()
    except Exception as commit_err:
        db.rollback()
        logger.error(f"Excel import DB commit error: {commit_err}")
        # Agar commit fail qilsa, error qaytaramiz (500 o'rniga tushunarli matn)
        raise HTTPException(status_code=500, detail=f"Ma'lumotlarni saqlashda xatolik: {commit_err}")
        
    return {
        "status": "success",
        "imported": imported_count,
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": errors
    }

# ----------------- AUDIT LOGS ------------------
from models.schemas import AuditLogOut

@router.get("/audit-logs", response_model=dict)
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    page: int = 1,
    page_size: int = 50,
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None)
):
    """Faqat Super Admin uchun: tizimdagi barcha loglarni ko'rish."""
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
        
    total = query.count()
    
    logs_db = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    
    # Map to schema with user names
    items = []
    for log in logs_db:
        item = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "user_name": log.user.name if log.user else "Mehmon"
        }
        items.append(item)
        
    return {"items": items, "total": total}

# ----------------- ADMIN ACTIVITY -----------------

@router.post("/activity/ping-form-start")
def ping_form_start(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin forma ochganini belgilash (vaqtni hisoblash uchun)."""
    current_user.last_form_open_at = datetime.utcnow()
    db.commit()
    return {"status": "ok"}

@router.get("/activity", response_model=dict)
def get_admin_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Faqat Super Admin uchun: barcha adminlar va izlanuvchilar faolligini ko'rish."""
    # Adminlar va Researcherlarni olamiz
    users = db.query(User).filter(User.role.in_(["admin", "researcher"])).all()
    
    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    month_start = datetime.combine(date.today().replace(day=1), datetime.min.time())
    
    result = []
    for u in users:
        # Status calculation
        status = "offline"
        is_typing = False
        
        if u.last_active_at:
            diff = (now - u.last_active_at).total_seconds()
            if diff < 60: # 1 minut
                status = "online"
                # Agar oxirgi faollik juda yaqin bo'lsa va forma ochiq bo'lsa
                if u.last_form_open_at:
                   is_typing = True
            elif diff < 300: # 5 minut
                status = "online"
            elif diff < 900: # 15 minut
                status = "away"
        
        # Stats based on role
        if u.role == "researcher":
            model_class = ResearchRecord
        else:
            model_class = PatientAnalysis

        stats_today = db.query(func.count(model_class.id)).filter(
            model_class.created_by_id == u.id,
            model_class.created_at >= today_start
        ).scalar() or 0
        
        stats_month = db.query(func.count(model_class.id)).filter(
            model_class.created_by_id == u.id,
            model_class.created_at >= month_start
        ).scalar() or 0
        
        # Avg time
        avg_time = 0
        if u.completed_entries_count and u.completed_entries_count > 0:
            avg_time = round(u.total_entry_time_seconds / u.completed_entries_count, 1)
            
        # Most active hour
        most_active_hour = None
        try:
            # SQLite uchun strftime ishlatamiz
            hour_query = db.query(
                func.strftime('%H', model_class.created_at).label("hour"),
                func.count(model_class.id).label("count")
            ).filter(
                model_class.created_by_id == u.id
            ).group_by("hour").order_by(desc("count")).first()
            
            if hour_query:
                most_active_hour = f"{hour_query.hour}:00"
        except:
            pass

        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "region": u.region,
            "status": status,
            "is_typing": is_typing,
            "last_active_at": u.last_active_at,
            "stats_today": stats_today,
            "stats_month": stats_month,
            "avg_entry_time": avg_time,
            "most_active_hour": most_active_hour,
            "total_entries": u.completed_entries_count or 0
        })
        
    return {"items": result}


# ----------------- AUDIT LOGS -------------------
@router.get("/audit-logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    page: int = 1,
    page_size: int = 50,
    action: Optional[str] = Query(None)
):
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    if action:
        query = query.filter(AuditLog.action == action)
        
    total = query.count()
    logs_db = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for log in logs_db:
        items.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user.name if log.user else "Noma'lum",
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        })
        
    return {"items": items, "total": total}

@router.delete("/audit-logs/clear")
def clear_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
    action: Optional[str] = Query(None)
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
        request=request
    )
    
    return {"deleted": count}

