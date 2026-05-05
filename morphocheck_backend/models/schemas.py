from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Literal
from decimal import Decimal
import math
import datetime
import re

class PatientData(BaseModel):
    first_name: str
    last_name: str
    region: str
    address: str
    examination_date: str
    birth_date: str
    preschool_institution: str
    id_code: Optional[str] = None

    shoulder_length: float
    shoulder_breadth: float
    shoulder_circumference: float
    arm_elbow_length: float
    hand_length: float
    thigh_length: float
    thigh_circumference: float
    calf_length: float
    calf_circumference: float
    foot_length: float
    body_length: Optional[float] = Field(None, alias="bodyLength")
    age: int
    age_months: Optional[int] = 0
    age_days: Optional[int] = 0

    sitting_height: Optional[float] = None
    waist_circumference: Optional[float] = None
    hip_circumference: Optional[float] = None

    # Bioimpedance
    total_body_water: Optional[float] = None
    fat_percent: Optional[float] = None
    fat_mass: Optional[float] = None
    muscle_mass: Optional[float] = None
    bone_mass: Optional[float] = None
    acm: Optional[float] = None
    visceral_fat: Optional[float] = None

class AnalysisResult(BaseModel):
    z_score: float
    somatotype: str
    bmi: float
    bmi_category: str
    ideal_weight: float
    weight_diff: float

class Advices(BaseModel):
    general: str
    specialist: str
    nutrition: str
    activity: str
    checkups: str

class FullReportRequest(BaseModel):
    patient_data: PatientData
    analysis: AnalysisResult
    advices: Advices

class UserDataCreate(BaseModel):
    full_name: str
    age: Optional[int]
    gender: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    chest_circumference: Optional[float]
    waist_circumference: Optional[float]
    hip_circumference: Optional[float]
    head_circumference: Optional[float]
    arm_length: Optional[float]
    leg_length: Optional[float]
    foot_length: Optional[float]
    bmi: Optional[float]
    somatotype: Optional[str]

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    password_confirm: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "user"
    region: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if not v:
            return v
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Parolda kamida 1 ta katta harf bo'lishi kerak")
        if not re.search(r'[a-z]', v):
            raise ValueError("Parolda kamida 1 ta kichik harf bo'lishi kerak")
        if not re.search(r'[0-9]', v):
            raise ValueError("Parolda kamida 1 ta raqam bo'lishi kerak")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password and self.password != self.password_confirm:
            raise ValueError("Parollar mos emas")
        return self

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    password_confirm: str
    phone: Optional[str] = None
    region: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Parolda kamida 1 ta katta harf bo'lishi kerak")
        if not re.search(r'[a-z]', v):
            raise ValueError("Parolda kamida 1 ta kichik harf bo'lishi kerak")
        if not re.search(r'[0-9]', v):
            raise ValueError("Parolda kamida 1 ta raqam bo'lishi kerak")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.password_confirm:
            raise ValueError("Parollar mos emas")
        return self

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    region: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    region: Optional[str] = None
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    user_id: Optional[int] = None
    amount: Decimal = Field(..., gt=0)
    currency: Optional[str] = "UZS"
    method: Optional[str] = None
    status: Optional[str] = "paid"
    description: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    user_id: Optional[int]
    amount: Decimal
    currency: str
    method: Optional[str]
    status: str
    description: Optional[str]
    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    target_type: Optional[str]
    target_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime.datetime
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class AnalysisInput(BaseModel):
    age: int
    gender: Literal["erkak", "ayol"]
    height: float  # sm
    weight: float  # kg
    chest: float   # sm
    head: float    # sm
    
    # Bioimpedance
    total_body_water: Optional[float] = None
    fat_percent: Optional[float] = None
    fat_mass: Optional[float] = None
    muscle_mass: Optional[float] = None
    bone_mass: Optional[float] = None
    acm: Optional[float] = None
    visceral_fat: Optional[float] = None

    @field_validator("age")
    @classmethod
    def age_range(cls, v):
        if v < 3 or v > 70:
            raise ValueError("Yosh 3–70 oralig‘ida bo‘lishi kerak.")
        return v

    @model_validator(mode="after")
    def anthro_sanity(self):
        age = self.age
        h = self.height
        w = self.weight
        chest = self.chest
        head = self.head

        def band(age):
            if age >= 20:
                return dict(height=(130,220), weight=(30,250), head=(52,64), chest=(75,140), bmi=(14,60))
            if age >= 15:
                return dict(height=(145,200), weight=(35,120), head=(52,61), chest=(70,110), bmi=(12,38))
            if age >= 10:
                return dict(height=(125,175), weight=(24,70),  head=(50,58), chest=(58,90),  bmi=(12,38))
            if age >= 5:
                return dict(height=(100,145), weight=(14,40),  head=(48,55), chest=(52,72),  bmi=(12,38))
            return dict(height=(85,115),  weight=(10,22),  head=(46,52), chest=(48,62),  bmi=(12,38))

        b = band(age)
        errs = []
        if not (b["height"][0] <= h <= b["height"][1]): errs.append(f"Bo‘y {b['height'][0]}–{b['height'][1]} sm.")
        if not (b["weight"][0] <= w <= b["weight"][1]): errs.append(f"Vazn {b['weight'][0]}–{b['weight'][1]} kg.")
        if not (b["head"][0]   <= head <= b["head"][1]): errs.append(f"Bosh aylanasi {b['head'][0]}–{b['head'][1]} sm.")
        if not (b["chest"][0]  <= chest<= b["chest"][1]): errs.append(f"Ko‘krak aylanasi {b['chest'][0]}–{b['chest'][1]} sm.")

        bmi = w / ((h/100)**2) if h>0 else None
        if bmi is None or not (b["bmi"][0] <= bmi <= b["bmi"][1]):
            errs.append(f"BMI {b['bmi'][0]}–{b['bmi'][1]} oralig‘ida bo‘lishi kerak.")

        if h>0:
            chest_min = 0.45*h
            chest_max = 0.9*h
            if not (chest_min <= chest <= chest_max):
                errs.append(f"Ko‘krak aylanasi bo‘yga nisbatan taxminiy {round(chest_min)}–{round(chest_max)} sm oralig‘ida bo‘lishi kerak.")
            if age >= 20:
                if not (52 <= head <= 64):
                    errs.append("Kattalarda bosh aylanasi odatda 52–64 sm oralig‘ida bo‘ladi.")
            else:
                head_min = 0.27*h
                head_max = 0.40*h
                if not (head_min <= head <= head_max):
                    errs.append(f"Bosh aylanasi bo‘yga nisbatan taxminiy {round(head_min)}–{round(head_max)} sm.")

        if errs:
            raise ValueError(" / ".join(errs))
        return self

