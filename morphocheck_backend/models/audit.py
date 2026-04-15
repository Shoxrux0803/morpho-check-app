# morphocheck_backend/models/audit.py
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)  # LOGIN, CREATE, UPDATE, DELETE, RESTORE
    target_type = Column(String(50), nullable=True, index=True)  # User, PatientAnalysis, Payment
    target_id = Column(Integer, nullable=True, index=True)
    details = Column(Text, nullable=True)  # Short summary of changes
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    user = relationship("User", foreign_keys=[user_id])
