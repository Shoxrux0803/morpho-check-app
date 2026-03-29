# morphocheck_backend/models/payment.py

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)     # to‘lov summasi
    currency = Column(String(10), default="UZS")        # valyuta: UZS, USD
    method = Column(String(30), nullable=True)          # click, payme, cash, ...
    status = Column(String(30), default="paid", index=True)         # paid, pending, failed
    description = Column(String(255), nullable=True)    # izoh
    created_at = Column(DateTime, server_default=func.now())

    # Aloqa: Payment -> User
    user = relationship("User", backref="payments")
