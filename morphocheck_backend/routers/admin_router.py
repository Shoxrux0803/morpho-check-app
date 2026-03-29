from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, asc, desc, cast, Date
from datetime import datetime, date, timedelta
from typing import Optional, List
import os
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


from utils.database import get_db
from models.user import User
from models.payment import Payment 
from models.userdata import PatientAnalysis
from routers.auth_router import get_current_admin, get_current_superadmin
from models.schemas import (
    UserCreate, UserUpdate, UserOut,
    PaymentCreate, PaymentOut
)
from routers.analyze_router import calculate_bmi as calc_full_bmi, PatientData
from utils.translit import lat2cyr
from utils.security import get_password_hash

# Router prefiksiz: main.py da /api/admin bilan ulangan bo'ladi
router = APIRouter(tags=["Admin"])

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
    if hasattr(row, "created_by") and row.created_by:
        payload["created_by_name"] = row.created_by.name
    else:
        payload["created_by_name"] = "Noma'lum"
        
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

@router.post("/users", response_model=UserOut, dependencies=[Depends(get_current_superadmin)])
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
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
            
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/users/{user_id}", response_model=UserOut, dependencies=[Depends(get_current_superadmin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

@router.put("/users/{user_id}", response_model=UserOut, dependencies=[Depends(get_current_superadmin)])
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    
    # Check if new email conflicts with other users
    if "email" in update_data and update_data["email"] != user.email:
        existing_user = db.query(User).filter(User.email == update_data["email"]).first()
        if existing_user:
            raise HTTPException(400, "Ushbu email allaqachon boshqa foydalanuvchi tomonidan band etilgan.")

    # Maxsus holat: UserUpdate sxemasida password bo'lmasligi mumkin, 
    # lekin agar biz schemas.py ni yangilagan bo'lsak, password kelishi mumkin.
    # UserUpdate sxemasini ham tekshirib ko'ramiz.
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            user.hashed_password = get_password_hash(password)

    for k, v in update_data.items():
        setattr(user, k, v)
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", dependencies=[Depends(get_current_superadmin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
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
):
    base = db.query(PatientAnalysis)

    # Ownership Filter: Regular admin or others only see their own data
    if current_user.role != "superadmin":
        base = base.filter(PatientAnalysis.created_by_id == current_user.id)

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
        base = base.filter(cast(PatientAnalysis.created_at, Date) >= date_from)
    if date_to:
        base = base.filter(cast(PatientAnalysis.created_at, Date) <= date_to)
    if region:
        base = base.filter(PatientAnalysis.region == region)

    # Jami (filtrlargacha emas, filtrlardan keyin!)
    total = base.with_entities(func.count(PatientAnalysis.id)).scalar() or 0

    # Sort
    sort_map = {
        "created_at": getattr(PatientAnalysis, "created_at", None),
        "name": getattr(PatientAnalysis, "name", None),
        "gender": getattr(PatientAnalysis, "gender", None),
        "age": getattr(PatientAnalysis, "age", None),
        "height": getattr(PatientAnalysis, "height", None),
        "weight": getattr(PatientAnalysis, "weight", None),
        "bmi": getattr(PatientAnalysis, "bmi", None),
        # Front so'rashi mumkin bo'lgan alias:
        "last_name": getattr(PatientAnalysis, "name", None),  # name orqali
    }
    col = sort_map.get(sort_key) or getattr(PatientAnalysis, "created_at", None)
    if col is not None:
        base = base.order_by(asc(col) if sort_dir == "asc" else desc(col))

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if not payload.ids:
        return {"deleted": 0}
    try:
        q = db.query(PatientAnalysis).filter(PatientAnalysis.id.in_(payload.ids))
        
        # Ownership Check for non-superadmins
        if current_user.role != "superadmin":
            q = q.filter(PatientAnalysis.created_by_id == current_user.id)
            
        deleted = q.delete(synchronize_session=False)
        db.commit()
        return {"deleted": int(deleted or 0)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

@router.put("/analyses/{analysis_id}")
def update_analysis(
    analysis_id: int, 
    payload: dict, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    rec = db.get(PatientAnalysis, analysis_id)
    if not rec:
        raise HTTPException(404, "Analysis not found")
        
    # Ownership Check
    if current_user.role != "superadmin" and rec.created_by_id != current_user.id:
        raise HTTPException(403, "Ushbu ma'lumotni o'zgartirishga huquqingiz yo'q")
        
    # Faqat mavjud atributlarni yangilaymiz
    for k, v in payload.items():
        if hasattr(rec, k):
            setattr(rec, k, v)
    db.commit()
    db.refresh(rec)
    return to_dict_analysis(rec)

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
    current_user: User = Depends(get_current_admin)
):
    # Base count of users (only for superadmin?)
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    # Filter analyses stats by ownership
    analysis_q = db.query(PatientAnalysis)
    if current_user.role != "superadmin":
        analysis_q = analysis_q.filter(PatientAnalysis.created_by_id == current_user.id)
        
    total_analyses = analysis_q.with_entities(func.count(PatientAnalysis.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
    
    # Growth last 30 days
    last_month_start = datetime.utcnow() - timedelta(days=30)
    monthly_analyses = analysis_q.filter(PatientAnalysis.created_at >= last_month_start).count()
    
    # Gender Distribution
    gender_counts = (
        analysis_q.with_entities(PatientAnalysis.gender, func.count(PatientAnalysis.id))
        .group_by(PatientAnalysis.gender)
        .all()
    )
    gender_map = {g.lower() if g else "noma'lum": int(c) for g, c in gender_counts}

    # Somatotype Distribution
    somatotype_counts = (
        analysis_q.with_entities(PatientAnalysis.somatotype, func.count(PatientAnalysis.id))
        .group_by(PatientAnalysis.somatotype)
        .all()
    )
    somatotype_map = {s or "Noma'lum": int(c) for s, c in somatotype_counts}

    # Age Groups
    # 0-6 (Maktabgacha), 7-12 (Boshlang'ich), 13-18 (O'smir), 18+ (Katta)
    age_groups = [
        {"name": "0-6", "value": analysis_q.filter(PatientAnalysis.age <= 6).count()},
        {"name": "7-12", "value": analysis_q.filter(PatientAnalysis.age > 6, PatientAnalysis.age <= 12).count()},
        {"name": "13-18", "value": analysis_q.filter(PatientAnalysis.age > 12, PatientAnalysis.age <= 18).count()},
        {"name": "18+", "value": analysis_q.filter(PatientAnalysis.age > 18).count()},
    ]

    # Regional Distribution
    regional_counts = (
        analysis_q.with_entities(PatientAnalysis.region, func.count(PatientAnalysis.id))
        .group_by(PatientAnalysis.region)
        .all()
    )
    regional_data = [{"region": r or "Noma'lum", "count": int(c)} for r, c in regional_counts]

    # Monthly Trend (Last 12 months)
    # Using strftime for SQLite, fallback to simple date for others if needed
    try:
        trend_counts = (
            analysis_q.with_entities(
                func.strftime('%Y-%m', PatientAnalysis.created_at).label("month"),
                func.count(PatientAnalysis.id)
            )
            .group_by("month")
            .order_by("month")
            .all()
        )
        monthly_trend = [{"month": m, "count": int(c)} for m, c in trend_counts][-12:]
    except:
        # Fallback if strftime fails (e.g. Postgres)
        monthly_trend = []

    return {
        "total_users": int(total_users),
        "total_analyses": int(total_analyses),
        "total_revenue": float(total_revenue),
        "monthly_growth": int(monthly_analyses),
        "by_gender": gender_map,
        "by_somatotype": somatotype_map,
        "by_age_group": age_groups,
        "by_region": regional_data,
        "monthly_trend": monthly_trend,
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
        base = base.filter(cast(PatientAnalysis.created_at, Date) >= date_from)
    if date_to:
        base = base.filter(cast(PatientAnalysis.created_at, Date) <= date_to)
    if region:
        base = base.filter(PatientAnalysis.region == region)

    rows_db = base.order_by(PatientAnalysis.created_at.desc()).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Analyses"

    # Sarlavhalar (To'liq o'zbekcha kirill yozuvida, texnik qismlar lotinda)
    headers = [
        "Сана", "ID код", "Ф.И.Ш.", "Жинс", "Ёш", "Вилоят", "Туман", "Манзил",
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
            analysis = calc_full_bmi(p_data)
        except:
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
