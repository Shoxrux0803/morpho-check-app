from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from models.base import Base


class BlockedIP(Base):
    __tablename__ = "blocked_ips"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(64), unique=True, index=True, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
