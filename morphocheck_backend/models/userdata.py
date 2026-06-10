from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from .base import Base


class PatientAnalysis(Base):
    __tablename__ = "patient_analysis"

    id = Column(Integer, primary_key=True)
    id_code = Column(String(50), nullable=True, index=True)
    name = Column(String(100), nullable=False, index=True)

    region = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)
    mahalla = Column(String(150), nullable=True, index=True)
    address = Column(String(255), nullable=True)

    examination_date = Column(String(50), nullable=True, index=True)
    birth_date = Column(String(50), nullable=True)
    preschool_institution = Column(String(255), nullable=True)

    gender = Column(String(10), nullable=False, index=True)  # erkak / ayol
    age = Column(Integer, nullable=False, index=True)
    age_months = Column(Integer, nullable=True)
    age_days = Column(Integer, nullable=True)

    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    chest = Column(Float, nullable=False)
    waist = Column(Float, nullable=False)
    hip = Column(Float, nullable=False)
    head = Column(Float, nullable=False)

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
    body_length = Column(Float, nullable=True)

    father_height = Column(Float, nullable=True)
    mother_height = Column(Float, nullable=True)
    parents_phone = Column(String(50), nullable=True)

    bmi = Column(Float, nullable=False)
    z_score = Column(Float, nullable=False)
    somatotype = Column(String(50), nullable=False)

    # Bioimpedance Analysis
    total_body_water = Column(Float, nullable=True)
    fat_percent = Column(Float, nullable=True)
    fat_mass = Column(Float, nullable=True)
    muscle_mass = Column(Float, nullable=True)
    bone_mass = Column(Float, nullable=True)
    acm = Column(Float, nullable=True)
    visceral_fat = Column(Float, nullable=True)

    recommendations = Column(Text, nullable=False)
    ai_recommendations = Column(Text, nullable=True)
    doctor_note = Column(Text, nullable=True)

    consent_confirmed = Column(Integer, default=0, nullable=False, index=True)
    consent_guardian_name = Column(String(255), nullable=True)
    consent_guardian_relationship = Column(String(100), nullable=True)
    consent_guardian_phone = Column(String(50), nullable=True)
    consent_confirmed_at = Column(DateTime, nullable=True)
    consent_policy_version = Column(String(50), nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_by = relationship("User", foreign_keys=[created_by_id])

    created_at = Column(DateTime, server_default=func.now(), index=True)

    # Soft Delete maydonlari
    is_deleted = Column(Integer, default=0, nullable=False, index=True)  # 0=yo'q, 1=ha
    deleted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])

    __table_args__ = (
        Index("ix_patient_analysis_deleted_created", "is_deleted", "created_at"),
        Index(
            "ix_patient_analysis_owner_active_created",
            "created_by_id",
            "is_deleted",
            "created_at",
        ),
        Index("ix_patient_analysis_deleted_deleted_at", "is_deleted", "deleted_at"),
        Index(
            "ix_patient_analysis_region_active_created",
            "region",
            "is_deleted",
            "created_at",
        ),
        Index("ix_patient_analysis_gender_age_active", "gender", "age", "is_deleted"),
        Index(
            "ix_patient_analysis_child_history",
            "name",
            "birth_date",
            "gender",
            "is_deleted",
            "created_at",
        ),
    )


