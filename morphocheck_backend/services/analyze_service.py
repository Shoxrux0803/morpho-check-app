# morphocheck_backend/services/analyze_service.py
import datetime
import logging
import os
from typing import Any, Dict, Optional, Tuple

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy.orm import Session

from models.schemas import PatientData
from models.userdata import PatientAnalysis
from services.indices_service import calculate_detailed_indices

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
    # Hozircha sodda diapazon РІР‚вЂќ yoshga mos biroz siljigan
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

    # 3РІР‚вЂњ18 yosh oralig'i uchun WHO ga yaqin mos jadval
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

    # Kattalar uchun РІР‚вЂњ BMI diapazoniga asoslangan ideal vazn
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
        "FargРІР‚Вona": "FAR",
        "Farg'ona": "FAR",
        "Namangan": "NAM",
        "Samarqand": "SAM",
        "Buxoro": "BUX",
        "Xorazm": "XOR",
        "QoraqalpogРІР‚Вiston": "QR",
        "Qoraqalpog'iston": "QR",
        "Jizzax": "JIZ",
        "Sirdaryo": "SIR",
        "Surxondaryo": "SUR",
        "Qashqadaryo": "QAS",
        "Navoiy": "NAV",
        # Kirill
        "Р СћР С•РЎв‚¬Р С”Р ВµР Р…РЎвЂљ РЎв‚¬Р В°РўС–РЎР‚Р С‘": "TS",
        "Р СћР С•РЎв‚¬Р С”Р ВµР Р…РЎвЂљ Р Р†Р С‘Р В»Р С•РЎРЏРЎвЂљР С‘": "TV",
        "Р С’Р Р…Р Т‘Р С‘Р В¶Р С•Р Р…": "AND",
        "Р В¤Р В°РЎР‚РўвЂњР С•Р Р…Р В°": "FAR",
        "Р СњР В°Р СР В°Р Р…Р С–Р В°Р Р…": "NAM",
        "Р РЋР В°Р СР В°РЎР‚РўвЂєР В°Р Р…Р Т‘": "SAM",
        "Р вЂРЎС“РЎвЂ¦Р С•РЎР‚Р С•": "BUX",
        "Р ТђР С•РЎР‚Р В°Р В·Р С": "XOR",
        "РўС™Р С•РЎР‚Р В°РўвЂєР В°Р В»Р С—Р С•РўвЂњР С‘РЎРѓРЎвЂљР С•Р Р…": "QR",
        "Р вЂ“Р С‘Р В·Р В·Р В°РЎвЂ¦": "JIZ",
        "Р РЋР С‘РЎР‚Р Т‘Р В°РЎР‚РЎвЂ": "SIR",
        "Р РЋРЎС“РЎР‚РЎвЂ¦Р С•Р Р…Р Т‘Р В°РЎР‚РЎвЂ": "SUR",
        "РўС™Р В°РЎв‚¬РўвЂєР В°Р Т‘Р В°РЎР‚РЎвЂ": "QAS",
        "Р СњР В°Р Р†Р С•Р С‘Р в„–": "NAV"
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



def calculate_bmi(data: PatientData, all_settings: Dict[str, Any], lang: str = "uz") -> dict:
    """Р ТђР С‘РЎРѓР С•Р В±Р В»Р В°РЎв‚¬Р В»Р В°РЎР‚ Р Р†Р В° Р Т‘Р С‘Р В°Р С–Р Р…Р С•Р В· (Z-score Р В±Р С‘Р В»Р В°Р Р…)."""
    age = int(data.age)
    gender = (data.gender or "").lower()
    height = float(data.height)
    weight = float(data.weight)

    h2 = (height / 100.0) ** 2
    if h2 <= 0:
        raise ValueError("Р СњР ВµР С”Р С•РЎР‚РЎР‚Р ВµР С”РЎвЂљР Р…Р С•Р Вµ Р В·Р Р…Р В°РЎвЂЎР ВµР Р…Р С‘Р Вµ РЎР‚Р С•РЎРѓРЎвЂљР В°.")
    bmi = round(weight / h2, 1)

    # Р ВРЎРѓР С—Р С•Р В»РЎРЉР В·РЎС“Р ВµР С РЎС“Р В»РЎС“РЎвЂЎРЎв‚¬Р ВµР Р…Р Р…РЎвЂ№Р Вµ РЎР‚Р В°РЎРѓРЎвЂЎР ВµРЎвЂљРЎвЂ№ Р С‘Р В· indices_service
    manual_bio = {
        "total_body_water": data.total_body_water,
        "fat_percent": data.fat_percent,
        "fat_mass": data.fat_mass,
        "muscle_mass": data.muscle_mass,
        "bone_mass": data.bone_mass,
        "acm": data.acm,
        "visceral_fat": data.visceral_fat,
        "body_length": data.body_length,
        "chest": data.chest,
        "region": data.region,
        "district": data.district,
        "mahalla": data.mahalla,
        "address": data.address
    }

    detailed = calculate_detailed_indices(age, gender, height, weight, bmi, manual_bio, lang=lang, all_settings=all_settings)

    # Р С™Р В°РЎвЂљР ВµР С–Р С•РЎР‚Р С‘РЎРЏ Р ВР СљР Сћ Р Р…Р В° Р С•РЎРѓР Р…Р С•Р Р†Р Вµ Z-score (Р Т‘Р В»РЎРЏ Р Т‘Р ВµРЎвЂљР ВµР в„–) Р С‘Р В»Р С‘ РЎРѓРЎвЂљР В°Р Р…Р Т‘Р В°РЎР‚РЎвЂљР С•Р Р† Р вЂ™Р С›Р вЂ” (Р Т‘Р В»РЎРЏ Р Р†Р В·РЎР‚Р С•РЎРѓР В»РЎвЂ№РЎвЂ¦)
    z_bmi = detailed.get("z_bmi", 0)
    if age < 19:
        if z_bmi < -2: bmi_category = _get_bmi_cat("v_low", lang, all_settings)
        elif z_bmi < -1: bmi_category = _get_bmi_cat("low", lang, all_settings)
        elif z_bmi <= 1: bmi_category = _get_bmi_cat("normal", lang, all_settings)
        elif z_bmi <= 2: bmi_category = _get_bmi_cat("overweight", lang, all_settings)
        else: bmi_category = _get_bmi_cat("obese", lang, all_settings)
    else:
        if bmi < 18.5: bmi_category = _get_bmi_cat("low", lang, all_settings)
        elif bmi < 25: bmi_category = _get_bmi_cat("normal", lang, all_settings)
        elif bmi < 30: bmi_category = _get_bmi_cat("overweight", lang, all_settings)
        else: bmi_category = _get_bmi_cat("obese", lang, all_settings)

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


