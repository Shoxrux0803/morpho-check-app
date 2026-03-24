# morphocheck_backend/models/rating.py
from sqlalchemy import Column, Integer, String, Text
from models.base import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    score = Column(Integer, nullable=False)      # 1–5 oralig‘ida
    comment = Column(Text, nullable=True)
    name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
