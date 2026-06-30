from sqlalchemy import Column, DateTime, Index, Integer, String, Text, func

from .base import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(60), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default="medium", index=True)
    status = Column(String(20), nullable=False, default="new", index=True)
    email = Column(String(120), nullable=True, index=True)
    ip_address = Column(String(64), nullable=True, index=True)
    user_agent = Column(String(255), nullable=True)
    method = Column(String(12), nullable=True)
    path = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    attempts = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    read_at = Column(DateTime, nullable=True, index=True)

    __table_args__ = (
        Index("ix_security_events_status_created", "status", "created_at"),
        Index("ix_security_events_type_created", "event_type", "created_at"),
        Index("ix_security_events_ip_created", "ip_address", "created_at"),
        Index("ix_security_events_email_created", "email", "created_at"),
    )