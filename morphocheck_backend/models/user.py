# morphocheck_backend/models/user.py

from sqlalchemy import Column, Integer, String, DateTime, func
from .base import Base   # shu papkadan Base ni olish uchun

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True, index=True)  # Viloyat maydoni
    phone = Column(String(50), nullable=True)
    role = Column(String(30), default="user", index=True)  # "user" yoki "admin"
    created_at = Column(DateTime, server_default=func.now())
    
    # --- Activity & Performance ---
    last_active_at = Column(DateTime, nullable=True, index=True)
    last_form_open_at = Column(DateTime, nullable=True) # Qachon forma ochganini bilish uchun
    total_entry_time_seconds = Column(Integer, default=0) # Jami sarflangan vaqt (sekundda)
    completed_entries_count = Column(Integer, default=0) # Jami kiritilgan ma'lumotlar soni (stats uchun)
