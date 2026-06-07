# morphocheck_backend/models/user.py

from sqlalchemy import Column, Float, Integer, String, DateTime, func, Index
from .base import Base   # shu papkadan Base ni olish uchun

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True, index=True)  # Viloyat maydoni
    district = Column(String(100), nullable=True, index=True)
    mahalla = Column(String(150), nullable=True, index=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String(50), nullable=True)
    research_topic = Column(String(500), nullable=True)
    research_type = Column(String(100), nullable=True)
    research_area = Column(String(255), nullable=True)
    scientific_supervisor = Column(String(200), nullable=True)
    role = Column(String(30), default="user", index=True)  # "user" yoki "admin"
    created_at = Column(DateTime, server_default=func.now())
    
    # --- Activity & Performance ---
    last_active_at = Column(DateTime, nullable=True, index=True)
    last_form_open_at = Column(DateTime, nullable=True) # Qachon forma ochganini bilish uchun
    total_entry_time_seconds = Column(Integer, default=0) # Jami sarflangan vaqt (sekundda)
    completed_entries_count = Column(Integer, default=0) # Jami kiritilgan ma'lumotlar soni (stats uchun)

    # --- Soft Delete ---
    is_deleted = Column(Integer, default=0, index=True) # 0=Active, 1=Deleted
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, nullable=True)

    __table_args__ = (
        Index("ix_users_role_active", "role", "is_deleted"),
        Index("ix_users_deleted_deleted_at", "is_deleted", "deleted_at"),
    )
