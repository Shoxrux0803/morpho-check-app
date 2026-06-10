from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, Literal
from decimal import Decimal
import math
import datetime
import re

CONSENT_POLICY_VERSION = "helsinki-declaration-consent-v1"


class PatientData(BaseModel):
    first_name: str = Field(..., alias="firstName", min_length=1, max_length=80)
    last_name: str = Field(..., alias="lastName", min_length=1, max_length=80)
    region: str = Field(..., min_length=1, max_length=120)
    district: Optional[str] = Field(None, max_length=120)
    mahalla: Optional[str] = Field(None, max_length=150)
    address: Optional[str] = Field(None, max_length=255)

    examination_date: str = Field(..., alias="examinationDate")
    birth_date: str = Field("Noma'lum", alias="birthDate")
    preschool_institution: str = Field(
        "Noma'lum", alias="preschoolInstitution", max_length=180
    )

    shoulder_length: float = Field(0.0, alias="shoulderLength", ge=0, le=80)
    shoulder_breadth: float = Field(0.0, alias="shoulderBreadth", ge=0, le=80)
    shoulder_circumference: float = Field(
        0.0, alias="shoulderCircumference", ge=0, le=120
    )
    arm_elbow_length: float = Field(0.0, alias="armElbowLength", ge=0, le=80)
    hand_length: float = Field(0.0, alias="handLength", ge=0, le=40)
    thigh_length: float = Field(0.0, alias="thighLength", ge=0, le=100)
    thigh_circumference: float = Field(0.0, alias="thighCircumference", ge=0, le=140)
    calf_length: float = Field(0.0, alias="calfLength", ge=0, le=80)
    calf_circumference: float = Field(0.0, alias="calfCircumference", ge=0, le=90)
    foot_length: float = Field(0.0, alias="footLength", ge=0, le=40)
    body_length: Optional[float] = Field(None, alias="bodyLength", ge=20, le=250)

    id_code: Optional[str] = Field(None, alias="idCode", max_length=50)
    analysis_id: Optional[int] = Field(None, alias="analysisId", ge=1)

    age: int = Field(..., ge=0, le=120)
    age_months: Optional[int] = Field(0, alias="ageMonths", ge=0, le=11)
    age_days: Optional[int] = Field(0, alias="ageDays", ge=0, le=31)
    gender: str
    height: float = Field(..., ge=45, le=250)
    weight: float = Field(..., ge=2, le=300)
    chest: float = Field(..., ge=25, le=200)
    waist: float = Field(0.0, ge=0, le=200)
    head: float = Field(..., ge=25, le=80)

    father_height: Optional[float] = Field(None, alias="fatherHeight", ge=120, le=230)
    mother_height: Optional[float] = Field(None, alias="motherHeight", ge=120, le=230)
    parents_phone: Optional[str] = Field(None, alias="parentsPhone", max_length=50)
    consent_confirmed: bool = Field(False, alias="consentConfirmed")
    consent_guardian_name: Optional[str] = Field(
        None, alias="consentGuardianName", max_length=255
    )
    consent_guardian_relationship: Optional[str] = Field(
        None, alias="consentGuardianRelationship", max_length=100
    )
    consent_guardian_phone: Optional[str] = Field(
        None, alias="consentGuardianPhone", max_length=50
    )
    consent_policy_version: str = Field(
        CONSENT_POLICY_VERSION, alias="consentPolicyVersion", max_length=50
    )

    total_body_water: Optional[float] = Field(
        None, alias="totalBodyWater", ge=0, le=100
    )
    fat_percent: Optional[float] = Field(None, alias="fatPercent", ge=0, le=80)
    fat_mass: Optional[float] = Field(None, alias="fatMass", ge=0, le=200)
    muscle_mass: Optional[float] = Field(None, alias="muscleMass", ge=0, le=200)
    bone_mass: Optional[float] = Field(None, alias="boneMass", ge=0, le=30)
    acm: Optional[float] = Field(None, alias="acm", ge=0, le=100)
    visceral_fat: Optional[float] = Field(None, alias="visceralFat", ge=0, le=60)
    doctor_note: Optional[str] = Field(None, alias="doctorNote", max_length=2000)

    class Config:
        populate_by_name = True
        extra = "forbid"

    @field_validator(
        "first_name",
        "last_name",
        "region",
        "district",
        "mahalla",
        "address",
        "preschool_institution",
        "parents_phone",
        "doctor_note",
        "consent_guardian_name",
        "consent_guardian_relationship",
        "consent_guardian_phone",
        "consent_policy_version",
        mode="before",
    )
    @classmethod
    def strip_text(cls, v):
        if v is None:
            return v
        if not isinstance(v, str):
            raise ValueError("Matn maydoni string bo'lishi kerak")
        cleaned = v.strip()
        return cleaned or None

    @field_validator(
        "height",
        "weight",
        "chest",
        "waist",
        "head",
        "shoulder_length",
        "shoulder_breadth",
        "shoulder_circumference",
        "arm_elbow_length",
        "hand_length",
        "thigh_length",
        "thigh_circumference",
        "calf_length",
        "calf_circumference",
        "foot_length",
        "body_length",
        "father_height",
        "mother_height",
        "total_body_water",
        "fat_percent",
        "fat_mass",
        "muscle_mass",
        "bone_mass",
        "acm",
        "visceral_fat",
    )
    @classmethod
    def finite_number(cls, v):
        if v is None:
            return v
        if isinstance(v, bool):
            raise ValueError("Raqamli maydon bool bo'lishi mumkin emas")
        value = float(v)
        if not math.isfinite(value):
            raise ValueError("Raqamli maydon chekli son bo'lishi kerak")
        return value

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        value = (v or "").strip().lower()
        normalized = {
            "erkak": "erkak",
            "male": "erkak",
            "ogil": "erkak",
            "o'g'il": "erkak",
            "ayol": "ayol",
            "female": "ayol",
            "qiz": "ayol",
        }.get(value)
        if not normalized:
            raise ValueError("Jins erkak yoki ayol bo'lishi kerak")
        return normalized

    @field_validator("examination_date", "birth_date")
    @classmethod
    def validate_dates(cls, v, info):
        value = (v or "").strip()
        if info.field_name == "birth_date" and value in {
            "",
            "Noma'lum",
            "unknown",
            "Unknown",
        }:
            return "Noma'lum"
        try:
            datetime.date.fromisoformat(value[:10])
        except ValueError as exc:
            raise ValueError("Sana YYYY-MM-DD formatida bo'lishi kerak") from exc
        return value

    @model_validator(mode="after")
    def validate_anthropometry(self):
        required_text = {
            "firstName": self.first_name,
            "lastName": self.last_name,
            "region": self.region,
            "examinationDate": self.examination_date,
        }
        missing = [name for name, value in required_text.items() if not value]
        if missing:
            raise ValueError(f"Majburiy maydonlar bo'sh: {', '.join(missing)}")

        if self.age == 0 and not self.age_months and not self.age_days:
            raise ValueError(
                "Yosh, oy yoki kunlardan kamida biri 0 dan katta bo'lishi kerak"
            )

        requires_guardian_consent = int(self.age or 0) < 18
        if requires_guardian_consent and not self.consent_confirmed:
            raise ValueError(
                "Bola ma'lumotlarini qayta ishlash uchun vasiyning roziligi tasdiqlanishi kerak"
            )
        if requires_guardian_consent and not self.consent_guardian_name:
            raise ValueError(
                "Rozilik bergan ota-ona yoki vasiyning ismi kiritilishi kerak"
            )

        exam = datetime.date.fromisoformat(self.examination_date[:10])
        if exam > datetime.date.today():
            raise ValueError("Ko'rik sanasi kelajakda bo'lishi mumkin emas")

        bmi = self.weight / ((self.height / 100) ** 2)
        if not 8 <= bmi <= 80:
            raise ValueError("BMI amaliy diapazondan tashqarida")
        if self.chest < self.height * 0.25 or self.chest > self.height * 1.05:
            raise ValueError("Ko'krak aylanasi bo'yga nisbatan mos emas")
        if self.waist and (
            self.waist < self.height * 0.20 or self.waist > self.height * 1.20
        ):
            raise ValueError("Bel aylanasi bo'yga nisbatan mos emas")
        if self.head < self.height * 0.20 or self.head > self.height * 0.70:
            raise ValueError("Bosh aylanasi bo'yga nisbatan mos emas")
        if self.birth_date != "Noma'lum":
            birth = datetime.date.fromisoformat(self.birth_date[:10])
            if birth > exam:
                raise ValueError(
                    "Tug'ilgan sana ko'rik sanasidan keyin bo'lishi mumkin emas"
                )
            actual_age = (
                exam.year
                - birth.year
                - ((exam.month, exam.day) < (birth.month, birth.day))
            )
            if abs(actual_age - int(self.age)) > 1:
                raise ValueError("Yosh tug'ilgan sana va ko'rik sanasiga mos emas")
        return self


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
    sport: Optional[str] = None


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
    district: Optional[str] = None
    mahalla: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    research_topic: Optional[str] = Field(None, max_length=500)
    research_type: Optional[str] = Field(None, max_length=100)
    research_area: Optional[str] = Field(None, max_length=255)
    scientific_supervisor: Optional[str] = Field(None, max_length=200)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if not v:
            return v
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Parolda kamida 1 ta katta harf bo'lishi kerak")
        if not re.search(r"[a-z]", v):
            raise ValueError("Parolda kamida 1 ta kichik harf bo'lishi kerak")
        if not re.search(r"[0-9]", v):
            raise ValueError("Parolda kamida 1 ta raqam bo'lishi kerak")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password and self.password != self.password_confirm:
            raise ValueError("Parollar mos emas")
        if self.role not in {"user", "admin", "superadmin", "researcher"}:
            raise ValueError("Noto'g'ri foydalanuvchi roli")
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
        if not re.search(r"[A-Z]", v):
            raise ValueError("Parolda kamida 1 ta katta harf bo'lishi kerak")
        if not re.search(r"[a-z]", v):
            raise ValueError("Parolda kamida 1 ta kichik harf bo'lishi kerak")
        if not re.search(r"[0-9]", v):
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
    device_id: Optional[str] = None
    verification_code: Optional[str] = None