def _z_to_percentile(z: Optional[float]) -> Optional[int]:
    if z is None:
        return None
    # Abramowitz-Stegun approximation through math.erf.
    import math
    return int(round(0.5 * (1 + math.erf(float(z) / math.sqrt(2))) * 100))


def _risk_from_z(z: Optional[float]) -> Dict[str, str]:
    if z is None:
        return {
            "level": "unknown",
            "color": "gray",
            "label": "Ma'lumot yetarli emas",
            "message": "Ko'rsatkichni baholash uchun norma ma'lumoti topilmadi.",
        }

    abs_z = abs(float(z))
    if abs_z >= 3:
        return {
            "level": "red",
            "color": "red",
            "label": "Tezkor shifokor ko'rigi kerak",
            "message": "Ko'rsatkich me'yordan keskin chetlangan. Pediatr ko'rigi tavsiya etiladi.",
        }
    if abs_z >= 2:
        return {
            "level": "red",
            "color": "red",
            "label": "Shifokor nazorati kerak",
            "message": "Ko'rsatkich xavf zonasida. Klinik baholash va qayta tekshiruv zarur.",
        }
    if abs_z >= 1:
        return {
            "level": "yellow",
            "color": "yellow",
            "label": "Kuzatuv yetarli",
            "message": "Ko'rsatkich chegaraviy zonada. Dinamik kuzatuv tavsiya etiladi.",
        }
    return {
        "level": "green",
        "color": "green",
        "label": "Normada",
        "message": "Ko'rsatkich yosh va jinsga mos me'yor diapazonida.",
    }


def build_growth_standards(data: PatientData, analysis: Dict[str, Any]) -> Dict[str, Any]:
    indices = analysis.get("indices", {}) or {}
    bmi = analysis.get("bmi")
    height = float(data.height)
    weight = float(data.weight)
    chest = float(data.chest)
    head = float(data.head)

    # Head/chest standards are practical local screening approximations.
    head_expected = min(56.0, 46.5 + min(int(data.age), 18) * 0.45)
    head_sd = 1.8 if int(data.age) < 7 else 2.2
    chest_expected = height * (0.50 if int(data.age) < 12 else 0.52)
    chest_sd = max(2.5, chest_expected * 0.08)

    metrics = {
        "height": {"label": "Bo'y", "value": height, "unit": "sm", "z_score": indices.get("z_h")},
        "weight": {"label": "Vazn", "value": weight, "unit": "kg", "z_score": indices.get("z_w")},
        "bmi": {"label": "BMI", "value": bmi, "unit": "", "z_score": indices.get("z_bmi")},
        "head": {
            "label": "Bosh aylanasi",
            "value": head,
            "unit": "sm",
            "z_score": round((head - head_expected) / head_sd, 2) if head_sd else None,
        },
        "chest": {
            "label": "Ko'krak aylanasi",
            "value": chest,
            "unit": "sm",
            "z_score": round((chest - chest_expected) / chest_sd, 2) if chest_sd else None,
        },
    }

    for metric in metrics.values():
        metric["percentile"] = _z_to_percentile(metric.get("z_score"))
        metric["risk"] = _risk_from_z(metric.get("z_score"))

    worst_rank = {"unknown": 0, "green": 1, "yellow": 2, "red": 3}
    worst = max(metrics.values(), key=lambda item: worst_rank.get(item["risk"]["level"], 0))
    return {
        "source": "WHO LMS + mahalliy skrining diapazonlari",
        "metrics": metrics,
        "summary": worst["risk"],
    }


