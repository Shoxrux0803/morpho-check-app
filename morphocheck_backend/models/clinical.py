from sqlalchemy import Column, Integer, String, Text, DateTime, func, JSON
from .base import Base

class ClinicalSetting(Base):
    """
    Klinik sozlamalar modeli. 
    Kategoriyalar: 'bmi_categories', 'advice', 'standards', 'keywords'
    Value: JSON formatida (tarjimalar va parametrlar bilan)
    """
    __tablename__ = "clinical_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    label = Column(String(255), nullable=True) # UI uchun qisqa izoh
    value_json = Column(JSON, nullable=False)
    
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ClinicalSetting(key='{self.key}', category='{self.category}')>"
