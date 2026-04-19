from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
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

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_please_change_in_prod")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(tags=["Researcher"])


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
    return (
        db.query(ResearchRecord)
        .filter(ResearchRecord.is_deleted == 1)
        .order_by(ResearchRecord.deleted_at.desc())
        .all()
    )


@router.get("/export/xlsx")
def export_research_xlsx(
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """XLSX Export"""
    query = db.query(ResearchRecord).filter(ResearchRecord.is_deleted == 0)
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    records = query.all()
    data_list = [
        {c.name: getattr(r, c.name) for c in r.__table__.columns}
        for r in records
    ]

    if not data_list:
        raise HTTPException(status_code=404, detail="Ma'lumotlar mavjud emas")

    df = pd.DataFrame(data_list)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Research Data")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=research_data.xlsx"}
    )


# ═══════════════════════════════════════════════
#  LIST  (superadmin hammani, researcher o'zini)
# ═══════════════════════════════════════════════
@router.get("/", response_model=List[ResearchRecordOut])
def list_research_records(
    search: Optional[str] = Query(None),
    researcher_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    query = db.query(ResearchRecord).filter(ResearchRecord.is_deleted == 0)

    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.full_name.ilike(like) |
            ResearchRecord.school_name.ilike(like) |
            ResearchRecord.settlement.ilike(like)
        )

    if date_from:
        query = query.filter(ResearchRecord.examination_date >= date_from)
    if date_to:
        query = query.filter(ResearchRecord.examination_date <= date_to)

    return query.order_by(ResearchRecord.id.desc()).all()


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
