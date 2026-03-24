# morphocheck_backend/routers/analyze_router.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Tuple
from io import BytesIO
import datetime
import os
import logging

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch

from sqlalchemy.orm import Session

# ---------------------------
# DB session + model
# ---------------------------
try:
    from utils.database import get_db
except ImportError:
    from utils.database import SessionLocal
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

from models.userdata import UserAnalysis
from services.indices_service import calculate_detailed_indices

router = APIRouter(tags=["Tahlil"])

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ---------------------------
# Yordamchi funksiyalar
# ---------------------------
def setup_font() -> str:
    """
    PDF uchun shrifni aniqlaydi (DejaVu yo'q bo'lsa, Helvetica).
    /morphocheck_backend/fonts/DejaVuSans.ttf bo'lsa, avtomatik yuklaydi.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        font_path = os.path.join(base_dir, 'fonts', 'DejaVuSans.ttf')

        if not os.path.exists(font_path):
            # fallback
            available_fonts = ['Helvetica-Bold', 'Helvetica', 'Times-Roman', 'Courier']
            for font in available_fonts:
                if font in pdfmetrics.getRegisteredFontNames():
                    return font
            return 'Helvetica'

        pdfmetrics.registerFont(TTFont('DejaVu', font_path))
        return 'DejaVu'
    except Exception as e:
        logger.warning(f"Font sozlashda xato: {str(e)}")
        return 'Helvetica'


def get_bmi_range_by_age_and_gender(age: int, gender: str) -> Dict[str, float]:
    # Hozircha sodda diapazon — yoshga mos biroz siljigan
    gender = (gender or "").strip().lower()
    if age < 18:
        return {"min": 18.0, "max": 24.0}
    elif age < 25:
        return {"min": 18.5, "max": 24.9}
    elif age < 45:
        return {"min": 20.0, "max": 25.0}
    elif age < 60:
        return {"min": 21.0, "max": 26.0}
    else:
        return {"min": 22.0, "max": 27.0}


def get_ideal_weight_by_age_and_gender(age: int, height: float, gender: str) -> float:
    gender = (gender or "").strip().lower()

    # 3–18 yosh oralig'i uchun WHO ga yaqin mos jadval
    boys_weights = {
        3: 14.3, 4: 16.3, 5: 18.3, 6: 20.5, 7: 22.9, 8: 25.6, 9: 28.5,
        10: 31.9, 11: 35.6, 12: 39.9, 13: 45.3, 14: 50.8, 15: 56.5, 16: 61.5,
        17: 66.0, 18: 70.3
    }
    girls_weights = {
        3: 13.9, 4: 15.7, 5: 17.6, 6: 19.7, 7: 22.0, 8: 24.5, 9: 27.2,
        10: 30.1, 11: 33.4, 12: 37.0, 13: 41.1, 14: 45.3, 15: 49.1, 16: 52.1,
        17: 54.4, 18: 56.0
    }

    if age <= 18:
        if gender == "erkak":
            return boys_weights.get(age, 20.0)
        else:
            return girls_weights.get(age, 19.0)

    # Kattalar uchun – BMI diapazoniga asoslangan ideal vazn
    if age < 25:
        bmi_target = 22.0
    elif age < 45:
        bmi_target = 23.0
    elif age < 60:
        bmi_target = 24.0
    else:
        bmi_target = 25.0

    height_m = height / 100
    return round(bmi_target * (height_m ** 2), 1)


# ---------------------------
# Kiruvchi model (camelCase alias bilan)
# ---------------------------
class PatientData(BaseModel):
    first_name: str = Field(..., alias="firstName")
    last_name: str  = Field(..., alias="lastName")
    region: str
    district: Optional[str] = None
    address: str
    
    examination_date: str = Field(..., alias="examinationDate")
    birth_date: str = Field("Noma'lum", alias="birthDate")
    preschool_institution: str = Field("Noma'lum", alias="preschoolInstitution")

    shoulder_length: float = Field(0.0, alias="shoulderLength")
    shoulder_breadth: float = Field(0.0, alias="shoulderBreadth")
    shoulder_circumference: float = Field(0.0, alias="shoulderCircumference")
    arm_elbow_length: float = Field(0.0, alias="armElbowLength")
    hand_length: float = Field(0.0, alias="handLength")
    thigh_length: float = Field(0.0, alias="thighLength")
    thigh_circumference: float = Field(0.0, alias="thighCircumference")
    calf_length: float = Field(0.0, alias="calfLength")
    calf_circumference: float = Field(0.0, alias="calfCircumference")
    foot_length: float = Field(0.0, alias="footLength")
    
    id_code: Optional[str] = Field(None, alias="idCode")
    
    age: int
    age_months: Optional[int] = Field(0, alias="ageMonths")
    age_days: Optional[int] = Field(0, alias="ageDays")
    gender: str
    height: float
    weight: float
    chest: float
    waist: float = 0.0
    head: float

    # Bioimpedance Analysis
    total_body_water: Optional[float] = Field(None, alias="totalBodyWater")
    fat_percent: Optional[float] = Field(None, alias="fatPercent")
    fat_mass: Optional[float] = Field(None, alias="fatMass")
    muscle_mass: Optional[float] = Field(None, alias="muscleMass")
    bone_mass: Optional[float] = Field(None, alias="boneMass")
    acm: Optional[float] = Field(None, alias="acm")
    visceral_fat: Optional[float] = Field(None, alias="visceralFat")

    class Config:
        populate_by_name = True  # alias va field nomi ikkalasi ham qabul qilinadi


def generate_region_based_id(db: Session, region: str) -> str:
    """Viloyatga bog'langan ketma-ket ID generatsiya qilish: {VILOYAT_KODI}-{tartib}"""
    # Normallashtirish: bo'shliqlarni olib tashlash va bir xil formatga keltirish
    region_norm = (region or "").strip()
    
    # Prifikslar xaritasi (Lotin va Kirill variantlari uchun)
    prefixes = {
        # Lotin
        "Toshkent shahri": "TS",
        "Toshkent viloyati": "TV",
        "Andijon": "AND",
        "Farg‘ona": "FAR",
        "Farg'ona": "FAR",
        "Namangan": "NAM",
        "Samarqand": "SAM",
        "Buxoro": "BUX",
        "Xorazm": "XOR",
        "Qoraqalpog‘iston": "QR",
        "Qoraqalpog'iston": "QR",
        "Jizzax": "JIZ",
        "Sirdaryo": "SIR",
        "Surxondaryo": "SUR",
        "Qashqadaryo": "QAS",
        "Navoiy": "NAV",
        # Kirill
        "Тошкент шаҳри": "TS",
        "Тошкент вилояти": "TV",
        "Андижон": "AND",
        "Фарғона": "FAR",
        "Наманган": "NAM",
        "Самарқанд": "SAM",
        "Бухоро": "BUX",
        "Хоразм": "XOR",
        "Қорақалпоғистон": "QR",
        "Жиззах": "JIZ",
        "Сирдарё": "SIR",
        "Сурхондарё": "SUR",
        "Қашқадарё": "QAS",
        "Навоий": "NAV"
    }
    
    prefix = prefixes.get(region_norm)
    if not prefix:
        # Katta-kichik harfga sezgirlikni kamaytirish va substring qidirish
        for reg_name, pref in prefixes.items():
            if reg_name.lower() in region_norm.lower() or region_norm.lower() in reg_name.lower():
                prefix = pref
                break
                
    if not prefix:
        # Agar xaritada bo'lmasa, birinchi 3 ta harfni olamiz
        from services.docx_services import lat2cyr
        # Hammasini lotinga o'girib keyin prefix olish xavfsizroq bo'lishi mumkin, 
        # lekin hozircha oddiyroq yo'l:
        clean_name = "".join(filter(str.isalnum, region_norm))
        if clean_name:
            prefix = clean_name[:3].upper()
        else:
            prefix = "UNK"
            
    # Mavjud yozuvlar sonini hisoblash (prefix bo'yicha emas, aynan shu region bo'yicha)
    # Normallashtirilgan qidiruv: region nomi prefix bilan bog'liq bo'lgan barcha yozuvlarni sanaydi
    # Yoki shunchaki barcha Prefix-ID larni sanash (Prefix-XXXXX)
    count = db.query(UserAnalysis).filter(UserAnalysis.id_code.like(f"{prefix}-%")).count()
    
    return f"{prefix}-{count + 1:05d}"



