from sqlalchemy import Boolean, Column, DateTime, String, func

from .base import Base


class RoleSettings(Base):
    __tablename__ = "role_settings"

    role_name = Column(String(50), primary_key=True, index=True)
    ai_chat_enabled = Column(Boolean, default=True)
    internal_chat_enabled = Column(Boolean, default=True)
    child_data_privacy_enabled = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