class ResearchRecord(Base):
    __tablename__ = "research_records"

    id = Column(Integer, primary_key=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_by = relationship("User", foreign_keys=[created_by_id])
    created_at = Column(DateTime, server_default=func.now(), index=True)

    # Demographics
    full_name = Column(String(255), nullable=True, index=True)
    school_name = Column(String(255), nullable=True, index=True)
    settlement = Column(String(255), nullable=True, index=True)
    birth_place = Column(String(255), nullable=True)
    birth_date = Column(String(50), nullable=True, index=True)  # Yil, oy, kun
    gender = Column(String(20), nullable=True, index=True)  # Boy / Girl or Erkak / Ayol
    father_nationality = Column(String(100), nullable=True)
    mother_nationality = Column(String(100), nullable=True)
    living_since = Column(String(100), nullable=True)
    enrolled_date = Column(String(100), nullable=True)
    living_conditions = Column(String(255), nullable=True)
    labor_regime = Column(String(255), nullable=True)
    past_illnesses = Column(String(255), nullable=True)
    children_count = Column(Integer, nullable=True)
    child_order = Column(Integer, nullable=True)
    feeding_type = Column(String(100), nullable=True)
    parents_marriage = Column(String(100), nullable=True)
    mother_health_status = Column(String(255), nullable=True)
    parents_phone = Column(String(50), nullable=True)

    consent_confirmed = Column(Integer, default=0, nullable=False, index=True)
    consent_guardian_name = Column(String(255), nullable=True)
    consent_guardian_relationship = Column(String(100), nullable=True)
    consent_guardian_phone = Column(String(50), nullable=True)
    consent_confirmed_at = Column(DateTime, nullable=True)
    consent_policy_version = Column(String(50), nullable=True)

    # Date of examination
    examination_date = Column(String(50), nullable=True, index=True)

    # I Показатели физического развития
    lower_leg_total = Column(Float, nullable=True)
    lower_leg_spina_iliaca = Column(Float, nullable=True)
    lower_leg_symphysion = Column(Float, nullable=True)
    lower_leg_length = Column(Float, nullable=True)
    tibiale_height = Column(Float, nullable=True)
    pelvic_width = Column(Float, nullable=True)
    thigh_length = Column(Float, nullable=True)
    thigh_circumference = Column(Float, nullable=True)
    calf_length = Column(Float, nullable=True)
    calf_circumference = Column(Float, nullable=True)
    foot_length = Column(Float, nullable=True)
    teeth_count = Column(Integer, nullable=True)
    menstruation_start = Column(String(50), nullable=True)

    # II Определение формы черепа
    skull_longitudinal = Column(Float, nullable=True)
    skull_transverse = Column(Float, nullable=True)
    head_circumference = Column(Float, nullable=True)
    forehead_transverse = Column(Float, nullable=True)
    skull_height = Column(Float, nullable=True)

    # Определения размера основания черепа
    skull_base_length = Column(Float, nullable=True)
    skull_base_width = Column(Float, nullable=True)

    # Лицо
    face_bizygomatic = Column(Float, nullable=True)
    face_bigonial = Column(Float, nullable=True)
    face_morphological_height = Column(Float, nullable=True)
    face_physiognomic_height = Column(Float, nullable=True)
    nose_height = Column(Float, nullable=True)
    nose_width = Column(Float, nullable=True)
    outer_canthal_width = Column(Float, nullable=True)
    inner_canthal_width = Column(Float, nullable=True)
    lips_mucosa_height = Column(Float, nullable=True)
    mouth_width = Column(Float, nullable=True)

    # Грудь
    chest_standing_height = Column(Float, nullable=True)
    chest_sitting_height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    trunk_length = Column(Float, nullable=True)
    torso_length = Column(Float, nullable=True)
    chest_circumference_pause = Column(Float, nullable=True)
    chest_circumference_inhale = Column(Float, nullable=True)
    chest_circumference_exhale = Column(Float, nullable=True)
    waist_circumference = Column(Float, nullable=True)
    abdomen_circumference = Column(Float, nullable=True)
    upper_segment_length = Column(Float, nullable=True)
    chest_transverse_diameter = Column(Float, nullable=True)
    chest_anteroposterior_diameter = Column(Float, nullable=True)
    chest_height = Column(Float, nullable=True)

    # Верхняя конечность
    arm_length = Column(Float, nullable=True)
    shoulder_length = Column(Float, nullable=True)
    shoulder_width = Column(Float, nullable=True)
    arm_circumference_total = Column(Float, nullable=True)
    shoulder_circumference_rest = Column(Float, nullable=True)
    shoulder_circumference_flexed = Column(Float, nullable=True)
    forearm_length = Column(Float, nullable=True)
    hand_length = Column(Float, nullable=True)
    dynamometry = Column(Float, nullable=True)

    # Толщина подкожно-жировой клетчатки
    fat_triceps = Column(Float, nullable=True)
    fat_biceps = Column(Float, nullable=True)
    fat_subscapular = Column(Float, nullable=True)
    fat_iliac = Column(Float, nullable=True)
    fat_popliteal = Column(Float, nullable=True)

    father_height = Column(Float, nullable=True)
    mother_height = Column(Float, nullable=True)

    # Soft Delete maydonlari
    is_deleted = Column(Integer, default=0, nullable=False, index=True)  # 0=yo'q, 1=ha
    deleted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])

    __table_args__ = (
        Index("ix_research_records_deleted_created", "is_deleted", "created_at"),
        Index(
            "ix_research_records_owner_active_id", "created_by_id", "is_deleted", "id"
        ),
        Index(
            "ix_research_records_active_exam_id", "is_deleted", "examination_date", "id"
        ),
        Index("ix_research_records_owner_exam", "created_by_id", "examination_date"),
        Index("ix_research_records_gender_active", "gender", "is_deleted"),
        Index("ix_research_records_feeding_active", "feeding_type", "is_deleted"),
        Index("ix_research_records_marriage_active", "parents_marriage", "is_deleted"),
    )