def calculate_bmi(data: PatientData) -> Dict[str, Any]:
    height = float(data.height)
    weight = float(data.weight)
    gender = (data.gender or "").strip().lower()
    age = int(data.age)

    h2 = (height / 100.0) ** 2
    if h2 <= 0:
        raise ValueError("Bo'y qiymati noto‘g‘ri.")
    bmi = round(weight / h2, 1)

    bmi_rng = get_bmi_range_by_age_and_gender(age, gender)
    ideal_weight = get_ideal_weight_by_age_and_gender(age, height, gender)
    min_w = round(bmi_rng["min"] * h2, 1)
    max_w = round(bmi_rng["max"] * h2, 1)

    weight_diff = round(weight - ideal_weight, 1)
    z_score = round((weight - ideal_weight) / 10, 2)  # soddalashtirilgan σ

    if bmi < 18.5:
        somatotype = "Эктоморф"
        bmi_category = "Кам вазн"
    elif 18.5 <= bmi < 25:
        somatotype = "Мезоморф"
        bmi_category = "Меъёр"
    elif 25 <= bmi < 30:
        somatotype = "Эндоморф"
        bmi_category = "Ортиқча вазн"
    else:
        somatotype = "Эндоморф"
        bmi_category = "Семизлик"
        
    # Yangi parametrlar bo'yicha proporsiya kalkulyatsiyasi
    shoulder_ratio = round((float(data.shoulder_breadth) / height) * 100, 1) if data.shoulder_breadth else 0
    thigh_ratio = round((float(data.thigh_circumference) / height) * 100, 1) if data.thigh_circumference else 0

    # HMAI, MII, ADI hisoblash
    manual_bio = {
        "total_body_water": data.total_body_water,
        "fat_percent": data.fat_percent,
        "fat_mass": data.fat_mass,
        "muscle_mass": data.muscle_mass,
        "bone_mass": data.bone_mass,
        "acm": data.acm,
        "visceral_fat": data.visceral_fat
    }
    detailed = calculate_detailed_indices(age, gender, height, weight, bmi, manual_bio)

    return {
        "bmi": bmi,
        "ideal_weight": ideal_weight,
        "ideal_weight_range": {"min": min_w, "max": max_w},
        "weight_diff": weight_diff,
        "z_score": z_score,
        "somatotype": somatotype,
        "bmi_category": bmi_category,
        "shoulder_ratio": shoulder_ratio,
        "thigh_ratio": thigh_ratio,
        "indices": detailed
    }


def _split_region_and_district(region: Optional[str], district: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Agar district bo'sh bo'lsa, region "Viloyat, Tuman" ko'rinishida kelgan bo'lishi mumkin.
    Shunda avtomatik ikkiga ajratamiz.
    """
    region = (region or "").strip()
    district = (district or "").strip() or None

    if district is None and region and "," in region:
        left, right = [p.strip() for p in region.split(",", 1)]
        if left and right:
            return left, right
    return (region or None), district


def generate_advices(bmi: float, weight_diff: float, age: int, gender: str, bio_data: dict = None) -> Dict[str, str]:
    bmi_range = get_bmi_range_by_age_and_gender(age, gender)

    res = {
        "general": "Sog'lom turmush tarzini davom ettiring.",
        "specialist": "Doimiy nazorat zarur emas.",
        "nutrition": "Balanslangan ovqatlanish tartibiga rioya qiling.",
        "activity": "Kunlik jismoniy faollikni saqlab turing.",
        "checkups": "Yiliga 1 marta profilaktik tekshiruvdan o'ting."
    }

    # 1. BMI based advice
    if bmi < bmi_range["min"]:
        res["general"] = "Tana vazni yetarli emas (Kam vazn). Diqqat qiling."
        res["specialist"] = "Pediatr yoki parhezshunos (dietolog) ko'rigi tavsiya etiladi."
        res["nutrition"] = "Energetik qiymati yuqori, oqsil va sog'lom yog'larga boy taomlarni ko'paytiring."
        res["activity"] = "Yoshga mos ravishda mushak massasini oshiruvchi yengil mashqlar."
        res["checkups"] = "Har 6 oyda tahlillar topshirib turish tavsiya etiladi."
    elif bmi > bmi_range["max"]:
        res["general"] = "Ortiqcha vazn aniqlandi. Bu kelajakda salomatlikka salbiy ta'sir qilishi mumkin."
        res["specialist"] = "Endokrinolog va parhezshunos ko'rigidan o'tish maqsadga muvofiq."
        res["nutrition"] = "Past kaloriyali, kletchatka (sabzavotlar)ga boy ratsionga o'ting, shirinliklarni cheklang."
        res["activity"] = "Kundalik 40-60 daqiqa faol harakat (yugurish, suzish, sport o'yinlari) zarur."
        res["checkups"] = "Har 3-6 oyda vazn va metabolik ko'rsatkichlarni tekshirib turing."

    # 2. Bioimpedance and Indices based advice (from bio_data)
    if bio_data:
        # Get pre-calculated advice list from indices_service
        raw_advices = bio_data.get("advice", [])
        
        # Mapping rules based on keywords to categorize raw advices
        for adv in raw_advices:
            adv_l = adv.lower()
            if any(k in adv_l for k in ["shirinlik", "ovqat", "suv", "oqsil", "ratsion", "iste'mol", "parhez"]):
                if res["nutrition"] == "Balanslangan ovqatlanish tartibiga rioya qiling.":
                    res["nutrition"] = adv
                else:
                    res["nutrition"] += " " + adv
            elif any(k in adv_l for k in ["pediatr", "endokrinolog", "mutaxassis", "ko'rig", "maslahat"]):
                if res["specialist"] == "Doimiy nazorat zarur emas.":
                    res["specialist"] = adv
                else:
                    res["specialist"] += " " + adv
            elif any(k in adv_l for k in ["mashq", "sport", "faollik", "harakat", "badantarbiya"]):
                if res["activity"] == "Kunlik jismoniy faollikni saqlab turing.":
                    res["activity"] = adv
                else:
                    res["activity"] += " " + adv
            elif any(k in adv_l for k in ["tahlil", "tekshiruv", "nazorat", "vitamin"]):
                if res["checkups"] == "Yiliga 1 marta profilaktik tekshiruvdan o'ting.":
                    res["checkups"] = adv
                else:
                    res["checkups"] += " " + adv
            else:
                if res["general"] == "Sog'lom turmush tarzini davom ettiring.":
                    res["general"] = adv
                else:
                    res["general"] += " " + adv

        # Extra specific checks to ensure high quality coverage
        # ADI (Disharmony) reinforcement
        adi = bio_data.get("adi", 0)
        if adi > 2.0:
            if "disgarmoniya" not in res["general"].lower():
                res["general"] += " Rivojlanishda disgarmoniya kuzatilmoqda, mutaxassis nazorati muhim."
        
        # MII (Integration) reinforcement
        mii = bio_data.get("mii", 0)
        if mii < 1.5:
            if "disbalans" not in res["activity"].lower():
                res["activity"] += " Tana tuzilishidagi disbalansni to'g'rilash uchun maxsus mashqlar tavsiya etiladi."

        # Visceral fat reinforcement
        v_fat = bio_data.get("visceral_fat", 0)
        if v_fat > 4:
            if "visseral" not in res["nutrition"].lower():
                res["nutrition"] += " Ichki yog' miqdorini kamaytirish uchun sog'lom parhezga o'ting."

    return res




# ---------------------------
# Endpointlar
# ---------------------------

@router.post("/", tags=["Tahlil"])
def analyze_and_store_raw(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Oddiy saqlash: kelgan 'data' ni to'g'ridan-to'g'ri UserAnalysis ga yozadi.
    (Kalit nomlari model bilan 1:1 mos bo'lishi shart.)
    """
    try:
        rec = UserAnalysis(**data)
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return {"message": "Ma'lumotlar saqlandi", "user_id": rec.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Saqlash xatosi: {e}")


@router.post("/full", response_model=Dict[str, Any], tags=["Tahlil"])
def analyze_full(data: PatientData, db: Session = Depends(get_db)):
    """
    To'liq tahlil: hisob-kitob + maslahatlar + DBga saqlash.
    Frontend hozir aynan shu endpointga urmoqda.
    """
    try:
        # 1) Tahlil
        gender_norm = (data.gender or "").strip().lower()
        analysis = calculate_bmi(data)
        advices  = generate_advices(
            analysis["bmi"], 
            analysis["weight_diff"], 
            int(data.age), 
            gender_norm,
            bio_data=analysis["indices"]
        )
        clean_region, clean_district = _split_region_and_district(data.region, getattr(data, "district", None))

        # 2) DBga saqlash
        id_code = generate_region_based_id(db, clean_region)
        full_name = f"{data.first_name} {data.last_name}".strip()
        rec = UserAnalysis(
            name=full_name,
            id_code=id_code,
            region=clean_region,
            district=clean_district,
            address=(data.address or "").strip() or None,
            age=int(data.age),
            age_months=int(data.age_months or 0),
            age_days=int(data.age_days or 0),
            gender=gender_norm,
            height=float(data.height),
            weight=float(data.weight),
            chest=float(data.chest),
            waist=float(data.waist or 0.0),
            hip=0.0,
            head=float(data.head),
            
            examination_date=data.examination_date,
            birth_date=data.birth_date,
            preschool_institution=data.preschool_institution,
            shoulder_length=data.shoulder_length,
            shoulder_breadth=data.shoulder_breadth,
            shoulder_circumference=data.shoulder_circumference,
            arm_elbow_length=data.arm_elbow_length,
            hand_length=data.hand_length,
            thigh_length=data.thigh_length,
            thigh_circumference=data.thigh_circumference,
            calf_length=data.calf_length,
            calf_circumference=data.calf_circumference,
            foot_length=data.foot_length,
            
            bmi=float(analysis["bmi"]),
            z_score=float(analysis["z_score"]),
            somatotype=str(analysis["somatotype"]),
            
            # Bioimpedance fields
            total_body_water=data.total_body_water,
            fat_percent=data.fat_percent,
            fat_mass=data.fat_mass,
            muscle_mass=data.muscle_mass,
            bone_mass=data.bone_mass,
            acm=data.acm,
            visceral_fat=data.visceral_fat,

            recommendations=(
                f"General: {advices.get('general', '')}; "
                f"Nutrition: {advices.get('nutrition', '')}; "
                f"Activity: {advices.get('activity', '')}; "
                f"Specialist: {advices.get('specialist', '')}; "
                f"Checkups: {advices.get('checkups', '')}"
            )
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        # 3) Frontendga natija — TOP-LEVEL da analysis/advices (api.js kutganidek)
        return {
            "status": "success",
            "id": rec.id,
            "patient_info": {
                "id_code": id_code,
                "full_name": full_name,
                "age": data.age,
                "age_months": data.age_months,
                "age_days": data.age_days,
                "gender": gender_norm,
                "region": clean_region,
                "district": clean_district,
                "address": data.address
            },
            "measurements": {
                "height": data.height,
                "weight": data.weight,
                "chest": data.chest,
                "waist": data.waist,
                "head": data.head
            },
            "analysis": analysis,
            "advices": advices
        }

    except Exception as e:
        logger.error(f"To'liq tahlilda xato: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Tahlil yoki saqlash xatosi: {str(e)}")


@router.post("/pdf-report", tags=["PDF Hisobot"])
def generate_pdf_report(data: PatientData):
    """
    Kiritilgan ma'lumotlardan PDF hisobot generatsiyasi (download).
    """
    try:
        # Hisob-kitoblar
        gender_norm = (data.gender or "").strip().lower()
        analysis = calculate_bmi(data)
        advices  = generate_advices(
            analysis["bmi"], 
            analysis["weight_diff"], 
            int(data.age), 
            gender_norm,
            bio_data=analysis["indices"]
        )

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30, leftMargin=30,
            topMargin=30, bottomMargin=30
        )

        font_name = setup_font()

        styles = getSampleStyleSheet()
        styles['Normal'].fontName = font_name
        styles['Heading2'].fontName = font_name

        elements = []

        title_style = ParagraphStyle(
            'Title',
            parent=styles['Title'],
            fontSize=18,
            alignment=1,
            spaceAfter=20,
            fontName=font_name,
            textColor=colors.HexColor("#2c3e50")
        )
        elements.append(Paragraph("MorphoCheck Pro Tahlil Hisoboti", title_style))

        elements.append(Paragraph(f"<b>Ism:</b> {data.first_name} {data.last_name}", styles['Normal']))
        elements.append(Paragraph(f"<b>Yosh:</b> {data.age}", styles['Normal']))
        elements.append(Paragraph(f"<b>Jins:</b> {gender_norm}", styles['Normal']))
        if getattr(data, "birth_date", None):
            elements.append(Paragraph(f"<b>Tug'ilgan sanasi:</b> {data.birth_date}", styles['Normal']))
        if getattr(data, "examination_date", None):
            elements.append(Paragraph(f"<b>Tekshiruv sanasi:</b> {data.examination_date}", styles['Normal']))
        if getattr(data, "preschool_institution", None):
            elements.append(Paragraph(f"<b>Maktab/MTM:</b> {data.preschool_institution}", styles['Normal']))
        elements.append(Paragraph(f"<b>Viloyat:</b> {data.region}", styles['Normal']))
        if getattr(data, "district", None):
            elements.append(Paragraph(f"<b>Tuman:</b> {data.district}", styles['Normal']))
        elements.append(Paragraph(f"<b>Manzil:</b> {data.address}", styles['Normal']))
        elements.append(Spacer(1, 20))

        measurements = [
            ["Parametr", "Qiymat"],
            ["Bo'y", f"{data.height} sm"],
            ["Vazn", f"{data.weight} kg"],
            ["Ko'krak aylanasi", f"{data.chest} sm"],
            ["Bosh aylanasi", f"{data.head} sm"]
        ]
        
        extra_fields = [
            ("Yelka uzunligi", "shoulder_length"),
            ("Yelka kengligi", "shoulder_breadth"),
            ("Yelka aylanasi", "shoulder_circumference"),
            ("Bilak/tirsak uzunligi", "arm_elbow_length"),
            ("Qo'l panja uzunligi", "hand_length"),
            ("Son uzunligi", "thigh_length"),
            ("Son aylanasi", "thigh_circumference"),
            ("Boldir uzunligi", "calf_length"),
            ("Boldir aylanasi", "calf_circumference"),
            ("Oyoq panja uzunligi", "foot_length"),
        ]
        
        for label, attr in extra_fields:
            val = getattr(data, attr, None)
            if val is not None:
                measurements.append([label, f"{val} sm"])
                
        table = Table(measurements, colWidths=[3 * inch, 3 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3498db")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), font_name),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8f9fa")),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        analysis_results = [
            ["Ko'rsatkich", "Qiymat", "Sharh"],
            ["BMI", f"{analysis['bmi']}", analysis['bmi_category']],
            ["Somatotip", analysis['somatotype'], ""],
            ["Ideal vazn", f"{analysis['ideal_weight']} kg", ""],
            ["Farq", f"{analysis['weight_diff']} kg", ""]
        ]
        table2 = Table(analysis_results, colWidths=[2.5 * inch, 1.5 * inch, 2 * inch])
        table2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2ecc71")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), font_name),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#e8f5e9")),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        elements.append(table2)
        elements.append(Spacer(1, 20))

        elements.append(Paragraph("<b>Shaxsiy Maslahatlar:</b>", styles['Heading2']))
        for key, advice_text in advices.items():
            elements.append(Paragraph(f"<b>{key.capitalize()}:</b> {advice_text}", styles['Normal']))
            elements.append(Spacer(1, 10))

        date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Hisobot sanasi: {date_str}", styles['Normal']))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("_________________________", styles['Normal']))
        elements.append(Paragraph("Shifokor imzosi", styles['Normal']))

        doc.build(elements)

        buffer.seek(0)
        return StreamingResponse(buffer, media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=morphocheck_report.pdf"
        })

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Shrift fayli topilmadi")
    except Exception as e:
        logger.error(f"PDF yaratishda xatolik: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF yaratishda xatolik: {str(e)}")