def build_progress_tracking(db: Session, rec: PatientAnalysis, full_name: str) -> Dict[str, Any]:
    query = db.query(PatientAnalysis).filter(
        PatientAnalysis.id != rec.id,
        PatientAnalysis.is_deleted == 0,
        PatientAnalysis.name == full_name,
    )
    if rec.birth_date:
        query = query.filter(PatientAnalysis.birth_date == rec.birth_date)
    if rec.gender:
        query = query.filter(PatientAnalysis.gender == rec.gender)

    previous = query.order_by(PatientAnalysis.created_at.desc(), PatientAnalysis.id.desc()).first()
    if not previous:
        return {
            "has_history": False,
            "message": "Bu bola uchun oldingi o'lchov topilmadi.",
            "history": [],
            "changes": {},
        }

    def _days_between(current: str, old: str) -> Optional[int]:
        try:
            c = datetime.date.fromisoformat((current or "")[:10])
            p = datetime.date.fromisoformat((old or "")[:10])
            return max((c - p).days, 0)
        except Exception:
            return None

    days = _days_between(rec.examination_date, previous.examination_date)
    months = round(days / 30.44, 1) if days is not None else None

    def _change(field: str, unit: str) -> Dict[str, Any]:
        current = getattr(rec, field, None)
        old = getattr(previous, field, None)
        delta = round(float(current or 0) - float(old or 0), 1)
        monthly = round(delta / months, 2) if months and months > 0 else None
        return {"current": current, "previous": old, "delta": delta, "monthly_delta": monthly, "unit": unit}

    changes = {
        "height": _change("height", "sm"),
        "weight": _change("weight", "kg"),
        "bmi": _change("bmi", ""),
        "head": _change("head", "sm"),
        "chest": _change("chest", "sm"),
    }

    height_monthly = changes["height"]["monthly_delta"]
    if months is not None and height_monthly is not None and months >= 2 and height_monthly < 0.25:
        trend = "Bo'y o'sishi sekinlashgan, qayta nazorat tavsiya etiladi."
        trend_level = "yellow"
    elif changes["weight"]["delta"] < -1:
        trend = "Vazn kamaygan, ovqatlanish va klinik holatni baholash kerak."
        trend_level = "yellow"
    else:
        trend = "O'sish dinamikasi kuzatuv uchun yetarli ma'lumot beradi."
        trend_level = "green"

    return {
        "has_history": True,
        "previous_id": previous.id,
        "period_days": days,
        "period_months": months,
        "trend": trend,
        "trend_level": trend_level,
        "changes": changes,
        "history": [
            {
                "id": previous.id,
                "date": previous.examination_date,
                "height": previous.height,
                "weight": previous.weight,
                "bmi": previous.bmi,
                "head": previous.head,
                "chest": previous.chest,
            },
            {
                "id": rec.id,
                "date": rec.examination_date,
                "height": rec.height,
                "weight": rec.weight,
                "bmi": rec.bmi,
                "head": rec.head,
                "chest": rec.chest,
            },
        ],
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


# РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
# BMI Kategoriyalar Lug'ati
# РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
_BMI_CAT_I18N = {
    "v_low": {
        "uz": "Vazn yetishmovchiligi (yaqqol)",
        "ru": "Р вЂ™РЎвЂ№РЎР‚Р В°Р В¶Р ВµР Р…Р Р…РЎвЂ№Р в„– Р Т‘Р ВµРЎвЂћР С‘РЎвЂ Р С‘РЎвЂљ Р СР В°РЎРѓРЎРѓРЎвЂ№",
        "en": "Severe underweight",
        "kz": "Р С’Р в„–РўвЂєРЎвЂ№Р Р… РЎРѓР В°Р В»Р СР В°РўвЂє РЎвЂљР В°Р С—РЎв‚¬РЎвЂ№Р В»РЎвЂ№РўвЂњРЎвЂ№",
    },
    "low": {
        "uz": "Vazn yetishmovchiligi",
        "ru": "Р СњР ВµР Т‘Р С•РЎРѓРЎвЂљР В°РЎвЂљР С•РЎвЂЎР Р…Р В°РЎРЏ Р СР В°РЎРѓРЎРѓР В° РЎвЂљР ВµР В»Р В°",
        "en": "Underweight",
        "kz": "Р РЋР В°Р В»Р СР В°РўвЂє РЎвЂљР В°Р С—РЎв‚¬РЎвЂ№Р В»РЎвЂ№РўвЂњРЎвЂ№",
    },
    "normal": {
        "uz": "Me'yor",
        "ru": "Р СњР С•РЎР‚Р СР В°",
        "en": "Normal",
        "kz": "РўС™Р В°Р В»РЎвЂ№Р С—РЎвЂљРЎвЂ№",
    },
    "overweight": {
        "uz": "Ortiqcha vazn",
        "ru": "Р ВР В·Р В±РЎвЂ№РЎвЂљР С•РЎвЂЎР Р…Р В°РЎРЏ Р СР В°РЎРѓРЎРѓР В° РЎвЂљР ВµР В»Р В°",
        "en": "Overweight",
        "kz": "Р С’РЎР‚РЎвЂљРЎвЂ№РўвЂє РЎРѓР В°Р В»Р СР В°РўвЂє",
    },
    "obese": {
        "uz": "Semizlik",
        "ru": "Р С›Р В¶Р С‘РЎР‚Р ВµР Р…Р С‘Р Вµ",
        "en": "Obesity",
        "kz": "Р РЋР ВµР СРЎвЂ“Р В·Р Т‘РЎвЂ“Р С”",
    }
}

BMI_CATEGORIES = _BMI_CAT_I18N

def _get_bmi_cat(key: str, lang: str, all_settings: Dict[str, Any]) -> str:
    # Key: 'bmi_cat_normal', 'bmi_cat_low', etc.
    setting_key = f"bmi_cat_{key}"
    val = all_settings.get(setting_key, {})
    if val and isinstance(val, dict):
        result = val.get(lang, val.get("uz", ""))
        if result:
            return result
    # Fallback to built-in translations
    built_in = _BMI_CAT_I18N.get(key, {})
    return built_in.get(lang, built_in.get("uz", key))


# РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
# Ko'p tilli maslahat lug'ati (generate_advices)
# РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚РІвЂќР‚
_ADVICE_I18N = {
    "default_general": {
        "uz": "Sizning jismoniy rivojlanishingiz me'yorida. Salomatlikni saqlashda davom eting.",
        "ru": "Р вЂ™Р В°РЎв‚¬Р Вµ РЎвЂћР С‘Р В·Р С‘РЎвЂЎР ВµРЎРѓР С”Р С•Р Вµ РЎР‚Р В°Р В·Р Р†Р С‘РЎвЂљР С‘Р Вµ Р Р† Р Р…Р С•РЎР‚Р СР Вµ. Р СџРЎР‚Р С•Р Т‘Р С•Р В»Р В¶Р В°Р в„–РЎвЂљР Вµ Р С—Р С•Р Т‘Р Т‘Р ВµРЎР‚Р В¶Р С‘Р Р†Р В°РЎвЂљРЎРЉ Р В·Р Т‘Р С•РЎР‚Р С•Р Р†РЎРЉР Вµ.",
        "en": "Your physical development is normal. Continue to maintain your health.",
        "kz": "Р РЋРЎвЂ“Р В·Р Т‘РЎвЂ“РўР€ РЎвЂћР С‘Р В·Р С‘Р С”Р В°Р В»РЎвЂ№РўвЂє Р Т‘Р В°Р СРЎС“РЎвЂ№РўР€РЎвЂ№Р В· РўвЂєР В°Р В»РЎвЂ№Р С—РЎвЂљРЎвЂ№. Р вЂќР ВµР Р…РЎРѓР В°РЎС“Р В»РЎвЂ№РўвЂњРЎвЂ№РўР€РЎвЂ№Р В·Р Т‘РЎвЂ№ РЎРѓР В°РўвЂєРЎвЂљР В°РЎС“Р Т‘РЎвЂ№ Р В¶Р В°Р В»РўвЂњР В°РЎРѓРЎвЂљРЎвЂ№РЎР‚РЎвЂ№РўР€РЎвЂ№Р В·."
    },
    "default_specialist": {
        "uz": "Doimiy nazorat zarur emas. Yillik tibbiy ko'rikdan o'tib turing.",
        "ru": "Р СџР С•РЎРѓРЎвЂљР С•РЎРЏР Р…Р Р…Р С•Р Вµ Р Р…Р В°Р В±Р В»РЎР‹Р Т‘Р ВµР Р…Р С‘Р Вµ Р Р…Р Вµ РЎвЂљРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ. Р СџРЎР‚Р С•РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљР Вµ Р ВµР В¶Р ВµР С–Р С•Р Т‘Р Р…РЎвЂ№Р в„– Р СР ВµР Т‘Р С•РЎРѓР СР С•РЎвЂљРЎР‚.",
        "en": "No constant supervision required. Undergo an annual medical check-up.",
        "kz": "Р СћРўВ±РЎР‚Р В°РўвЂєРЎвЂљРЎвЂ№ Р В±Р В°РўвЂєРЎвЂ№Р В»Р В°РЎС“ РўвЂєР В°Р В¶Р ВµРЎвЂљ Р ВµР СР ВµРЎРѓ. Р вЂ“РЎвЂ№Р В» РЎРѓР В°Р в„–РЎвЂ№Р Р…РўвЂњРЎвЂ№ Р СР ВµР Т‘Р С‘РЎвЂ Р С‘Р Р…Р В°Р В»РЎвЂ№РўвЂє РЎвЂљР ВµР С”РЎРѓР ВµРЎР‚РЎС“Р Т‘Р ВµР Р… РЈВ©РЎвЂљРЎвЂ“РўР€РЎвЂ“Р В·."
    },
    "default_nutrition": {
        "uz": "Sog'lom va muvozanatli ovqatlanish tartibiga rioya qiling.",
        "ru": "Р РЋР С•Р В±Р В»РЎР‹Р Т‘Р В°Р в„–РЎвЂљР Вµ Р В·Р Т‘Р С•РЎР‚Р С•Р Р†Р С•Р Вµ Р С‘ РЎРѓР В±Р В°Р В»Р В°Р Р…РЎРѓР С‘РЎР‚Р С•Р Р†Р В°Р Р…Р Р…Р С•Р Вµ Р С—Р С‘РЎвЂљР В°Р Р…Р С‘Р Вµ.",
        "en": "Follow a healthy and balanced diet.",
        "kz": "Р РЋР В°Р В»Р В°РЎС“Р В°РЎвЂљРЎвЂљРЎвЂ№ Р В¶РЈв„ўР Р…Р Вµ РЎвЂљР ВµРўР€Р С–Р ВµРЎР‚РЎвЂ“Р СР Т‘РЎвЂ“ РЎвЂљР В°Р СР В°РўвЂєРЎвЂљР В°Р Р…РЎС“ РЎР‚Р ВµР В¶Р С‘Р СРЎвЂ“Р Р… РЎРѓР В°РўвЂєРЎвЂљР В°РўР€РЎвЂ№Р В·."
    },
    "default_activity": {
        "uz": "Yoshga mos ravishda kundalik jismoniy faollikni ta'minlang.",
        "ru": "Р С›Р В±Р ВµРЎРѓР С—Р ВµРЎвЂЎРЎРЉРЎвЂљР Вµ Р ВµР В¶Р ВµР Т‘Р Р…Р ВµР Р†Р Р…РЎС“РЎР‹ РЎвЂћР С‘Р В·Р С‘РЎвЂЎР ВµРЎРѓР С”РЎС“РЎР‹ Р В°Р С”РЎвЂљР С‘Р Р†Р Р…Р С•РЎРѓРЎвЂљРЎРЉ Р Р† РЎРѓР С•Р С•РЎвЂљР Р†Р ВµРЎвЂљРЎРѓРЎвЂљР Р†Р С‘Р С‘ РЎРѓ Р Р†Р С•Р В·РЎР‚Р В°РЎРѓРЎвЂљР С•Р С.",
        "en": "Ensure daily physical activity appropriate for age.",
        "kz": "Р вЂ“Р В°РЎРѓРЎвЂ№Р Р…Р В° РЎРѓРЈв„ўР в„–Р С”Р ВµРЎРѓ Р С”РўР‡Р Р…Р Т‘Р ВµР В»РЎвЂ“Р С”РЎвЂљРЎвЂ“ РЎвЂћР С‘Р В·Р С‘Р С”Р В°Р В»РЎвЂ№РўвЂє Р В±Р ВµР В»РЎРѓР ВµР Р…Р Т‘РЎвЂ“Р В»РЎвЂ“Р С”РЎвЂљРЎвЂ“ РўвЂєР В°Р СРЎвЂљР В°Р СР В°РЎРѓРЎвЂ№Р В· Р ВµРЎвЂљРЎвЂ“РўР€РЎвЂ“Р В·."
    },
    "default_checkups": {
        "uz": "Rejali profilaktik ko'riklar yetarli.",
        "ru": "Р вЂќР С•РЎРѓРЎвЂљР В°РЎвЂљР С•РЎвЂЎР Р…Р С• Р С—Р В»Р В°Р Р…Р С•Р Р†РЎвЂ№РЎвЂ¦ Р С—РЎР‚Р С•РЎвЂћР С‘Р В»Р В°Р С”РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘РЎвЂ¦ Р С•РЎРѓР СР С•РЎвЂљРЎР‚Р С•Р Р†.",
        "en": "Routine preventive check-ups are sufficient.",
        "kz": "Р вЂ“Р С•РЎРѓР С—Р В°РЎР‚Р В»РЎвЂ№ Р С—РЎР‚Р С•РЎвЂћР С‘Р В»Р В°Р С”РЎвЂљР С‘Р С”Р В°Р В»РЎвЂ№РўвЂє РЎвЂљР ВµР С”РЎРѓР ВµРЎР‚РЎС“Р В»Р ВµРЎР‚ Р В¶Р ВµРЎвЂљР С”РЎвЂ“Р В»РЎвЂ“Р С”РЎвЂљРЎвЂ“."
    },

    # Low BMI (Underweight)
    "low_bmi_general": {
        "uz": "Tana vazni yetishmasligi (vazn tanqisligi) aniqlandi. Diqqat qaratish lozim.",
        "ru": "Р вЂ™РЎвЂ№РЎРЏР Р†Р В»Р ВµР Р… Р Т‘Р ВµРЎвЂћР С‘РЎвЂ Р С‘РЎвЂљ Р СР В°РЎРѓРЎРѓРЎвЂ№ РЎвЂљР ВµР В»Р В°. Р СћРЎР‚Р ВµР В±РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ Р Р†Р Р…Р С‘Р СР В°Р Р…Р С‘Р Вµ Р С” Р В·Р Т‘Р С•РЎР‚Р С•Р Р†РЎРЉРЎР‹.",
        "en": "Underweight (weight deficiency) identified. Attention is required.",
        "kz": "Р РЋР В°Р В»Р СР В°РўвЂє Р В¶Р ВµРЎвЂљРЎвЂ“РЎРѓР С—Р ВµРЎС“РЎв‚¬РЎвЂ“Р В»РЎвЂ“Р С–РЎвЂ“ (РЎРѓР В°Р В»Р СР В°РўвЂє РЎвЂљР В°Р С—РЎв‚¬РЎвЂ№Р В»РЎвЂ№РўвЂњРЎвЂ№) Р В°Р Р…РЎвЂ№РўвЂєРЎвЂљР В°Р В»Р Т‘РЎвЂ№. Р С™РЈВ©РўР€РЎвЂ“Р В» Р В±РЈВ©Р В»РЎС“ РўвЂєР В°Р В¶Р ВµРЎвЂљ."
    },
    "low_bmi_specialist": {
        "uz": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Pediatr yoki parhezshunos (dietolog) ko'rigi tavsiya etiladi. Vazn yetishmasligi sabablarini aniqlash zarur.",
        "ru": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Р В Р ВµР С”Р С•Р СР ВµР Р…Р Т‘РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ Р С”Р С•Р Р…РЎРѓРЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂ Р С‘РЎРЏ Р С—Р ВµР Т‘Р С‘Р В°РЎвЂљРЎР‚Р В° Р С‘Р В»Р С‘ Р Т‘Р С‘Р ВµРЎвЂљР С•Р В»Р С•Р С–Р В° Р Т‘Р В»РЎРЏ Р Р†РЎвЂ№РЎРЏР Р†Р В»Р ВµР Р…Р С‘РЎРЏ Р С—РЎР‚Р С‘РЎвЂЎР С‘Р Р… Р Т‘Р ВµРЎвЂћР С‘РЎвЂ Р С‘РЎвЂљР В° Р СР В°РЎРѓРЎРѓРЎвЂ№ РЎвЂљР ВµР В»Р В°.",
        "en": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Consultation with a pediatrician or nutritionist is recommended to identify the causes of underweight.",
        "kz": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Р РЋР В°Р В»Р СР В°РўвЂє Р В¶Р ВµРЎвЂљРЎвЂ“РЎРѓР С—Р ВµРЎС“РЎв‚¬РЎвЂ“Р В»РЎвЂ“Р С–РЎвЂ“nin РЎРѓР ВµР В±Р ВµР С—РЎвЂљР ВµРЎР‚РЎвЂ“Р Р… Р В°Р Р…РЎвЂ№РўвЂєРЎвЂљР В°РЎС“ РўР‡РЎв‚¬РЎвЂ“Р Р… Р С—Р ВµР Т‘Р С‘Р В°РЎвЂљРЎР‚ Р Р…Р ВµР СР ВµРЎРѓР Вµ Р Т‘Р С‘Р ВµРЎвЂљР С•Р В»Р С•Р С–РЎвЂљРЎвЂ№РўР€ Р С”Р ВµРўР€Р ВµРЎРѓРЎвЂ“ РўВ±РЎРѓРЎвЂ№Р Р…РЎвЂ№Р В»Р В°Р Т‘РЎвЂ№."
    },
    "low_bmi_nutrition": {
        "uz": "СЂСџРЊР‹ Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'ting. Kuniga 5-6 marta kichik porsiyalarda ovqatlaning.",
        "ru": "СЂСџРЊР‹ Р СџР ВµРЎР‚Р ВµР в„–Р Т‘Р С‘РЎвЂљР Вµ Р Р…Р В° Р Р†РЎвЂ№РЎРѓР С•Р С”Р С•Р С”Р В°Р В»Р С•РЎР‚Р С‘Р в„–Р Р…Р С•Р Вµ Р С—Р С‘РЎвЂљР В°Р Р…Р С‘Р Вµ, Р В±Р С•Р С–Р В°РЎвЂљР С•Р Вµ Р В±Р ВµР В»Р С”Р В°Р СР С‘. Р СџР С‘РЎвЂљР В°Р в„–РЎвЂљР ВµРЎРѓРЎРЉ 5-6 РЎР‚Р В°Р В· Р Р† Р Т‘Р ВµР Р…РЎРЉ Р Р…Р ВµР В±Р С•Р В»РЎРЉРЎв‚¬Р С‘Р СР С‘ Р С—Р С•РЎР‚РЎвЂ Р С‘РЎРЏР СР С‘.",
        "en": "СЂСџРЊР‹ Switch to a high-calorie, protein-rich diet. Eat 5-6 times a day in small portions.",
        "kz": "СЂСџРЊР‹ Р С’РўвЂєРЎС“РЎвЂ№Р В·РўвЂњР В° Р В±Р В°Р в„– Р В¶Р С•РўвЂњР В°РЎР‚РЎвЂ№ Р С”Р В°Р В»Р С•РЎР‚Р С‘РЎРЏР В»РЎвЂ№ Р Т‘Р С‘Р ВµРЎвЂљР В°РўвЂњР В° Р С”РЈВ©РЎв‚¬РЎвЂ“РўР€РЎвЂ“Р В·. Р С™РўР‡Р Р…РЎвЂ“Р Р…Р Вµ 5-6 РЎР‚Р ВµРЎвЂљ Р В°Р В· Р С—Р С•РЎР‚РЎвЂ Р С‘РЎРЏР СР ВµР Р… РЎвЂљР В°Р СР В°РўвЂєРЎвЂљР В°Р Р…РЎвЂ№РўР€РЎвЂ№Р В·."
    },
    "low_bmi_activity": {
        "uz": "СЂСџРЏС“ Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring.",
        "ru": "СЂСџРЏС“ Р Р€Р СР ВµР Р…РЎРЉРЎв‚¬Р С‘РЎвЂљР Вµ Р С‘Р Р…РЎвЂљР ВµР Р…РЎРѓР С‘Р Р†Р Р…РЎвЂ№Р Вµ Р С”Р В°РЎР‚Р Т‘Р С‘Р С•Р Р…Р В°Р С–РЎР‚РЎС“Р В·Р С”Р С‘, РЎРѓР С•РЎРѓРЎР‚Р ВµР Т‘Р С•РЎвЂљР С•РЎвЂЎРЎРЉРЎвЂљР ВµРЎРѓРЎРЉ Р Р…Р В° РЎС“Р С—РЎР‚Р В°Р В¶Р Р…Р ВµР Р…Р С‘РЎРЏРЎвЂ¦ Р Т‘Р В»РЎРЏ Р Р…Р В°Р В±Р С•РЎР‚Р В° Р СРЎвЂ№РЎв‚¬Р ВµРЎвЂЎР Р…Р С•Р в„– Р СР В°РЎРѓРЎРѓРЎвЂ№.",
        "en": "СЂСџРЏС“ Reduce intense cardio, focus on exercises to build muscle mass.",
        "kz": "СЂСџРЏС“ РўС™Р В°РЎР‚РўвЂєРЎвЂ№Р Р…Р Т‘РЎвЂ№ Р С”Р В°РЎР‚Р Т‘Р С‘Р С• Р В¶Р В°РЎвЂљРЎвЂљРЎвЂ№РўвЂњРЎС“Р В»Р В°РЎР‚РЎвЂ№Р Р… Р В°Р В·Р В°Р в„–РЎвЂљРЎвЂ№Р С—, Р В±РўВ±Р В»РЎв‚¬РЎвЂ№РўвЂєР ВµРЎвЂљ Р СР В°РЎРѓРЎРѓР В°РЎРѓРЎвЂ№Р Р… Р В°РЎР‚РЎвЂљРЎвЂљРЎвЂ№РЎР‚РЎС“РўвЂњР В° Р В±Р В°РўвЂњРЎвЂ№РЎвЂљРЎвЂљР В°Р В»РўвЂњР В°Р Р… Р В¶Р В°РЎвЂљРЎвЂљРЎвЂ№РўвЂњРЎС“Р В»Р В°РЎР‚РўвЂњР В° Р Р…Р В°Р В·Р В°РЎР‚ Р В°РЎС“Р Т‘Р В°РЎР‚РЎвЂ№РўР€РЎвЂ№Р В·."
    },
    "low_bmi_checkups": {
        "uz": "СЂСџРЏТђ Qon tahlili (gemoglobin), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'tish tavsiya etiladi.",
        "ru": "СЂСџРЏТђ Р В Р ВµР С”Р С•Р СР ВµР Р…Р Т‘РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ РЎРѓР Т‘Р В°РЎвЂљРЎРЉ Р В°Р Р…Р В°Р В»Р С‘Р В· Р С”РЎР‚Р С•Р Р†Р С‘ (Р С–Р ВµР СР С•Р С–Р В»Р С•Р В±Р С‘Р Р…), Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С‘РЎвЂљРЎРЉ Р С–Р С•РЎР‚Р СР С•Р Р…Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎвЂћР С•Р Р… Р С‘ Р вЂ“Р С™Р Сћ.",
        "en": "СЂСџРЏТђ Blood test (hemoglobin), hormonal profile, and gastrointestinal check-up are recommended.",
        "kz": "СЂСџРЏТђ РўС™Р В°Р Р… Р В°Р Р…Р В°Р В»Р С‘Р В·РЎвЂ“Р Р… (Р С–Р ВµР СР С•Р С–Р В»Р С•Р В±Р С‘Р Р…) РЎвЂљР В°Р С—РЎРѓРЎвЂ№РЎР‚РЎС“, Р С–Р С•РЎР‚Р СР С•Р Р…Р В°Р В»Р Т‘РЎвЂ№ РЎвЂћР С•Р Р… Р СР ВµР Р… Р В°РЎРѓРўвЂєР В°Р В·Р В°Р Р…-РЎвЂ“РЎв‚¬Р ВµР С” Р В¶Р С•Р В»Р Т‘Р В°РЎР‚РЎвЂ№Р Р… РЎвЂљР ВµР С”РЎРѓР ВµРЎР‚РЎС“ РўВ±РЎРѓРЎвЂ№Р Р…РЎвЂ№Р В»Р В°Р Т‘РЎвЂ№."
    },
    "high_bmi_general": {
        "uz": "Ortiqcha tana vazni aniqlandi. Bu kelajakda salomatlikka salbiy ta'sir qilishi mumkin.",
        "ru": "Р вЂ™РЎвЂ№РЎРЏР Р†Р В»Р ВµР Р… Р С‘Р В·Р В±РЎвЂ№РЎвЂљР С•РЎвЂЎР Р…РЎвЂ№Р в„– Р Р†Р ВµРЎРѓ. Р вЂ™ Р В±РЎС“Р Т‘РЎС“РЎвЂ°Р ВµР С РЎРЊРЎвЂљР С• Р СР С•Р В¶Р ВµРЎвЂљ Р Р…Р ВµР С–Р В°РЎвЂљР С‘Р Р†Р Р…Р С• РЎРѓР С”Р В°Р В·Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ Р Р…Р В° Р В·Р Т‘Р С•РЎР‚Р С•Р Р†РЎРЉР Вµ.",
        "en": "Excess weight identified. This may negatively affect health in the future.",
        "kz": "Р С’РЎР‚РЎвЂљРЎвЂ№РўвЂє РЎРѓР В°Р В»Р СР В°РўвЂє Р В°Р Р…РЎвЂ№РўвЂєРЎвЂљР В°Р В»Р Т‘РЎвЂ№. Р вЂРўВ±Р В» Р В±Р С•Р В»Р В°РЎв‚¬Р В°РўвЂєРЎвЂљР В° Р Т‘Р ВµР Р…РЎРѓР В°РЎС“Р В»РЎвЂ№РўвЂєРўвЂєР В° Р С”Р ВµРЎР‚РЎвЂ“ РЈв„ўРЎРѓР ВµРЎР‚ Р ВµРЎвЂљРЎС“РЎвЂ“ Р СРўР‡Р СР С”РЎвЂ“Р Р…."
    },
    "high_bmi_specialist": {
        "uz": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Endokrinolog va parhezshunos ko'rigidan o'tish maqsadga muvofiq.",
        "ru": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Р В¦Р ВµР В»Р ВµРЎРѓР С•Р С•Р В±РЎР‚Р В°Р В·Р Р…Р С• Р С—РЎР‚Р С•Р в„–РЎвЂљР С‘ Р С”Р С•Р Р…РЎРѓРЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂ Р С‘РЎР‹ РЎРЊР Р…Р Т‘Р С•Р С”РЎР‚Р С‘Р Р…Р С•Р В»Р С•Р С–Р В° Р С‘ Р Т‘Р С‘Р ВµРЎвЂљР С•Р В»Р С•Р С–Р В°.",
        "en": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ It is advisable to consult an endocrinologist and dietitian.",
        "kz": "СЂСџвЂРЃРІР‚РЊРІС™вЂўРїС‘РЏ Р В­Р Р…Р Т‘Р С•Р С”РЎР‚Р С‘Р Р…Р С•Р В»Р С•Р С– Р С—Р ВµР Р… Р Т‘Р С‘Р ВµРЎвЂљР С•Р В»Р С•Р С– Р С”Р ВµРўР€Р ВµРЎРѓРЎвЂ“Р Р…Р ВµР Р… РЈВ©РЎвЂљРЎС“ Р СР В°РўвЂєРЎРѓР В°РЎвЂљРўвЂєР В° РЎРѓР В°Р в„–."
    },
    "high_bmi_nutrition": {
        "uz": "СЂСџРЊР‹ Ratsionda shakar va tez hazm bo'luvchi uglevodlarni cheklang. Ko'proq sabzavotlar iste'mol qiling.",
        "ru": "СЂСџРЊР‹ Р С›Р С–РЎР‚Р В°Р Р…Р С‘РЎвЂЎРЎРЉРЎвЂљР Вµ РЎРѓР В°РЎвЂ¦Р В°РЎР‚ Р С‘ Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚РЎвЂ№Р Вµ РЎС“Р С–Р В»Р ВµР Р†Р С•Р Т‘РЎвЂ№ Р Р† РЎР‚Р В°РЎвЂ Р С‘Р С•Р Р…Р Вµ. Р Р€Р С—Р С•РЎвЂљРЎР‚Р ВµР В±Р В»РЎРЏР в„–РЎвЂљР Вµ Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р С•Р Р†Р С•РЎвЂ°Р ВµР в„–.",
        "en": "СЂСџРЊР‹ Limit sugar and fast carbohydrates in your diet. Consume more vegetables.",
        "kz": "СЂСџРЊР‹ Р В Р В°РЎвЂ Р С‘Р С•Р Р…Р Т‘Р В°РўвЂњРЎвЂ№ РўвЂєР В°Р Р…РЎвЂљ Р С—Р ВµР Р… РЎвЂљР ВµР В· РўвЂєР С•РЎР‚РЎвЂ№РЎвЂљРЎвЂ№Р В»Р В°РЎвЂљРЎвЂ№Р Р… Р С”РЈВ©Р СРЎвЂ“РЎР‚РЎРѓРЎС“Р В»Р В°РЎР‚Р Т‘РЎвЂ№ РЎв‚¬Р ВµР С”РЎвЂљР ВµРўР€РЎвЂ“Р В·. Р С™РЈВ©Р В±РЎвЂ“РЎР‚Р ВµР С” Р С”РЈВ©Р С”РЈВ©Р Р…РЎвЂ“РЎРѓРЎвЂљР ВµРЎР‚Р Т‘РЎвЂ“ РЎвЂљРўВ±РЎвЂљРЎвЂ№Р Р…РЎвЂ№РўР€РЎвЂ№Р В·."
    },
    "high_bmi_activity": {
        "uz": "СЂСџРЏС“ Kundalik piyoda yurish va suzish kabi aerob mashqlarni ko'paytiring.",
        "ru": "СЂСџРЏС“ Р Р€Р Р†Р ВµР В»Р С‘РЎвЂЎРЎРЉРЎвЂљР Вµ Р В°РЎРЊРЎР‚Р С•Р В±Р Р…РЎвЂ№Р Вµ Р Р…Р В°Р С–РЎР‚РЎС“Р В·Р С”Р С‘, РЎвЂљР В°Р С”Р С‘Р Вµ Р С”Р В°Р С” Р ВµР В¶Р ВµР Т‘Р Р…Р ВµР Р†Р Р…РЎвЂ№Р Вµ Р С—РЎР‚Р С•Р С–РЎС“Р В»Р С”Р С‘ Р С‘ Р С—Р В»Р В°Р Р†Р В°Р Р…Р С‘Р Вµ.",
        "en": "СЂСџРЏС“ Increase aerobic activities such as daily walking and swimming.",
        "kz": "СЂСџРЏС“ Р С™РўР‡Р Р…Р Т‘Р ВµР В»РЎвЂ“Р С”РЎвЂљРЎвЂ“ РЎРѓР ВµРЎР‚РЎС“Р ВµР Р…Р Т‘Р ВµРЎС“ Р В¶РЈв„ўР Р…Р Вµ Р В¶РўР‡Р В·РЎС“ РЎРѓР С‘РЎРЏРўвЂєРЎвЂљРЎвЂ№ Р В°РЎРЊРЎР‚Р С•Р В±РЎвЂљРЎвЂ№ Р В¶Р В°РЎвЂљРЎвЂљРЎвЂ№РўвЂњРЎС“Р В»Р В°РЎР‚Р Т‘РЎвЂ№ Р С”РЈВ©Р В±Р ВµР в„–РЎвЂљРЎвЂ“РўР€РЎвЂ“Р В·."
    },
    "high_bmi_checkups": {
        "uz": "СЂСџРЏТђ Qondagi qand miqdori va lipid profilini tekshirish tavsiya etiladi.",
        "ru": "СЂСџРЏТђ Р В Р ВµР С”Р С•Р СР ВµР Р…Р Т‘РЎС“Р ВµРЎвЂљРЎРѓРЎРЏ Р С—РЎР‚Р С•Р Р†Р ВµРЎР‚Р С‘РЎвЂљРЎРЉ РЎС“РЎР‚Р С•Р Р†Р ВµР Р…РЎРЉ РЎРѓР В°РЎвЂ¦Р В°РЎР‚Р В° Р Р† Р С”РЎР‚Р С•Р Р†Р С‘ Р С‘ Р В»Р С‘Р С—Р С‘Р Т‘Р Р…РЎвЂ№Р в„– Р С—РЎР‚Р С•РЎвЂћР С‘Р В»РЎРЉ.",
        "en": "СЂСџРЏТђ It is recommended to check blood sugar levels and lipid profile.",
        "kz": "СЂСџРЏТђ РўС™Р В°Р Р…Р Т‘Р В°РўвЂњРЎвЂ№ РўвЂєР В°Р Р…РЎвЂљ Р СРЈВ©Р В»РЎв‚¬Р ВµРЎР‚РЎвЂ“Р Р… Р В¶РЈв„ўР Р…Р Вµ Р В»Р С‘Р С—Р С‘Р Т‘РЎвЂљРЎвЂ“Р С” Р С—РЎР‚Р С•РЎвЂћР С‘Р В»РЎРЉР Т‘РЎвЂ“ РЎвЂљР ВµР С”РЎРѓР ВµРЎР‚РЎС“ РўВ±РЎРѓРЎвЂ№Р Р…РЎвЂ№Р В»Р В°Р Т‘РЎвЂ№."
    }
}


def _ai(key: str, lang: str, all_settings: Dict[str, Any]) -> str:
    """Maslahat lug'atidan matnni oladi. Agar sozlamalarda bo'lmasa, _ADVICE_I18N dan oladi."""
    setting_key = f"adv_{key}"
    val = all_settings.get(setting_key, {})

    # 1. Database settings (override)
    res = val.get(lang) or val.get("uz")
    if res:
        return res

    # 2. Local dictionary fallback
    local_val = _ADVICE_I18N.get(key, {})
    res = local_val.get(lang) or local_val.get("uz")
    if res:
        return res

    # 3. Final fallback to key itself
    return key


# Kalit so'zlar til bo'yicha (bio_data advice larini guruhlash uchun)
_KW = {
    "nutrition": {
        "uz": ["shirinlik", "ovqat", "suv", "oqsil", "ratsion", "iste'mol", "parhez", "yog'", "vitamin", "kalori", "sabzavot", "meva", "taom"],
        "ru": ["РЎРѓР В»Р В°Р Т‘Р С”", "Р С—Р С‘РЎвЂљР В°Р Р…Р С‘", "Р Р†Р С•Р Т‘", "Р В±Р ВµР В»Р С•Р С”", "РЎР‚Р В°РЎвЂ Р С‘Р С•Р Р…", "Р С—Р С•РЎвЂљРЎР‚Р ВµР В±Р В»", "Р Т‘Р С‘Р ВµРЎвЂљ", "Р В¶Р С‘РЎР‚", "Р Р†Р С‘РЎвЂљР В°Р СР С‘Р Р…", "Р С”Р В°Р В»Р С•РЎР‚Р С‘", "Р С•Р Р†Р С•РЎвЂ°", "РЎвЂћРЎР‚РЎС“Р С”РЎвЂљ", "Р С—Р С‘РЎвЂ°"],
        "en": ["sweet", "food", "water", "protein", "diet", "consum", "fat", "vitamin", "calori", "vegetabl", "fruit", "nutri"],
        "kz": ["РЎвЂљРЈв„ўРЎвЂљРЎвЂљРЎвЂ“", "РЎвЂљР В°Р СР В°РўвЂє", "РЎРѓРЎС“", "Р В°РўвЂєРЎС“РЎвЂ№Р В·", "РЎР‚Р В°РЎвЂ Р С‘Р С•Р Р…", "РЎвЂљРўВ±РЎвЂљРЎвЂ№Р Р…", "Р С—Р В°РЎР‚hez", "Р СР В°Р в„–", "Р Т‘РЈв„ўРЎР‚РЎС“Р СР ВµР Р…", "Р С”Р В°Р В»Р С•РЎР‚Р С‘", "Р С”РЈВ©Р С”РЈВ©Р Р…РЎвЂ“РЎРѓ", "Р В¶Р ВµР СРЎвЂ“РЎРѓ"],
    },
    "specialist": {
        "uz": ["pediatr", "endokrinolog", "mutaxassis", "ko'rig", "maslahat", "shifokor", "dР С•ktor"],
        "ru": ["Р С—Р ВµР Т‘Р С‘Р В°РЎвЂљРЎР‚", "РЎРЊР Р…Р Т‘Р С•Р С”РЎР‚Р С‘Р Р…Р С•Р В»Р С•Р С–", "РЎРѓР С—Р ВµРЎвЂ Р С‘Р В°Р В»Р С‘РЎРѓРЎвЂљ", "Р С”Р С•Р Р…РЎРѓРЎС“Р В»РЎРЉРЎвЂљР В°РЎвЂ ", "Р Р†РЎР‚Р В°РЎвЂЎ", "Р Т‘Р С•Р С”РЎвЂљР С•РЎР‚"],
        "en": ["pediatr", "endocrinolog", "specialist", "consult", "doctor", "physician"],
        "kz": ["Р С—Р ВµР Т‘Р С‘Р В°РЎвЂљРЎР‚", "РЎРЊР Р…Р Т‘Р С•Р С”РЎР‚Р С‘Р Р…Р С•Р В»Р С•Р С–", "Р СР В°Р СР В°Р Р…", "Р С”Р ВµРўР€Р ВµРЎРѓ", "Р Т‘РЈв„ўРЎР‚РЎвЂ“Р С–Р ВµРЎР‚"],
    },
    "activity": {
        "uz": ["mashq", "sport", "faollik", "harakat", "badantarbiya", "jismoniy", "yugurish", "suzish", "gimnastika"],
        "ru": ["РЎС“Р С—РЎР‚Р В°Р В¶Р Р…Р ВµР Р…", "РЎРѓР С—Р С•РЎР‚РЎвЂљ", "Р В°Р С”РЎвЂљР С‘Р Р†Р Р…Р С•РЎРѓРЎвЂљ", "Р Т‘Р Р†Р С‘Р В¶Р ВµР Р…", "РЎвЂћР С‘Р В·Р С‘РЎвЂЎР ВµРЎРѓР С”", "Р В±Р ВµР С–", "Р С—Р В»Р В°Р Р†Р В°Р Р…Р С‘", "Р С–Р С‘Р СР Р…Р В°РЎРѓРЎвЂљР С‘Р С”"],
        "en": ["exercise", "sport", "activit", "movement", "physical", "running", "swimming", "gymnastic"],
        "kz": ["Р В¶Р В°РЎвЂљРЎвЂљРЎвЂ№РўвЂњРЎС“", "РЎРѓР С—Р С•РЎР‚РЎвЂљ", "Р В±Р ВµР В»РЎРѓР ВµР Р…Р Т‘РЎвЂ“", "РўвЂєР С•Р В·РўвЂњР В°Р В»РЎвЂ№РЎРѓ", "Р Т‘Р ВµР Р…Р Вµ", "Р В¶РўР‡Р С–РЎвЂ“РЎР‚РЎС“", "Р В¶РўР‡Р В·РЎС“"],
    },
    "checkups": {
        "uz": ["tahlil", "tekshiruv", "nazorat"],
        "ru": ["Р В°Р Р…Р В°Р В»Р С‘Р В·", "Р С•Р В±РЎРѓР В»Р ВµР Т‘Р С•Р Р†Р В°Р Р…", "Р С”Р С•Р Р…РЎвЂљРЎР‚Р С•Р В»", "Р СР С•Р Р…Р С‘РЎвЂљР С•РЎР‚Р С‘Р Р…Р С–"],
        "en": ["test", "check", "monitor", "examination", "lab"],
        "kz": ["РЎвЂљР В°Р В»Р Т‘Р В°РЎС“", "РЎвЂљР ВµР С”РЎРѓР ВµРЎР‚РЎС“", "Р В±Р В°РўвЂєРЎвЂ№Р В»Р В°РЎС“"],
    },
}


def generate_advices(bmi: float, weight_diff: float, age: int, gender: str, all_settings: Dict[str, Any], bio_data: dict = None, lang: str = "uz") -> Dict[str, str]:
    bmi_range = get_bmi_range_by_age_and_gender(age, gender)

    res = {
        "general":    _ai("default_general",    lang, all_settings),
        "specialist": _ai("default_specialist",  lang, all_settings),
        "nutrition":  _ai("default_nutrition",   lang, all_settings),
        "activity":   _ai("default_activity",    lang, all_settings),
        "checkups":   _ai("default_checkups",    lang, all_settings),
    }

    # 1. BMI based advice
    if bmi < bmi_range["min"]:
        res["general"]    = _ai("low_bmi_general",    lang, all_settings)
        res["specialist"] = _ai("low_bmi_specialist", lang, all_settings)
        res["nutrition"]  = _ai("low_bmi_nutrition",  lang, all_settings)
        res["activity"]   = _ai("low_bmi_activity",   lang, all_settings)
        res["checkups"]   = _ai("low_bmi_checkups",   lang, all_settings)
    elif bmi > bmi_range["max"]:
        res["general"]    = _ai("high_bmi_general",    lang, all_settings)
        res["specialist"] = _ai("high_bmi_specialist", lang, all_settings)
        res["nutrition"]  = _ai("high_bmi_nutrition",  lang, all_settings)
        res["activity"]   = _ai("high_bmi_activity",   lang, all_settings)
        res["checkups"]   = _ai("high_bmi_checkups",   lang, all_settings)

    # 2. Bioimpedance and Indices based advice (from bio_data)
    if bio_data:
        raw_advices = bio_data.get("advice", [])
        kw_lang = all_settings.get("keywords", {}) # keywords settings modelda bo'lsa
        # Agar keywords settingda bo'lmasa fallback _KW (hozircha shunday qolishi mumkin)
        if not kw_lang:
            kw_lang = _KW

        defv = {
            "general":    _ai("default_general",   lang, all_settings),
            "specialist": _ai("default_specialist", lang, all_settings),
            "nutrition":  _ai("default_nutrition",  lang, all_settings),
            "activity":   _ai("default_activity",   lang, all_settings),
            "checkups":   _ai("default_checkups",   lang, all_settings),
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
