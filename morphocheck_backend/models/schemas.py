from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Literal
from decimal import Decimal
import math

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
        orm_mode = True

class UserCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "user"

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    region: Optional[str] = None

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

class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
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