class ResearchRecordCreate(BaseModel):
    full_name: Optional[str] = None
    school_name: Optional[str] = None
    settlement: Optional[str] = None
    birth_place: Optional[str] = None
    birth_date: Optional[str] = None
    father_nationality: Optional[str] = None
    mother_nationality: Optional[str] = None
    living_since: Optional[str] = None
    enrolled_date: Optional[str] = None
    living_conditions: Optional[str] = None
    labor_regime: Optional[str] = None
    past_illnesses: Optional[str] = None
    children_count: Optional[int] = None
    child_order: Optional[int] = None
    feeding_type: Optional[str] = None
    parents_marriage: Optional[str] = None
    mother_health_status: Optional[str] = None
    examination_date: Optional[str] = None
    gender: Optional[str] = None
    parents_phone: Optional[str] = None
    father_height: Optional[float] = None
    mother_height: Optional[float] = None

    lower_leg_total: Optional[float] = None
    lower_leg_spina_iliaca: Optional[float] = None
    lower_leg_symphysion: Optional[float] = None
    lower_leg_length: Optional[float] = None
    tibiale_height: Optional[float] = None
    pelvic_width: Optional[float] = None
    thigh_length: Optional[float] = None
    thigh_circumference: Optional[float] = None
    calf_length: Optional[float] = None
    calf_circumference: Optional[float] = None
    foot_length: Optional[float] = None
    teeth_count: Optional[int] = None
    menstruation_start: Optional[str] = None

    skull_longitudinal: Optional[float] = None
    skull_transverse: Optional[float] = None
    head_circumference: Optional[float] = None
    forehead_transverse: Optional[float] = None
    skull_height: Optional[float] = None

    skull_base_length: Optional[float] = None
    skull_base_width: Optional[float] = None

    face_bizygomatic: Optional[float] = None
    face_bigonial: Optional[float] = None
    face_morphological_height: Optional[float] = None
    face_physiognomic_height: Optional[float] = None
    nose_height: Optional[float] = None
    nose_width: Optional[float] = None
    outer_canthal_width: Optional[float] = None
    inner_canthal_width: Optional[float] = None
    lips_mucosa_height: Optional[float] = None
    mouth_width: Optional[float] = None

    chest_standing_height: Optional[float] = None
    chest_sitting_height: Optional[float] = None
    weight: Optional[float] = None
    trunk_length: Optional[float] = None
    torso_length: Optional[float] = None
    chest_circumference_pause: Optional[float] = None
    chest_circumference_inhale: Optional[float] = None
    chest_circumference_exhale: Optional[float] = None
    waist_circumference: Optional[float] = None
    abdomen_circumference: Optional[float] = None
    upper_segment_length: Optional[float] = None
    chest_transverse_diameter: Optional[float] = None
    chest_anteroposterior_diameter: Optional[float] = None
    chest_height: Optional[float] = None

    arm_length: Optional[float] = None
    shoulder_length: Optional[float] = None
    shoulder_width: Optional[float] = None
    arm_circumference_total: Optional[float] = None
    shoulder_circumference_rest: Optional[float] = None
    shoulder_circumference_flexed: Optional[float] = None
    forearm_length: Optional[float] = None
    hand_length: Optional[float] = None
    dynamometry: Optional[float] = None

    fat_triceps: Optional[float] = None
    fat_biceps: Optional[float] = None
    fat_subscapular: Optional[float] = None
    fat_iliac: Optional[float] = None
    fat_popliteal: Optional[float] = None

class ResearchRecordOut(ResearchRecordCreate):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime.datetime
    is_deleted: Optional[int] = 0
    deleted_by_id: Optional[int] = None
    deleted_by_name: Optional[str] = None
    deleted_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True
