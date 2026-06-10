from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.clinical import ClinicalSetting
from models.user import User
from routers.auth_router import get_current_admin
from services.clinical_service import clinical_service
from utils.database import get_db

router = APIRouter(tags=["Clinical CMS"])


class SettingUpdate(BaseModel):
    value_json: Dict[str, Any]
    label: str = None


@router.get("/settings")
def get_clinical_settings(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    """Barcha klinik sozlamalarni qaytaradi."""
    settings = db.query(ClinicalSetting).order_by(ClinicalSetting.category).all()
    return settings


@router.get("/settings/{key}")
def get_setting_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Kalit bo'yicha bitta sozlamani qaytaradi."""
    setting = db.query(ClinicalSetting).filter(ClinicalSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Sozlama topilmadi")
    return setting


@router.put("/settings/{key}")
def update_clinical_setting(
    key: str,
    data: SettingUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Sozlamani yangilaydi (faqat Adminlar uchun)."""
    # Xavfsizlik: faqat superadmin ruxsatini qo'shish mumkin
    # if current_admin.role != "superadmin":
    #     raise HTTPException(status_code=403, detail="Ruxsat berilmagan")

    setting = db.query(ClinicalSetting).filter(ClinicalSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Sozlama topilmadi")

    setting.value_json = data.value_json
    if data.label:
        setting.label = data.label

    db.commit()
    db.refresh(setting)

    # Keshni yangilaymiz
    clinical_service.clear_cache()

    return {"message": "Sozlama muvaffaqiyatli yangilandi", "key": key}


@router.post("/refresh-cache")
def refresh_cache(current_admin: User = Depends(get_current_admin)):
    """Klinik sozlamalar keshini qo'lda yangilash."""
    clinical_service.clear_cache()
    return {"message": "Kesh tozalandi"}
