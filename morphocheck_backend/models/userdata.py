from sqlalchemy import Column, Integer, String, Float, Text, DateTime, func
from .base import Base

class UserAnalysis(Base):
    __tablename__ = "user_analysis"

    id = Column(Integer, primary_key=True, index=True)
    id_code = Column(String(50), nullable=True, index=True)
    name = Column(String(100), nullable=False)

    # YANGI ustunlar:
    region = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)

    examination_date = Column(String(50), nullable=True)
    birth_date = Column(String(50), nullable=True)
    preschool_institution = Column(String(255), nullable=True)

    shoulder_length = Column(Float, nullable=True)
    shoulder_breadth = Column(Float, nullable=True)
    shoulder_circumference = Column(Float, nullable=True)
    arm_elbow_length = Column(Float, nullable=True)
    hand_length = Column(Float, nullable=True)
    thigh_length = Column(Float, nullable=True)
    thigh_circumference = Column(Float, nullable=True)
    calf_length = Column(Float, nullable=True)
    calf_circumference = Column(Float, nullable=True)
    foot_length = Column(Float, nullable=True)

    age = Column(Integer, nullable=False)
    age_months = Column(Integer, nullable=True)
    age_days = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    chest  = Column(Float, nullable=False)
    waist  = Column(Float, nullable=False)
    hip    = Column(Float, nullable=False)
    head   = Column(Float, nullable=False)

    bmi         = Column(Float, nullable=False)
    z_score     = Column(Float, nullable=False)
    somatotype  = Column(String(50), nullable=False)

    # Bioimpedance Analysis
    total_body_water = Column(Float, nullable=True)
    fat_percent      = Column(Float, nullable=True)
    fat_mass         = Column(Float, nullable=True)
    muscle_mass      = Column(Float, nullable=True)
    bone_mass        = Column(Float, nullable=True)
    acm              = Column(Float, nullable=True)
    visceral_fat     = Column(Float, nullable=True)

    recommendations = Column(Text, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
