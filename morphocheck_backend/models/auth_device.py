from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)

from .base import Base


class TrustedLoginDevice(Base):
    __tablename__ = "trusted_login_devices"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    device_id_hash = Column(String(64), nullable=False, index=True)
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    last_used_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "user_id", "device_id_hash", name="uq_trusted_device_user_hash"
        ),
    )


class LoginVerificationCode(Base):
    __tablename__ = "login_verification_codes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    device_id_hash = Column(String(64), nullable=False, index=True)
    code_hash = Column(String(255), nullable=False)
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