class Token(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    requires_verification: bool = False
    message: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    mahalla: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    research_topic: Optional[str] = Field(None, max_length=500)
    research_type: Optional[str] = Field(None, max_length=100)
    research_area: Optional[str] = Field(None, max_length=255)
    scientific_supervisor: Optional[str] = Field(None, max_length=200)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if not v:
            return v
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Parolda kamida 1 ta katta harf bo'lishi kerak")
        if not re.search(r"[a-z]", v):
            raise ValueError("Parolda kamida 1 ta kichik harf bo'lishi kerak")
        if not re.search(r"[0-9]", v):
            raise ValueError("Parolda kamida 1 ta raqam bo'lishi kerak")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v is not None and v not in {"user", "admin", "superadmin", "researcher"}:
            raise ValueError("Noto'g'ri foydalanuvchi roli")
        return v


class UserOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    region: Optional[str] = None
    district: Optional[str] = None
    mahalla: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    research_topic: Optional[str] = None
    research_type: Optional[str] = None
    research_area: Optional[str] = None
    scientific_supervisor: Optional[str] = None
    is_deleted: Optional[int] = 0
    deleted_at: Optional[datetime.datetime] = None
    deleted_by_id: Optional[int] = None

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
    chest: float  # sm
    head: float  # sm

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
                return dict(
                    height=(130, 220),
                    weight=(30, 250),
                    head=(52, 64),
                    chest=(75, 140),
                    bmi=(14, 60),
                )
            if age >= 15:
                return dict(
                    height=(145, 200),
                    weight=(35, 120),
                    head=(52, 61),
                    chest=(70, 110),
                    bmi=(12, 38),
                )
            if age >= 10:
                return dict(
                    height=(125, 175),
                    weight=(24, 70),
                    head=(50, 58),
                    chest=(58, 90),
                    bmi=(12, 38),
                )
            if age >= 5:
                return dict(
                    height=(100, 145),
                    weight=(14, 40),
                    head=(48, 55),
                    chest=(52, 72),
                    bmi=(12, 38),
                )
            return dict(
                height=(85, 115),
                weight=(10, 22),
                head=(46, 52),
                chest=(48, 62),
                bmi=(12, 38),
            )

        b = band(age)
        errs = []
        if not (b["height"][0] <= h <= b["height"][1]):
            errs.append(f"Bo‘y {b['height'][0]}–{b['height'][1]} sm.")
        if not (b["weight"][0] <= w <= b["weight"][1]):
            errs.append(f"Vazn {b['weight'][0]}–{b['weight'][1]} kg.")
        if not (b["head"][0] <= head <= b["head"][1]):
            errs.append(f"Bosh aylanasi {b['head'][0]}–{b['head'][1]} sm.")
        if not (b["chest"][0] <= chest <= b["chest"][1]):
            errs.append(f"Ko‘krak aylanasi {b['chest'][0]}–{b['chest'][1]} sm.")

        bmi = w / ((h / 100) ** 2) if h > 0 else None
        if bmi is None or not (b["bmi"][0] <= bmi <= b["bmi"][1]):
            errs.append(f"BMI {b['bmi'][0]}–{b['bmi'][1]} oralig‘ida bo‘lishi kerak.")

        if h > 0:
            chest_min = 0.45 * h
            chest_max = 0.9 * h
            if not (chest_min <= chest <= chest_max):
                errs.append(
                    f"Ko‘krak aylanasi bo‘yga nisbatan taxminiy {round(chest_min)}–{round(chest_max)} sm oralig‘ida bo‘lishi kerak."
                )
            if age >= 20:
                if not (52 <= head <= 64):
                    errs.append(
                        "Kattalarda bosh aylanasi odatda 52–64 sm oralig‘ida bo‘ladi."
                    )
            else:
                head_min = 0.27 * h
                head_max = 0.40 * h
                if not (head_min <= head <= head_max):
                    errs.append(
                        f"Bosh aylanasi bo‘yga nisbatan taxminiy {round(head_min)}–{round(head_max)} sm."
                    )

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
    consent_confirmed: Optional[bool] = False
    consent_guardian_name: Optional[str] = Field(None, max_length=255)
    consent_guardian_relationship: Optional[str] = Field(None, max_length=100)
    consent_guardian_phone: Optional[str] = Field(None, max_length=50)
    consent_policy_version: Optional[str] = Field(CONSENT_POLICY_VERSION, max_length=50)
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
    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None
    created_at: datetime.datetime
    is_deleted: Optional[int] = 0
    deleted_by_id: Optional[int] = None
    deleted_by_name: Optional[str] = None
    deleted_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True
