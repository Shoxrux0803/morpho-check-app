from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
from models.user import User
from models.userdata import ResearchRecord
from models.schemas import ResearchRecordCreate, ResearchRecordOut
from utils.database import get_db
from routers.auth_router import get_current_user
from services.research_docx import generate_researcher_docx
import pandas as pd
import io
import urllib.parse
from jose import JWTError, jwt
import os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from utils.translit import lat2cyr

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_please_change_in_prod")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(tags=["Researcher"])


def research_record_to_dict(record: ResearchRecord) -> dict:
    payload = {
        column.name: getattr(record, column.name)
        for column in ResearchRecord.__table__.columns
    }
    payload["deleted_by_name"] = (
        record.deleted_by.name
        if getattr(record, "deleted_by", None)
        else None
    )
    return payload


def get_current_researcher_or_superadmin(
    request: Request,
    accessToken: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # 1. Tokenni aniqlash (Header yoki Query Param)
    token = accessToken
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 2. JWT Decode
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # 3. Userni topish
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # 4. Roli bo'yicha tekshirish
    if user.role not in ["researcher", "superadmin"]:
        raise HTTPException(status_code=403, detail="Sizda ushbu amalni bajarish uchun ruxsat yo'q.")
    
    # Update activity
    user.last_active_at = datetime.utcnow()
    try:
        db.commit()
    except:
        db.rollback()

    return user


# ═══════════════════════════════════════════════
#  STATIC PATHS — MUST BE BEFORE /{record_id}
# ═══════════════════════════════════════════════

@router.get("/deleted/list", response_model=List[ResearchRecordOut])
def list_deleted_research(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """O'chirilgan yozuvlar ro'yxati — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    records = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.deleted_by))
        .filter(ResearchRecord.is_deleted == 1)
        .order_by(ResearchRecord.deleted_at.desc())
        .all()
    )
    return [research_record_to_dict(record) for record in records]


@router.get("/export/xlsx")
def export_research_xlsx(
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """XLSX Export - Advanced version with styling and Cyrillic headers"""
    query = db.query(ResearchRecord).filter(ResearchRecord.is_deleted == 0)
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    records = query.all()
    if not records:
        raise HTTPException(status_code=404, detail="Ma'lumotlar mavjud emas")

    wb = Workbook()
    ws = wb.active
    ws.title = "Research Data"

    # 1. Заголовки (Кириллица)
    headers_map = [
        ("Сана", "created_at"),
        ("ID", "id"),
        ("Ф.И.Ш.", "full_name"),
        ("Мактаб/Муассаса", "school_name"),
        ("Аҳоли пункти", "settlement"),
        ("Туғилган жойи", "birth_place"),
        ("Туғилган санаси", "birth_date"),
        ("Отасининг миллати", "father_nationality"),
        ("Онасининг миллати", "mother_nationality"),
        ("Қачондан бери яшайди", "living_since"),
        ("Рўйхатга олинган сана", "enrolled_date"),
        ("Яшаш шароити", "living_conditions"),
        ("Меҳнат режими", "labor_regime"),
        ("Ўтказилган касалликлар", "past_illnesses"),
        ("Болалар сони", "children_count"),
        ("Бола нечанчи", "child_order"),
        ("Озиқланиш тури", "feeding_type"),
        ("Ота-она никоҳи", "parents_marriage"),
        ("Она соғлиғи", "mother_health_status"),
        ("Текширув санаси", "examination_date"),
        ("Отасининг бўйи (см)", "father_height"),
        ("Онасининг бўйи (см)", "mother_height"),
        
        # I Показатели физического развития
        ("Олд юқори ёнбош ўсимтасидан (см)", "lower_leg_spina_iliaca"),
        ("Қовуқ устидан (см)", "lower_leg_symphysion"),
        ("Болдир баландлиги (см)", "tibiale_height"),
        ("Чанноқ кенглиги (см)", "pelvic_width"),
        ("Сон узунлиги (см)", "thigh_length"),
        ("Сон айланаси (см)", "thigh_circumference"),
        ("Болдир узунлиги (см)", "calf_length"),
        ("Болдир айланаси (см)", "calf_circumference"),
        ("Оёқ кафти узунлиги (см)", "foot_length"),
        ("Тишлар сони", "teeth_count"),
        ("Ҳайз бошланиши", "menstruation_start"),

        # II Определение формы черепа
        ("Бош суяги бўйлама (см)", "skull_longitudinal"),
        ("Бош суяги кўндаланг (см)", "skull_transverse"),
        ("Бош айланаси (см)", "head_circumference"),
        ("Пешона кўндаланг (см)", "forehead_transverse"),
        ("Бош суяги баландлиги (см)", "skull_height"),
        ("Бош суяги асоси узунлиги (см)", "skull_base_length"),
        ("Бош суяги асоси кенглиги (см)", "skull_base_width"),

        # Лицо
        ("Юз кенглиги (cm)", "face_bizygomatic"),
        ("Пастки жағ кенглиги (cm)", "face_bigonial"),
        ("Юз морфологик баландлиги (cm)", "face_morphological_height"),
        ("Юз физиогномик баландлиги (cm)", "face_physiognomic_height"),
        ("Бурун баландлиги (cm)", "nose_height"),
        ("Бурун кенглиги (cm)", "nose_width"),
        ("Кўз ташқи бурчаклари (cm)", "outer_canthal_width"),
        ("Кўз ички бурчаклари (cm)", "inner_canthal_width"),
        ("Лаблар шиллиқ қавати (cm)", "lips_mucosa_height"),
        ("Оғиз кенглиги (cm)", "mouth_width"),

        # Грудь
        ("Бўйи (тик) (см)", "chest_standing_height"),
        ("Бўйи (ўтирган) (см)", "chest_sitting_height"),
        ("Вазн (кг)", "weight"),
        ("Гавда узунлиги (см)", "trunk_length"),
        ("Тана узунлиги (см)", "torso_length"),
        ("Кўкрак айланаси (пауза) (см)", "chest_circumference_pause"),
        ("Кўкрак айланаси (нафас) (см)", "chest_circumference_inhale"),
        ("Кўкрак айланаси (чиқариш) (см)", "chest_circumference_exhale"),
        ("Бел айланаси (см)", "waist_circumference"),
        ("Қорин айланаси (см)", "abdomen_circumference"),
        ("Юқори сегмент узунлиги (см)", "upper_segment_length"),
        ("Кўкрак кўндаланг (см)", "chest_transverse_diameter"),
        ("Кўкрак олд-орқа (см)", "chest_anteroposterior_diameter"),
        ("Кўкрак баландлиги (см)", "chest_height"),

        # Верхняя конечность
        ("Қўл узунлиги (см)", "arm_length"),
        ("Елка узунлиги (см)", "shoulder_length"),
        ("Елка кенглиги (см)", "shoulder_width"),
        ("Елка айланаси (тинч) (см)", "shoulder_circumference_rest"),
        ("Елка айланаси (букилган) (см)", "shoulder_circumference_flexed"),
        ("Билак узунлиги (см)", "forearm_length"),
        ("Қўл кафти узунлиги (см)", "hand_length"),
        ("Динамометрия (кг)", "dynamometry"),

        # Толщина подкожно-жировой клетчатки
        ("Трицепс ёғ (мм)", "fat_triceps"),
        ("Бицепс ёғ (мм)", "fat_biceps"),
        ("Курак ости ёғ (мм)", "fat_subscapular"),
        ("Ёнбош ёғ (мм)", "fat_iliac"),
        ("Тизза ости ёғ (мм)", "fat_popliteal"),
    ]

    # Style definitions
    header_fill = PatternFill(start_color="3498DB", end_color="3498DB", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    zebra_fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
    border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
    center_align = Alignment(horizontal='center', vertical='center')
    left_align = Alignment(horizontal='left', vertical='center')

    # Writing headers
    for col_num, (header_text, _) in enumerate(headers_map, 1):
        cell = ws.cell(row=1, column=col_num, value=header_text)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = border

    # Writing data
    for row_num, record in enumerate(records, 2):
        for col_num, (_, field_name) in enumerate(headers_map, 1):
            val = getattr(record, field_name)
            
            # Special formatting
            if field_name == "created_at":
                display_val = val.strftime("%Y-%m-%d %H:%M") if val else "-"
            elif field_name == "id":
                display_val = val # ID o'zgarmasin
            elif isinstance(val, str):
                display_val = lat2cyr(val) if val else "-"
            elif val is None:
                display_val = "-"
            else:
                display_val = val
            
            cell = ws.cell(row=row_num, column=col_num, value=display_val)
            cell.alignment = left_align
            cell.border = border
            
            # Zebra rows
            if row_num % 2 == 0:
                cell.fill = zebra_fill

    # Auto-width
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        ws.column_dimensions[column].width = min(50, max_length + 2)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    
    filename = f"research_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ═══════════════════════════════════════════════
#  LIST  (superadmin hammani, researcher o'zini)
# ═══════════════════════════════════════════════
@router.get("/", response_model=List[ResearchRecordOut])
def list_research_records(
    search: Optional[str] = Query(None),
    full_name: Optional[str] = Query(None),
    school_name: Optional[str] = Query(None),
    settlement: Optional[str] = Query(None),
    feeding_type: Optional[str] = Query(None),
    parents_marriage: Optional[str] = Query(None),
    weight_min: Optional[float] = Query(None),
    weight_max: Optional[float] = Query(None),
    height_min: Optional[float] = Query(None),
    height_max: Optional[float] = Query(None),
    researcher_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    query = db.query(ResearchRecord).filter(ResearchRecord.is_deleted == 0)

    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    # Generic search
    if search:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.full_name.ilike(like) |
            ResearchRecord.school_name.ilike(like) |
            ResearchRecord.settlement.ilike(like)
        )
    
    # Specific demographic filters
    if full_name:
        query = query.filter(ResearchRecord.full_name.ilike(f"%{full_name}%"))
    if school_name:
        query = query.filter(ResearchRecord.school_name.ilike(f"%{school_name}%"))
    if settlement:
        s = settlement.strip()
        query = query.filter(
            (ResearchRecord.settlement.ilike(f"%{s}%")) |
            (ResearchRecord.birth_place.ilike(f"%{s}%"))
        )
    if feeding_type:
        query = query.filter(ResearchRecord.feeding_type == feeding_type)
    if parents_marriage:
        query = query.filter(ResearchRecord.parents_marriage == parents_marriage)
    
    # Biometric filters
    if weight_min is not None:
        query = query.filter(ResearchRecord.weight >= weight_min)
    if weight_max is not None:
        query = query.filter(ResearchRecord.weight <= weight_max)
    if height_min is not None:
        query = query.filter(ResearchRecord.chest_standing_height >= height_min)
    if height_max is not None:
        query = query.filter(ResearchRecord.chest_standing_height <= height_max)

    # Date filters
    if date_from:
        query = query.filter(ResearchRecord.examination_date >= date_from)
    if date_to:
        query = query.filter(ResearchRecord.examination_date <= date_to)

    if gender:
        query = query.filter(ResearchRecord.gender == gender)

    records = query.order_by(ResearchRecord.id.desc()).all()

    # Age filter (in Python for accuracy)
    if age_min is not None or age_max is not None:
        filtered = []
        for r in records:
            try:
                if not r.birth_date: continue
                b_date = datetime.strptime(r.birth_date, "%Y-%m-%d")
                e_date_str = r.examination_date if r.examination_date else datetime.now().strftime("%Y-%m-%d")
                e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
                age = (e_date - b_date).days / 365.25
                if age_min is not None and age < age_min: continue
                if age_max is not None and age > age_max: continue
                filtered.append(r)
            except Exception as e:
                print(f"Age filter error for record {r.id}: {e}")
                continue
                # If date format is invalid, include in list only if no age filter applied
                if age_min is None and age_max is None:
                    filtered.append(r)
        return filtered

    return records


@router.get("/export/dataset")
def export_dataset_for_analysis(
    gender: Optional[str] = Query(None),
    age_min: Optional[float] = Query(None),
    age_max: Optional[float] = Query(None),
    settlement: Optional[str] = Query(None),
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """
    Advanced export for statistical analysis (SPSS/Python).
    - Numeric encoding for categorical variables.
    - Machine-readable headers.
    - Age calculation.
    """
    query = db.query(ResearchRecord).filter(ResearchRecord.is_deleted == 0)
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)
    
    if settlement:
        s = settlement.strip()
        query = query.filter(
            (ResearchRecord.settlement.ilike(f"%{s}%")) |
            (ResearchRecord.birth_place.ilike(f"%{s}%"))
        )
    if gender:
        query = query.filter(ResearchRecord.gender == gender)
    
    records = query.all()

    # Filtered and Processed Data
    dataset = []
    for r in records:
        try:
            b_date = datetime.strptime(r.birth_date, "%Y-%m-%d")
            # Examination date string to date
            e_date_str = r.examination_date or datetime.now().strftime("%Y-%m-%d")
            e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
            age = round((e_date - b_date).days / 365.25, 2)
        except:
            age = None
        
        if age_min is not None and (age is None or age < age_min): continue
        if age_max is not None and (age is None or age > age_max): continue

        # Encoding categories
        # Gender: 0=Boy, 1=Girl
        gender_code = 0 if r.gender == "Boy" else 1
        if not r.gender: gender_code = -1
        
        # Feeding: 0=Natural, 1=Artificial
        feeding_code = 0 if "Tabiiy" in (r.feeding_type or "") else 1
        
        # Marriage: 0=Non-relative, 1=Distant, 2=Close
        marriage_code = 2 if "Yaqin" in (r.parents_marriage or "") else 1 if "Uzoq" in (r.parents_marriage or "") else 0

        dataset.append({
            "id": r.id,
            "full_name": r.full_name,
            "age_years": age,
            "gender": r.gender,
            "gender_code": gender_code,
            "settlement": r.settlement,
            "school": r.school_name,
            "weight": r.weight,
            "height": r.chest_standing_height,
            "bmi": round(r.weight / ((r.chest_standing_height/100)**2), 2) if r.weight and r.chest_standing_height else None,
            "feeding_code": feeding_code,
            "marriage_code": marriage_code,
            "head_circ": r.head_circumference,
            "waist_circ": r.waist_circumference,
            "chest_circ": r.chest_circumference_pause,
            "father_height": r.father_height,
            "mother_height": r.mother_height,
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else None
        })

    if not dataset:
        raise HTTPException(status_code=404, detail="Filterga mos ma'lumotlar topilmadi")

    df = pd.DataFrame(dataset)
    
    # Save to Excel
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine='openpyxl')
    buf.seek(0)

    filename = f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



# ═══════════════════════════════════════════════
#  CREATE
# ═══════════════════════════════════════════════
@router.post("/", response_model=ResearchRecordOut)
def create_research_record(
    payload: ResearchRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    record = ResearchRecord(**payload.model_dump(exclude_unset=True))
    record.created_by_id = current_user.id
    db.add(record)
    
    # Update user stats
    current_user.completed_entries_count = (current_user.completed_entries_count or 0) + 1
    
    db.commit()
    db.refresh(record)
    return record


# ═══════════════════════════════════════════════
#  DYNAMIC PATHS — AFTER STATIC PATHS
# ═══════════════════════════════════════════════

@router.get("/{record_id}", response_model=ResearchRecordOut)
def get_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")
    return record


@router.put("/{record_id}", response_model=ResearchRecordOut)
def update_research_record(
    record_id: int,
    payload: ResearchRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """Soft delete"""
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    record.is_deleted = 1
    record.deleted_by_id = current_user.id
    record.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "ok", "message": "Soft o'chirildi"}


@router.delete("/{record_id}/hard")
def hard_delete_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hard delete — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    record = db.get(ResearchRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    db.delete(record)
    db.commit()
    return {"status": "ok", "message": "Bazadan butunlay o'chirildi"}


@router.post("/{record_id}/restore")
def restore_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restore soft-deleted record — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    record = db.get(ResearchRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    record.is_deleted = 0
    record.deleted_by_id = None
    record.deleted_at = None
    db.commit()
    return {"status": "ok", "message": "Tiklandi"}


@router.get("/{record_id}/docx")
def download_research_docx(
    record_id: int,
    lang: str = Query("ru"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """DOCX hisobot yuklab olish"""
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    data = {c.name: getattr(record, c.name) for c in record.__table__.columns}
    buf = generate_researcher_docx(data, lang=lang)
    encoded_filename = urllib.parse.quote(f"Research_{record.id}_{lang}.docx")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )
