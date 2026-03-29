# morphocheck_backend/routers/analyze_router.py
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Tuple
from io import BytesIO
import datetime
import os
import logging

from reportlab.lib.units import inch
from services.pdf_services import generate_pdf_report as generate_pdf_file

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

from models.userdata import PatientAnalysis
from models.user import User
from routers.auth_router import get_current_admin
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
    body_length: Optional[float] = Field(None, alias="bodyLength")
    
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
        from utils.translit import lat2cyr
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
    # counts based on Prefix-ID
    count = db.query(PatientAnalysis).filter(PatientAnalysis.id_code.like(f"{prefix}-%")).count()
    
    return f"{prefix}-{count + 1:05d}"



def calculate_bmi(data: PatientData, lang: str = "uz") -> dict:
    """Хисоблашлар ва диагноз (Z-score билан)."""
    age = int(data.age)
    gender = (data.gender or "").lower()
    height = float(data.height)
    weight = float(data.weight)
    
    h2 = (height / 100.0) ** 2
    if h2 <= 0:
        raise ValueError("Некорректное значение роста.")
    bmi = round(weight / h2, 1)

    # Используем улучшенные расчеты из indices_service
    manual_bio = {
        "total_body_water": data.total_body_water,
        "fat_percent": data.fat_percent,
        "fat_mass": data.fat_mass,
        "muscle_mass": data.muscle_mass,
        "bone_mass": data.bone_mass,
        "acm": data.acm,
        "visceral_fat": data.visceral_fat,
        "body_length": data.body_length
    }
    
    detailed = calculate_detailed_indices(age, gender, height, weight, bmi, manual_bio, lang=lang)
    
    # Категория ИМТ на основе Z-score (для детей) или стандартов ВОЗ (для взрослых)
    z_bmi = detailed.get("z_bmi", 0)
    if age < 19:
        if z_bmi < -2: bmi_category = _get_bmi_cat("v_low", lang)
        elif z_bmi < -1: bmi_category = _get_bmi_cat("low", lang)
        elif z_bmi <= 1: bmi_category = _get_bmi_cat("normal", lang)
        elif z_bmi <= 2: bmi_category = _get_bmi_cat("overweight", lang)
        else: bmi_category = _get_bmi_cat("obese", lang)
    else:
        if bmi < 18.5: bmi_category = _get_bmi_cat("low", lang)
        elif bmi < 25: bmi_category = _get_bmi_cat("normal", lang)
        elif bmi < 30: bmi_category = _get_bmi_cat("overweight", lang)
        else: bmi_category = _get_bmi_cat("obese", lang)

    ideal_weight = get_ideal_weight_by_age_and_gender(age, height, gender)
    bmi_rng = get_bmi_range_by_age_and_gender(age, gender)
    min_w = round(bmi_rng["min"] * h2, 1)
    max_w = round(bmi_rng["max"] * h2, 1)

    return {
        "bmi": bmi,
        "ideal_weight": ideal_weight,
        "ideal_weight_range": {"min": min_w, "max": max_w},
        "weight_diff": round(weight - ideal_weight, 1),
        "z_score": z_bmi,
        "somatotype": detailed.get("morphological_type", "normostenik"),
        "bmi_category": bmi_category,
        "shoulder_ratio": round((float(data.shoulder_breadth or 0) / height) * 100, 1) if height > 0 else 0,
        "thigh_ratio": round((float(data.thigh_circumference or 0) / height) * 100, 1) if height > 0 else 0,
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


# ─────────────────────────────────────────────
# BMI Kategoriyalar Lug'ati
# ─────────────────────────────────────────────
_BMI_CAT_I18N = {
    "v_low": {
        "uz": "Vazn yetishmovchiligi (yaqqol)",
        "ru": "Выраженный дефицит массы",
        "en": "Severe underweight",
        "kz": "Айқын салмақ тапшылығы",
    },
    "low": {
        "uz": "Vazn yetishmovchiligi",
        "ru": "Недостаточная масса тела",
        "en": "Underweight",
        "kz": "Салмақ тапшылығы",
    },
    "normal": {
        "uz": "Me'yor",
        "ru": "Норма",
        "en": "Normal",
        "kz": "Қалыпты",
    },
    "overweight": {
        "uz": "Ortiqcha vazn",
        "ru": "Избыточная масса тела",
        "en": "Overweight",
        "kz": "Артық салмақ",
    },
    "obese": {
        "uz": "Semizlik",
        "ru": "Ожирение",
        "en": "Obesity",
    }
}

BMI_CATEGORIES = _BMI_CAT_I18N

def _get_bmi_cat(key: str, lang: str) -> str:
    return _BMI_CAT_I18N.get(key, {}).get(lang, _BMI_CAT_I18N.get(key, {}).get("uz", key))


# ─────────────────────────────────────────────
# Ko'p tilli maslahat lug'ati (generate_advices)
# ─────────────────────────────────────────────
_ADVICE_I18N = {
    "default_general": {
        "uz": "Sog'lom turmush tarzini davom ettiring.",
        "ru": "Продолжайте вести здоровый образ жизни.",
        "en": "Continue to maintain a healthy lifestyle.",
        "kz": "Салауатты өмір салтын жалғастырыңыз.",
    },
    "default_specialist": {
        "uz": "Doimiy nazorat zarur emas.",
        "ru": "Постоянное наблюдение не требуется.",
        "en": "Constant medical supervision is not required.",
        "kz": "Тұрақты бақылау қажет емес.",
    },
    "default_nutrition": {
        "uz": "Balanslangan ovqatlanish tartibiga rioya qiling.",
        "ru": "Соблюдайте сбалансированный режим питания.",
        "en": "Follow a balanced nutrition regimen.",
        "kz": "Теңдестірілген тамақтану режиміне сүйеніңіз.",
    },
    "default_activity": {
        "uz": "Kunlik jismoniy faollikni saqlab turing.",
        "ru": "Поддерживайте ежедневную физическую активность.",
        "en": "Maintain daily physical activity.",
        "kz": "Күнделікті дене белсенділігін сақтаңыз.",
    },
    "default_checkups": {
        "uz": "Yiliga 1 marta profilaktik tekshiruvdan o'ting.",
        "ru": "Проходите профилактическое обследование 1 раз в год.",
        "en": "Undergo a preventive medical check-up once a year.",
        "kz": "Жылына 1 рет алдын алу тексерісінен өтіңіз.",
    },
    "low_bmi_general": {
        "uz": "Tana vazni yetarli emas (Kam vazn). Diqqat qiling.",
        "ru": "Масса тела недостаточна (дефицит веса). Обратите внимание.",
        "en": "Body weight is insufficient (underweight). Please pay attention.",
        "kz": "Дене салмағы жеткіліксіз (салмақ тапшылығы). Назар аударыңыз.",
    },
    "low_bmi_specialist": {
        "uz": "Pediatr yoki parhezshunos (dietolog) ko'rigi tavsiya etiladi.",
        "ru": "Рекомендуется консультация педиатра или диетолога.",
        "en": "A consultation with a pediatrician or dietitian is recommended.",
        "kz": "Педиатр немесе диетолог кеңесі ұсынылады.",
    },
    "low_bmi_nutrition": {
        "uz": "Energetik qiymati yuqori, oqsil va sog'lom yog'larga boy taomlarni ko'paytiring.",
        "ru": "Увеличьте потребление высококалорийной пищи, богатой белком и полезными жирами.",
        "en": "Increase consumption of high-calorie foods rich in protein and healthy fats.",
        "kz": "Энергетикалық мәні жоғары, ақуыз бен пайдалы майларға бай тамақтарды көбейтіңіз.",
    },
    "low_bmi_activity": {
        "uz": "Yoshga mos ravishda mushak massasini oshiruvchi yengil mashqlar.",
        "ru": "Лёгкие упражнения для увеличения мышечной массы, соответствующие возрасту.",
        "en": "Light exercises to increase muscle mass appropriate for the age.",
        "kz": "Жасқа сәйкес бұлшық ет массасын арттыратын жеңіл жаттығулар.",
    },
    "low_bmi_checkups": {
        "uz": "Har 6 oyda tahlillar topshirib turish tavsiya etiladi.",
        "ru": "Рекомендуется сдавать анализы каждые 6 месяцев.",
        "en": "It is recommended to undergo laboratory tests every 6 months.",
        "kz": "Әр 6 айда сынақтар тапсыру ұсынылады.",
    },
    "high_bmi_general": {
        "uz": "Ortiqcha vazn aniqlandi. Bu kelajakda salomatlikka salbiy ta'sir qilishi mumkin.",
        "ru": "Выявлен избыточный вес. В будущем это может негативно сказаться на здоровье.",
        "en": "Excess weight was identified. This may negatively affect health in the future.",
        "kz": "Артық салмақ анықталды. Бұл болашақта денсаулыққа кері әсер етуі мүмкін.",
    },
    "high_bmi_specialist": {
        "uz": "Endokrinolog va parhezshunos ko'rigidan o'tish maqsadga muvofiq.",
        "ru": "Целесообразно пройти консультацию эндокринолога и диетолога.",
        "en": "It is advisable to consult an endocrinologist and dietitian.",
        "kz": "Эндокринолог пен диетолог кеңесінен өту мақсатқа сай.",
    },
    "high_bmi_nutrition": {
        "uz": "Past kaloriyali, kletchatka (sabzavotlar)ga boy ratsionga o'ting, shirinliklarni cheklang.",
        "ru": "Перейдите на низкокалорийный рацион, богатый клетчаткой (овощи), ограничьте сладкое.",
        "en": "Switch to a low-calorie diet rich in fiber (vegetables), limit sweets.",
        "kz": "Талшыққа (көкөністер) бай, аз калориялы рационға көшіңіз, тәттілерді шектеңіз.",
    },
    "high_bmi_activity": {
        "uz": "Kundalik 40-60 daqiqa faol harakat (yugurish, suzish, sport o'yinlari) zarur.",
        "ru": "Необходимо 40–60 минут активного движения в день (бег, плавание, спортивные игры).",
        "en": "40–60 minutes of active movement per day is necessary (running, swimming, sports games).",
        "kz": "Күнделікті 40-60 минут белсенді қозғалыс (жүгіру, жүзу, спорт ойындары) қажет.",
    },
    "high_bmi_checkups": {
        "uz": "Har 3-6 oyda vazn va metabolik ko'rsatkichlarni tekshirib turing.",
        "ru": "Контролируйте вес и метаболические показатели каждые 3–6 месяцев.",
        "en": "Monitor weight and metabolic indicators every 3–6 months.",
        "kz": "Салмақ пен метаболикалық көрсеткіштерді 3-6 айда бір тексеріп тұрыңыз.",
    },
}


def _ai(key: str, lang: str) -> str:
    """Maslahat lug'atidan matnni oladi."""
    d = _ADVICE_I18N.get(key, {})
    return d.get(lang) or d.get("uz") or key


# Kalit so'zlar til bo'yicha (bio_data advice larini guruhlash uchun)
_KW = {
    "nutrition": {
        "uz": ["shirinlik", "ovqat", "suv", "oqsil", "ratsion", "iste'mol", "parhez", "yog'", "vitamin", "kalori", "sabzavot", "meva", "taom"],
        "ru": ["сладк", "питани", "вод", "белок", "рацион", "потребл", "диет", "жир", "витамин", "калори", "овощ", "фрукт", "пищ"],
        "en": ["sweet", "food", "water", "protein", "diet", "consum", "fat", "vitamin", "calori", "vegetabl", "fruit", "nutri"],
        "kz": ["тәтті", "тамақ", "су", "ақуыз", "рацион", "тұтын", "парhez", "май", "дәрумен", "калори", "көкөніс", "жеміс"],
    },
    "specialist": {
        "uz": ["pediatr", "endokrinolog", "mutaxassis", "ko'rig", "maslahat", "shifokor", "dоktor"],
        "ru": ["педиатр", "эндокринолог", "специалист", "консультац", "врач", "доктор"],
        "en": ["pediatr", "endocrinolog", "specialist", "consult", "doctor", "physician"],
        "kz": ["педиатр", "эндокринолог", "маман", "кеңес", "дәрігер"],
    },
    "activity": {
        "uz": ["mashq", "sport", "faollik", "harakat", "badantarbiya", "jismoniy", "yugurish", "suzish", "gimnastika"],
        "ru": ["упражнен", "спорт", "активност", "движен", "физическ", "бег", "плавани", "гимнастик"],
        "en": ["exercise", "sport", "activit", "movement", "physical", "running", "swimming", "gymnastic"],
        "kz": ["жаттығу", "спорт", "белсенді", "қозғалыс", "дене", "жүгіру", "жүзу"],
    },
    "checkups": {
        "uz": ["tahlil", "tekshiruv", "nazorat"],
        "ru": ["анализ", "обследован", "контрол", "мониторинг"],
        "en": ["test", "check", "monitor", "examination", "lab"],
        "kz": ["талдау", "тексеру", "бақылау"],
    },
}


def generate_advices(bmi: float, weight_diff: float, age: int, gender: str, bio_data: dict = None, lang: str = "uz") -> Dict[str, str]:
    bmi_range = get_bmi_range_by_age_and_gender(age, gender)

    res = {
        "general":    _ai("default_general",    lang),
        "specialist": _ai("default_specialist",  lang),
        "nutrition":  _ai("default_nutrition",   lang),
        "activity":   _ai("default_activity",    lang),
        "checkups":   _ai("default_checkups",    lang),
    }

    # 1. BMI based advice
    if bmi < bmi_range["min"]:
        res["general"]    = _ai("low_bmi_general",    lang)
        res["specialist"] = _ai("low_bmi_specialist", lang)
        res["nutrition"]  = _ai("low_bmi_nutrition",  lang)
        res["activity"]   = _ai("low_bmi_activity",   lang)
        res["checkups"]   = _ai("low_bmi_checkups",   lang)
    elif bmi > bmi_range["max"]:
        res["general"]    = _ai("high_bmi_general",    lang)
        res["specialist"] = _ai("high_bmi_specialist", lang)
        res["nutrition"]  = _ai("high_bmi_nutrition",  lang)
        res["activity"]   = _ai("high_bmi_activity",   lang)
        res["checkups"]   = _ai("high_bmi_checkups",   lang)

    # 2. Bioimpedance and Indices based advice (from bio_data)
    if bio_data:
        raw_advices = bio_data.get("advice", [])
        kw_lang = _KW  # tildagi kalit so'zlar
        defv = {
            "general":    _ai("default_general",   lang),
            "specialist": _ai("default_specialist", lang),
            "nutrition":  _ai("default_nutrition",  lang),
            "activity":   _ai("default_activity",   lang),
            "checkups":   _ai("default_checkups",   lang),
        }

        for adv in raw_advices:
            adv_l = adv.lower()
            assigned = False
            for cat in ["nutrition", "specialist", "activity", "checkups"]:
                kws = kw_lang[cat].get(lang, kw_lang[cat]["uz"])
                if any(k in adv_l for k in kws):
                    if res[cat] == defv[cat]:
                        res[cat] = adv
                    else:
                        res[cat] += " " + adv
                    assigned = True
                    break
            if not assigned:
                if res["general"] == defv["general"]:
                    res["general"] = adv
                else:
                    res["general"] += " " + adv

    return res




# ---------------------------
# Endpointlar
# ---------------------------

@router.post("/", tags=["Tahlil"])
def analyze_and_store_raw(
    data: Dict[str, Any], 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Oddiy saqlash: kelgan 'data' ni to'g'ridan-to'g'ri PatientAnalysis ga yozadi.
    (Kalit nomlari model bilan 1:1 mos bo'lishi shart.)
    """
    try:
        rec = PatientAnalysis(**data)
        rec.created_by_id = current_user.id
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return {"message": "Ma'lumotlar saqlandi", "user_id": rec.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Saqlash xatosi: {e}")


@router.post("/full", response_model=Dict[str, Any], tags=["Tahlil"])
def analyze_full(
    data: PatientData, 
    lang: str = Query(default="uz", description="Til: uz, ru, en, kz"), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    To'liq tahlil: hisob-kitob + maslahatlar + DBga saqlash.
    Frontend hozir aynan shu endpointga urmoqda.
    """
    try:
        # 1) Tahlil
        gender_norm = (data.gender or "").strip().lower()
        analysis = calculate_bmi(data, lang=lang)
        advices  = generate_advices(
            analysis["bmi"],
            analysis["weight_diff"],
            int(data.age),
            gender_norm,
            bio_data=analysis["indices"],
            lang=lang
        )
        clean_region, clean_district = _split_region_and_district(data.region, getattr(data, "district", None))

        # 2) DBga saqlash
        id_code = generate_region_based_id(db, clean_region)
        full_name = f"{data.first_name} {data.last_name}".strip()
        rec = PatientAnalysis(
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
            body_length=data.body_length,
            
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
            ),
            created_by_id=current_user.id
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
def generate_pdf_report_endpoint(data: PatientData, lang: str = Query(default="uz", description="Til: uz, ru, en, kz")):
    """
    Generatsiya PDF otchyota na osnove vvedyonnykh dannykh.
    lang parametri orqali til tanlash mumkin: uz, ru, en, kz
    """
    try:
        analysis = calculate_bmi(data)
        full_report_data = data.dict(by_alias=True)
        full_report_data["analysis"] = analysis
        pdf_buffer = generate_pdf_file(full_report_data, lang=lang)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{data.first_name}_{lang}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"PDF yaratishda xatolik: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF yaratishda xatolik: {str(e)}")


@router.get("/pdf-by-id/{patient_id}", tags=["PDF Hisobot"])
def generate_pdf_by_patient_id(
    patient_id: int,
    lang: str = Query(default="uz", description="Til: uz, ru, en, kz"),
    db: Session = Depends(get_db)
):
    """
    Admin panel uchun: DB dagi bemor ID si bo'yicha PDF hisobotini qaytaradi.
    """
    rec = db.query(PatientAnalysis).filter(PatientAnalysis.id == patient_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Bemor topilmadi: id={patient_id}")

    try:
        # Ma'lumotlarni olish
        name_parts = (rec.name or "").split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # BMI hisoblash uchun mini-data
        from pydantic import BaseModel as BM
        class _Mini(BM):
            age: int = 0
            gender: str = ""
            height: float = 0.0
            weight: float = 0.0
            chest: float = 0.0
            waist: float = 0.0
            head: float = 0.0
            shoulder_length: float = 0.0
            shoulder_breadth: float = 0.0
            shoulder_circumference: float = 0.0
            arm_elbow_length: float = 0.0
            hand_length: float = 0.0
            thigh_length: float = 0.0
            thigh_circumference: float = 0.0
            calf_length: float = 0.0
            calf_circumference: float = 0.0
            foot_length: float = 0.0
            body_length: float = None
            total_body_water: float = None
            fat_percent: float = None
            fat_mass: float = None
            muscle_mass: float = None
            bone_mass: float = None
            acm: float = None
            visceral_fat: float = None

        mini = _Mini(
            age=rec.age or 0,
            gender=rec.gender or "",
            height=rec.height or 0,
            weight=rec.weight or 0,
            chest=rec.chest or 0,
            waist=rec.waist or 0,
            head=rec.head or 0,
            shoulder_length=rec.shoulder_length or 0,
            shoulder_breadth=rec.shoulder_breadth or 0,
            shoulder_circumference=rec.shoulder_circumference or 0,
            arm_elbow_length=rec.arm_elbow_length or 0,
            hand_length=rec.hand_length or 0,
            thigh_length=rec.thigh_length or 0,
            thigh_circumference=rec.thigh_circumference or 0,
            calf_length=rec.calf_length or 0,
            calf_circumference=rec.calf_circumference or 0,
            foot_length=rec.foot_length or 0,
            body_length=rec.body_length,
            total_body_water=rec.total_body_water,
            fat_percent=rec.fat_percent,
            fat_mass=rec.fat_mass,
            muscle_mass=rec.muscle_mass,
            bone_mass=rec.bone_mass,
            acm=rec.acm,
            visceral_fat=rec.visceral_fat,
        )

        from services.indices_service import calculate_detailed_indices
        h2 = (mini.height / 100.0) ** 2 if mini.height > 0 else 1
        bmi_val = round(mini.weight / h2, 1) if h2 > 0 else 0
        manual_bio = {"body_length": mini.body_length, "total_body_water": mini.total_body_water,
                      "fat_percent": mini.fat_percent, "fat_mass": mini.fat_mass,
                      "muscle_mass": mini.muscle_mass, "bone_mass": mini.bone_mass,
                      "acm": mini.acm, "visceral_fat": mini.visceral_fat}
        detailed = calculate_detailed_indices(mini.age, mini.gender, mini.height, mini.weight, bmi_val, manual_bio)

        ideal_range = get_bmi_range_by_age_and_gender(mini.age, mini.gender)
        min_w = round(ideal_range["min"] * h2, 1)
        max_w = round(ideal_range["max"] * h2, 1)
        ideal_w = get_ideal_weight_by_age_and_gender(mini.age, mini.height, mini.gender)

        analysis = {
            "bmi": bmi_val,
            "bmi_category": rec.somatotype or "",
            "somatotype": detailed.get("morphological_type", rec.somatotype or ""),
            "ideal_weight": ideal_w,
            "ideal_weight_range": {"min": min_w, "max": max_w},
            "weight_diff": round(mini.weight - ideal_w, 1),
            "z_score": rec.z_score or 0,
            "shoulder_ratio": round((mini.shoulder_breadth / mini.height) * 100, 1) if mini.height > 0 and mini.shoulder_breadth else 0,
            "thigh_ratio": round((mini.thigh_circumference / mini.height) * 100, 1) if mini.height > 0 and mini.thigh_circumference else 0,
            "indices": detailed,
        }

        report_data = {
            "first_name": first_name,
            "last_name": last_name,
            "age": rec.age or 0,
            "age_months": rec.age_months or 0,
            "age_days": rec.age_days or 0,
            "gender": rec.gender or "",
            "birth_date": rec.birth_date or "",
            "examination_date": rec.examination_date or "",
            "preschool_institution": rec.preschool_institution or "",
            "region": rec.region or "",
            "district": rec.district or "",
            "address": rec.address or "",
            "analysis": analysis,
        }

        pdf_buffer = generate_pdf_file(report_data, lang=lang)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=morphocheck_{patient_id}_{lang}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"PDF by ID yaratishda xatolik: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF yaratishda xatolik: {str(e)}")
