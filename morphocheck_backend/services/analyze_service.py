# morphocheck_backend/services/analyze_service.py
import datetime
import json
import logging
import os
import re
import unicodedata
from typing import Any, Dict, Optional, Tuple

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy.orm import Session

from models.schemas import PatientData
from models.userdata import PatientAnalysis
from services.age_service import total_age_months
from services.indices_service import calculate_detailed_indices
from services.ky_localization import (
    KY_BMI_CATEGORIES,
    KZ_BMI_CATEGORIES,
    TM_BMI_CATEGORIES,
    report_text,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_MOJIBAKE_EMOJI_PREFIX_RE = re.compile(r"^(?:рџ\S*\s*)+")


# ---------------------------
# Yordamchi funksiyalar
# ---------------------------
UZBEKISTAN_REGION_DISTRICTS = {
    "Toshkent shahri": (
        "Bektemir", "Chilonzor", "Mirobod", "Mirzo Ulugbek", "Olmazor",
        "Sergeli", "Shayxontohur", "Uchtepa", "Yakkasaroy", "Yashnobod",
        "Yangihayot", "Yunusobod",
    ),
    "Toshkent viloyati": (
        "Bekobod", "Bostonliq", "Boka", "Chinoz", "Ohangaron", "Oqqorgon",
        "Parkent", "Piskent", "Qibray", "Quyi Chirchiq", "Orta Chirchiq",
        "Yuqori Chirchiq", "Yangiyol", "Zangiota", "Nurafshon", "Olmaliq",
        "Angren", "Chirchiq",
    ),
    "Andijon": (
        "Andijon", "Asaka", "Baliqchi", "Boz", "Buloqboshi", "Izboskan",
        "Jalaquduq", "Marhamat", "Oltinkol", "Paxtaobod", "Qorgontepa",
        "Shahrixon", "Ulugnor", "Xojaobod", "Xonobod",
    ),
    "Farg'ona": (
        "Fargona", "Bagdod", "Beshariq", "Buvayda", "Dangara", "Furqat",
        "Oltiariq", "Ozbekiston", "Qoshtepa", "Quva", "Rishton", "Sox",
        "Toshloq", "Uchkoprik", "Yozyovon", "Qoqon", "Margilon",
    ),
    "Namangan": (
        "Namangan", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin",
        "Pop", "Toraqorgon", "Uchqorgon", "Uychi", "Yangiqorgon",
    ),
    "Samarqand": (
        "Samarqand", "Bulungur", "Ishtixon", "Jomboy", "Kattaqorgon",
        "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Pastdargom", "Payariq",
        "Qoshrabot", "Toyloq", "Urgut",
    ),
    "Buxoro": (
        "Buxoro", "Gijduvon", "Jondor", "Kogon", "Olot", "Peshku",
        "Qorakol", "Qorovulbozor", "Romitan", "Shofirkon", "Vobkent",
    ),
    "Xorazm": (
        "Urganch", "Xiva", "Bogot", "Gurlan", "Hazorasp", "Qoshkopir",
        "Shovot", "Xonqa", "Yangiariq", "Yangibozor", "Tuproqqala",
    ),
    "Qoraqalpog'iston": (
        "Nukus", "Amudaryo", "Beruniy", "Bozatov", "Chimboy", "Ellikqala",
        "Kegeyli", "Moynoq", "Qanlikol", "Qongirot", "Qoraozak", "Shumanay",
        "Taxtakopir", "Tortkol", "Xojayli", "Taxiatosh",
    ),
    "Jizzax": (
        "Jizzax", "Arnasoy", "Baxmal", "Dostlik", "Forish", "Gallaorol",
        "Mirzachol", "Paxtakor", "Yangiobod", "Zafarobod", "Zarbdor", "Zomin",
    ),
    "Sirdaryo": (
        "Guliston", "Boyovut", "Oqoltin", "Sardoba", "Sayxunobod",
        "Sirdaryo", "Xovos", "Yangiyer", "Shirin",
    ),
    "Surxondaryo": (
        "Termiz", "Angor", "Bandixon", "Boysun", "Denov", "Jarqorgon",
        "Qiziriq", "Qumqorgon", "Muzrabot", "Oltinsoy", "Sariosiyo",
        "Sherobod", "Shorchi", "Uzun",
    ),
    "Qashqadaryo": (
        "Qarshi", "Chiroqchi", "Dehqonobod", "Guzor", "Kasbi", "Kitob",
        "Koson", "Kokdala", "Mirishkor", "Muborak", "Nishon", "Qamashi",
        "Shahrisabz", "Yakkabog",
    ),
    "Navoiy": (
        "Navoiy", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa",
        "Tomdi", "Uchquduq", "Xatirchi", "Zarafshon", "Gozgon",
    ),
}

_CYRILLIC_LOCATION_TRANSLATION = str.maketrans({
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
    "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "s",
    "ч": "ch", "ш": "sh", "ъ": "", "ь": "", "э": "e", "ю": "yu",
    "я": "ya", "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
})


def _normalize_uzbek_location(value: Optional[str]) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).lower()
    text = text.translate(_CYRILLIC_LOCATION_TRANSLATION)
    text = text.replace("ʻ", "").replace("ʼ", "").replace("’", "").replace("'", "")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def infer_uzbekistan_region(location: Optional[str]) -> Optional[str]:
    """Return a region using the left-to-right order of locality components."""
    raw_location = str(location or "").strip()
    if not raw_location:
        return None

    # "Aholi punkti" is entered as "tuman, mahalla/QFY".  Resolve each
    # comma-separated component in that order so a mahalla whose name is also
    # a district (for example Navbahor or Andijon) cannot override the tuman.
    components = [part for part in re.split(r"[,;]+", raw_location) if part.strip()]
    for component in components:
        normalized = f" {_normalize_uzbek_location(component)} "

        for region in UZBEKISTAN_REGION_DISTRICTS:
            token = _normalize_uzbek_location(region)
            if f" {token} " in normalized:
                return region

        matches = []
        for region, districts in UZBEKISTAN_REGION_DISTRICTS.items():
            for district in districts:
                token = _normalize_uzbek_location(district)
                if f" {token} " in normalized:
                    matches.append((len(token), region))
        if matches:
            return max(matches, key=lambda match: match[0])[1]

    return None


def infer_uzbekistan_district(
    location: Optional[str], region: Optional[str] = None
) -> Optional[str]:
    """Return the first recognized district from a locality string."""
    raw_location = str(location or "").strip()
    if not raw_location:
        return None

    region_norm = infer_uzbekistan_region(region or raw_location)
    district_groups = (
        [(region_norm, UZBEKISTAN_REGION_DISTRICTS[region_norm])]
        if region_norm in UZBEKISTAN_REGION_DISTRICTS
        else UZBEKISTAN_REGION_DISTRICTS.items()
    )

    for component in re.split(r"[,;]+", raw_location):
        normalized = f" {_normalize_uzbek_location(component)} "
        matches = []
        for _district_region, districts in district_groups:
            for district in districts:
                token = _normalize_uzbek_location(district)
                if f" {token} " in normalized:
                    matches.append((len(token), district))
        if matches:
            return max(matches, key=lambda match: match[0])[1]

    return None


def get_district_id_code(district: Optional[str], region: Optional[str] = None) -> str:
    """Build the one-letter district part used in regional IDs."""
    district_name = infer_uzbekistan_district(district, region)
    normalized = _normalize_uzbek_location(district_name)
    return normalized[:1].upper()


def setup_font() -> str:
    """
    PDF uchun shrifni aniqlaydi (DejaVu yo'q bo'lsa, Helvetica).
    /morphocheck_backend/fonts/DejaVuSans.ttf bo'lsa, avtomatik yuklaydi.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        font_path = os.path.join(base_dir, "fonts", "DejaVuSans.ttf")

        if not os.path.exists(font_path):
            # fallback
            available_fonts = ["Helvetica-Bold", "Helvetica", "Times-Roman", "Courier"]
            for font in available_fonts:
                if font in pdfmetrics.getRegisteredFontNames():
                    return font
            return "Helvetica"

        pdfmetrics.registerFont(TTFont("DejaVu", font_path))
        return "DejaVu"
    except Exception as e:
        logger.warning(f"Font sozlashda xato: {str(e)}")
        return "Helvetica"


def get_bmi_range_by_age_and_gender(age: int, gender: str) -> Dict[str, float]:
    # Hozircha sodda diapazon вЂ” yoshga mos biroz siljigan
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

    # 3вЂ“18 yosh oralig'i uchun WHO ga yaqin mos jadval
    boys_weights = {
        3: 14.3,
        4: 16.3,
        5: 18.3,
        6: 20.5,
        7: 22.9,
        8: 25.6,
        9: 28.5,
        10: 31.9,
        11: 35.6,
        12: 39.9,
        13: 45.3,
        14: 50.8,
        15: 56.5,
        16: 61.5,
        17: 66.0,
        18: 70.3,
    }
    girls_weights = {
        3: 13.9,
        4: 15.7,
        5: 17.6,
        6: 19.7,
        7: 22.0,
        8: 24.5,
        9: 27.2,
        10: 30.1,
        11: 33.4,
        12: 37.0,
        13: 41.1,
        14: 45.3,
        15: 49.1,
        16: 52.1,
        17: 54.4,
        18: 56.0,
    }

    if age <= 18:
        if gender == "erkak":
            return boys_weights.get(age, 20.0)
        else:
            return girls_weights.get(age, 19.0)

    # Kattalar uchun вЂ“ BMI diapazoniga asoslangan ideal vazn
    if age < 25:
        bmi_target = 22.0
    elif age < 45:
        bmi_target = 23.0
    elif age < 60:
        bmi_target = 24.0
    else:
        bmi_target = 25.0

    height_m = height / 100
    return round(bmi_target * (height_m**2), 1)


def generate_region_based_id(
    db: Session, region: str, district: Optional[str] = None
) -> str:
    """Generate MC-{region}-{district?}-{sequence} IDs."""
    # Normallashtirish: bo'shliqlarni olib tashlash va bir xil formatga keltirish
    region_norm = infer_uzbekistan_region(region) or (region or "").strip()

    # Prifikslar xaritasi (Lotin va Kirill variantlari uchun)
    prefixes = {
        # Lotin
        "Toshkent shahri": "TOSH",
        "Toshkent viloyati": "TOSH",
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
        "Тошкент шаҳри": "TOSH",
        "Тошкент вилояти": "TOSH",
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
        "Навоий": "NAV",
    }

    prefix = prefixes.get(region_norm)
    if not prefix:
        # Katta-kichik harfga sezgirlikni kamaytirish va substring qidirish
        for reg_name, pref in prefixes.items():
            if (
                reg_name.lower() in region_norm.lower()
                or region_norm.lower() in reg_name.lower()
            ):
                prefix = pref
                break

    if not prefix:
        # Agar xaritada bo'lmasa, birinchi 3 ta harfni olamiz
        clean_name = "".join(filter(str.isalnum, region_norm))
        if clean_name:
            prefix = clean_name[:3].upper()
        else:
            prefix = "UNK"

    district_source = district
    if (
        not district_source
        and _normalize_uzbek_location(region) != _normalize_uzbek_location(region_norm)
    ):
        district_source = region
    district_code = get_district_id_code(district_source, region_norm)
    id_prefix = f"{prefix}-{district_code}" if district_code else prefix

    # Mavjud yozuvlar sonini hisoblash
    from sqlalchemy import or_

    from models.userdata import PatientAnalysis, ResearchRecord

    # Tarixiy muvofiqlik (masalan, TS/TV -> TOSH yoki QR/QQ -> QR)
    historical_mappings = {
        "TOSH": ["TOSH", "TS", "TV"],
        "QR": ["QR", "QQ", "QOR"],
        "QAS": ["QAS", "QASH"],
    }
    region_prefixes = historical_mappings.get(prefix, [prefix])
    prefixes_to_check = [
        f"{region_prefix}-{district_code}" if district_code else region_prefix
        for region_prefix in region_prefixes
    ]

    count_pa = (
        db.query(PatientAnalysis)
        .filter(
            or_(
                *[PatientAnalysis.id_code.like(f"{p}-%") for p in prefixes_to_check],
                *[PatientAnalysis.id_code.like(f"MC-{p}-%") for p in prefixes_to_check]
            )
        )
        .count()
    )

    count_rr = (
        db.query(ResearchRecord)
        .filter(
            or_(
                *[ResearchRecord.id_code.like(f"{p}-%") for p in prefixes_to_check],
                *[ResearchRecord.id_code.like(f"MC-{p}-%") for p in prefixes_to_check]
            )
        )
        .count()
    )

    return f"MC-{id_prefix}-{count_pa + count_rr + 1:04d}"


def calculate_bmi(
    data: PatientData, all_settings: Dict[str, Any], lang: str = "uz"
) -> dict:
    """РҐРёСЃРѕР±Р»Р°С€Р»Р°СЂ РІР° РґРёР°РіРЅРѕР· (Z-score Р±РёР»Р°РЅ)."""
    age = int(data.age)
    gender = (data.gender or "").lower()
    height = float(data.height)
    weight = float(data.weight)

    h2 = (height / 100.0) ** 2
    if h2 <= 0:
        raise ValueError("РќРµРєРѕСЂСЂРµРєС‚РЅРѕРµ Р·РЅР°С‡РµРЅРёРµ СЂРѕСЃС‚Р°.")
    bmi = round(weight / h2, 1)

    # РСЃРїРѕР»СЊР·СѓРµРј СѓР»СѓС‡С€РµРЅРЅС‹Рµ СЂР°СЃС‡РµС‚С‹ РёР· indices_service
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
        "shoulder_breadth": data.shoulder_breadth,
        "thigh_circumference": data.thigh_circumference,
        "calf_circumference": data.calf_circumference,
        "shoulder_circumference": data.shoulder_circumference,
        "ffm_kg": data.body_composition.ffm_measured_kg if data.body_composition is not None else None,
        "independent_fm_kg": data.body_composition.fat_mass_measured_kg if data.body_composition is not None else data.fat_mass,
        "region": data.region,
        "district": data.district,
        "mahalla": data.mahalla,
        "address": data.address,
    }
    # New Body Composition inputs pass through the canonical QC layer before
    # any compatible value reaches the unchanged legacy index engine.
    if data.body_composition is not None:
        from services.body_composition_service import (
            calculate_body_composition,
            raw_body_composition_from_patient,
        )

        canonical_bia = calculate_body_composition(
            weight_kg=weight,
            raw=raw_body_composition_from_patient(data),
            sex=gender,
            age_months=total_age_months(data),
        )
        manual_bio["fat_percent"] = (
            canonical_bia["pbf_percent"]["value"]
            if canonical_bia["pbf_percent"]["status"] != "invalid"
            else None
        )
        manual_bio["fat_mass"] = (
            canonical_bia["fat_mass_kg"]["used_value"]
            if canonical_bia["fat_mass_kg"]["status"] != "invalid"
            else None
        )
        manual_bio["muscle_mass"] = (
            canonical_bia["smm_kg"]["value"]
            if canonical_bia["smm_kg"]["status"] != "invalid"
            else None
        )
        manual_bio["bone_mass"] = (
            canonical_bia["mineral_bone_mass_kg"]["value"]
            if canonical_bia["mineral_bone_mass_kg"]["status"] != "invalid"
            else None
        )
        manual_bio["visceral_fat"] = (
            canonical_bia["visceral_fat"]["value"]
            if canonical_bia["visceral_fat"]["status"] != "invalid"
            else None
        )

    detailed = calculate_detailed_indices(
        age,
        gender,
        height,
        weight,
        bmi,
        manual_bio,
        lang=lang,
        all_settings=all_settings,
        age_months=total_age_months(data),
    )

    # РљР°С‚РµРіРѕСЂРёСЏ РРњРў РЅР° РѕСЃРЅРѕРІРµ Z-score (РґР»СЏ РґРµС‚РµР№) РёР»Рё СЃС‚Р°РЅРґР°СЂС‚РѕРІ Р’РћР— (РґР»СЏ РІР·СЂРѕСЃР»С‹С…)
    z_bmi = detailed.get("z_bmi", 0)
    if age < 19:
        if z_bmi < -2:
            bmi_category = _get_bmi_cat("v_low", lang, all_settings)
        elif z_bmi < -1:
            bmi_category = _get_bmi_cat("low", lang, all_settings)
        elif z_bmi <= 1:
            bmi_category = _get_bmi_cat("normal", lang, all_settings)
        elif z_bmi <= 2:
            bmi_category = _get_bmi_cat("overweight", lang, all_settings)
        else:
            bmi_category = _get_bmi_cat("obese", lang, all_settings)
    else:
        if bmi < 18.5:
            bmi_category = _get_bmi_cat("low", lang, all_settings)
        elif bmi < 25:
            bmi_category = _get_bmi_cat("normal", lang, all_settings)
        elif bmi < 30:
            bmi_category = _get_bmi_cat("overweight", lang, all_settings)
        else:
            bmi_category = _get_bmi_cat("obese", lang, all_settings)

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
        "shoulder_ratio": round((float(data.shoulder_breadth or 0) / height) * 100, 1)
        if height > 0
        else 0,
        "thigh_ratio": round((float(data.thigh_circumference or 0) / height) * 100, 1)
        if height > 0
        else 0,
        "indices": detailed,
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


def build_growth_standards(
    data: PatientData, analysis: Dict[str, Any]
) -> Dict[str, Any]:
    indices = analysis.get("indices", {}) or {}
    bmi = analysis.get("bmi")
    height = float(data.height)
    weight = float(data.weight)
    chest = float(data.chest)
    head = float(data.head)
    age_months = total_age_months(data)

    # Each indicator has its own published/reference applicability window.
    # A missing reference is not a normal result and must not be extrapolated.
    applicability = {
        "height": (60, 228),
        "weight": (60, 120),
        "bmi": (60, 228),
        "head": (36, 216),
        "chest": (36, 216),
    }

    supplied_v6 = indices.get("growth_reference_version") == "supplied_v6_WHO_LMS"
    if supplied_v6:
        for key in ("height", "weight", "bmi"):
            applicability[key] = (30, 90)

    def applicable(metric: str) -> bool:
        minimum, maximum = applicability[metric]
        return minimum <= age_months <= maximum

    # Head/chest standards are practical local screening approximations.
    head_expected = min(56.0, 46.5 + min(int(data.age), 18) * 0.45)
    head_sd = 1.8 if int(data.age) < 7 else 2.2
    chest_expected = height * (0.50 if int(data.age) < 12 else 0.52)
    chest_sd = max(2.5, chest_expected * 0.08)

    metrics = {
        "height": {
            "label": "Bo'y",
            "value": height,
            "unit": "sm",
            "z_score": indices.get("z_h") if applicable("height") else None,
        },
        "weight": {
            "label": "Vazn",
            "value": weight,
            "unit": "kg",
            "z_score": indices.get("z_w") if applicable("weight") else None,
        },
        "bmi": {
            "label": "BMI",
            "value": bmi,
            "unit": "",
            "z_score": indices.get("z_bmi") if applicable("bmi") else None,
        },
        "head": {
            "label": "Bosh aylanasi",
            "value": head,
            "unit": "sm",
            "z_score": round((head - head_expected) / head_sd, 2)
            if head_sd and applicable("head")
            else None,
        },
        "chest": {
            "label": "Ko'krak aylanasi",
            "value": chest,
            "unit": "sm",
            "z_score": round((chest - chest_expected) / chest_sd, 2)
            if chest_sd and applicable("chest")
            else None,
        },
    }

    for key, metric in metrics.items():
        minimum, maximum = applicability[key]
        metric["source"] = "supplied_v6_WHO_LMS_source_audit_pending" if supplied_v6 and key in {"height", "weight", "bmi"} else "local_screening_approximation"
        metric["applicable"] = applicable(key)
        metric["age_range_months"] = {"min": minimum, "max": maximum}
        if not metric["applicable"]:
            metric["not_applicable_reason"] = "Ushbu yosh uchun qo'llanmaydi"
        metric["percentile"] = _z_to_percentile(metric.get("z_score"))
        metric["risk"] = _risk_from_z(metric.get("z_score"))

    worst_rank = {"unknown": 0, "green": 1, "yellow": 2, "red": 3}
    worst = max(
        metrics.values(), key=lambda item: worst_rank.get(item["risk"]["level"], 0)
    )
    return {
        "source": "Supplied v6 WHO LMS; head/chest: local screening" if supplied_v6 else "MorphoCheck local screening approximation (not WHO LMS)",
        "metrics": metrics,
        "summary": worst["risk"],
    }


def build_progress_tracking(
    db: Session, rec: PatientAnalysis, full_name: str
) -> Dict[str, Any]:
    query = db.query(PatientAnalysis).filter(
        PatientAnalysis.id != rec.id,
        PatientAnalysis.is_deleted == 0,
        PatientAnalysis.name == full_name,
    )
    if rec.birth_date:
        query = query.filter(PatientAnalysis.birth_date == rec.birth_date)
    if rec.gender:
        query = query.filter(PatientAnalysis.gender == rec.gender)

    previous = query.order_by(
        PatientAnalysis.created_at.desc(), PatientAnalysis.id.desc()
    ).first()
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
        return {
            "current": current,
            "previous": old,
            "delta": delta,
            "monthly_delta": monthly,
            "unit": unit,
        }

    changes = {
        "height": _change("height", "sm"),
        "weight": _change("weight", "kg"),
        "bmi": _change("bmi", ""),
        "head": _change("head", "sm"),
        "chest": _change("chest", "sm"),
    }

    height_monthly = changes["height"]["monthly_delta"]
    if (
        months is not None
        and height_monthly is not None
        and months >= 2
        and height_monthly < 0.25
    ):
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


def _split_region_and_district(
    region: Optional[str], district: Optional[str]
) -> Tuple[Optional[str], Optional[str]]:
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


# в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
# BMI Kategoriyalar Lug'ati
# в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
_BMI_CAT_I18N = {
    "v_low": {
        "uz": "Vazn yetishmovchiligi (yaqqol)",
        "ky": KY_BMI_CATEGORIES["v_low"],
        "kz": KZ_BMI_CATEGORIES["v_low"],
        "tm": TM_BMI_CATEGORIES["v_low"],
        "ru": "Р’С‹СЂР°Р¶РµРЅРЅС‹Р№ РґРµС„РёС†РёС‚ РјР°СЃСЃС‹",
        "en": "Severe underweight",
    },
    "low": {
        "uz": "Vazn yetishmovchiligi",
        "ky": KY_BMI_CATEGORIES["low"],
        "kz": KZ_BMI_CATEGORIES["low"],
        "tm": TM_BMI_CATEGORIES["low"],
        "ru": "РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅР°СЏ РјР°СЃСЃР° С‚РµР»Р°",
        "en": "Underweight",
    },
    "normal": {
        "uz": "Me'yor",
        "ky": KY_BMI_CATEGORIES["normal"],
        "kz": KZ_BMI_CATEGORIES["normal"],
        "tm": TM_BMI_CATEGORIES["normal"],
        "ru": "РќРѕСЂРјР°",
        "en": "Normal",
    },
    "overweight": {
        "uz": "Ortiqcha vazn",
        "ky": KY_BMI_CATEGORIES["overweight"],
        "kz": KZ_BMI_CATEGORIES["overweight"],
        "tm": TM_BMI_CATEGORIES["overweight"],
        "ru": "РР·Р±С‹С‚РѕС‡РЅР°СЏ РјР°СЃСЃР° С‚РµР»Р°",
        "en": "Overweight",
    },
    "obese": {
        "uz": "Semizlik",
        "ky": KY_BMI_CATEGORIES["obese"],
        "kz": KZ_BMI_CATEGORIES["obese"],
        "tm": TM_BMI_CATEGORIES["obese"],
        "ru": "РћР¶РёСЂРµРЅРёРµ",
        "en": "Obesity",
    },
}

BMI_CATEGORIES = _BMI_CAT_I18N


def _get_bmi_cat(key: str, lang: str, all_settings: Dict[str, Any]) -> str:
    # Key: 'bmi_cat_normal', 'bmi_cat_low', etc.
    setting_key = f"bmi_cat_{key}"
    val = all_settings.get(setting_key, {})
    if val and isinstance(val, dict):
        result = val.get(lang)
        if result:
            return report_text(result, lang)
        if lang == "ky":
            result = _BMI_CAT_I18N.get(key, {}).get("ky", "")
            if result:
                return result
        result = val.get("uz", "")
        if result:
            return report_text(result, lang)
    # Fallback to built-in translations
    built_in = _BMI_CAT_I18N.get(key, {})
    return report_text(built_in.get(lang, built_in.get("uz", key)), lang)


# в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
# Ko'p tilli maslahat lug'ati (generate_advices)
# в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
_ADVICE_I18N = {
    "default_general": {
        "uz": "Sizning jismoniy rivojlanishingiz me'yorida. Salomatlikni saqlashda davom eting.",
        "ru": "Р’Р°С€Рµ С„РёР·РёС‡РµСЃРєРѕРµ СЂР°Р·РІРёС‚РёРµ РІ РЅРѕСЂРјРµ. РџСЂРѕРґРѕР»Р¶Р°Р№С‚Рµ РїРѕРґРґРµСЂР¶РёРІР°С‚СЊ Р·РґРѕСЂРѕРІСЊРµ.",
        "en": "Your physical development is normal. Continue to maintain your health.",
        "kz": "РЎС–Р·РґС–ТЈ С„РёР·РёРєР°Р»С‹Т› РґР°РјСѓС‹ТЈС‹Р· Т›Р°Р»С‹РїС‚С‹. Р”РµРЅСЃР°СѓР»С‹Т“С‹ТЈС‹Р·РґС‹ СЃР°Т›С‚Р°СѓРґС‹ Р¶Р°Р»Т“Р°СЃС‚С‹СЂС‹ТЈС‹Р·.",
    },
    "default_specialist": {
        "uz": "Doimiy nazorat zarur emas. Yillik tibbiy ko'rikdan o'tib turing.",
        "ru": "РџРѕСЃС‚РѕСЏРЅРЅРѕРµ РЅР°Р±Р»СЋРґРµРЅРёРµ РЅРµ С‚СЂРµР±СѓРµС‚СЃСЏ. РџСЂРѕС…РѕРґРёС‚Рµ РµР¶РµРіРѕРґРЅС‹Р№ РјРµРґРѕСЃРјРѕС‚СЂ.",
        "en": "No constant supervision required. Undergo an annual medical check-up.",
        "kz": "РўТ±СЂР°Т›С‚С‹ Р±Р°Т›С‹Р»Р°Сѓ Т›Р°Р¶РµС‚ РµРјРµСЃ. Р–С‹Р» СЃР°Р№С‹РЅТ“С‹ РјРµРґРёС†РёРЅР°Р»С‹Т› С‚РµРєСЃРµСЂСѓРґРµРЅ У©С‚С–ТЈС–Р·.",
    },
    "default_nutrition": {
        "uz": "Sog'lom va muvozanatli ovqatlanish tartibiga rioya qiling.",
        "ru": "РЎРѕР±Р»СЋРґР°Р№С‚Рµ Р·РґРѕСЂРѕРІРѕРµ Рё СЃР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРЅРѕРµ РїРёС‚Р°РЅРёРµ.",
        "en": "Follow a healthy and balanced diet.",
        "kz": "РЎР°Р»Р°СѓР°С‚С‚С‹ Р¶У™РЅРµ С‚РµТЈРіРµСЂС–РјРґС– С‚Р°РјР°Т›С‚Р°РЅСѓ СЂРµР¶РёРјС–РЅ СЃР°Т›С‚Р°ТЈС‹Р·.",
    },
    "default_activity": {
        "uz": "Yoshga mos ravishda kundalik jismoniy faollikni ta'minlang.",
        "ru": "РћР±РµСЃРїРµС‡СЊС‚Рµ РµР¶РµРґРЅРµРІРЅСѓСЋ С„РёР·РёС‡РµСЃРєСѓСЋ Р°РєС‚РёРІРЅРѕСЃС‚СЊ РІ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРё СЃ РІРѕР·СЂР°СЃС‚РѕРј.",
        "en": "Ensure daily physical activity appropriate for age.",
        "kz": "Р–Р°СЃС‹РЅР° СЃУ™Р№РєРµСЃ РєТЇРЅРґРµР»С–РєС‚С– С„РёР·РёРєР°Р»С‹Т› Р±РµР»СЃРµРЅРґС–Р»С–РєС‚С– Т›Р°РјС‚Р°РјР°СЃС‹Р· РµС‚С–ТЈС–Р·.",
    },
    "default_checkups": {
        "uz": "Rejali profilaktik ko'riklar yetarli.",
        "ru": "Р”РѕСЃС‚Р°С‚РѕС‡РЅРѕ РїР»Р°РЅРѕРІС‹С… РїСЂРѕС„РёР»Р°РєС‚РёС‡РµСЃРєРёС… РѕСЃРјРѕС‚СЂРѕРІ.",
        "en": "Routine preventive check-ups are sufficient.",
        "kz": "Р–РѕСЃРїР°СЂР»С‹ РїСЂРѕС„РёР»Р°РєС‚РёРєР°Р»С‹Т› С‚РµРєСЃРµСЂСѓР»РµСЂ Р¶РµС‚РєС–Р»С–РєС‚С–.",
    },
    # Low BMI (Underweight)
    "low_bmi_general": {
        "uz": "Tana vazni yetishmasligi (vazn tanqisligi) aniqlandi. Diqqat qaratish lozim.",
        "ru": "Р’С‹СЏРІР»РµРЅ РґРµС„РёС†РёС‚ РјР°СЃСЃС‹ С‚РµР»Р°. РўСЂРµР±СѓРµС‚СЃСЏ РІРЅРёРјР°РЅРёРµ Рє Р·РґРѕСЂРѕРІСЊСЋ.",
        "en": "Underweight (weight deficiency) identified. Attention is required.",
        "kz": "РЎР°Р»РјР°Т› Р¶РµС‚С–СЃРїРµСѓС€С–Р»С–РіС– (СЃР°Р»РјР°Т› С‚Р°РїС€С‹Р»С‹Т“С‹) Р°РЅС‹Т›С‚Р°Р»РґС‹. РљУ©ТЈС–Р» Р±У©Р»Сѓ Т›Р°Р¶РµС‚.",
    },
    "low_bmi_specialist": {
        "uz": "рџ‘ЁвЂЌвљ•пёЏ Pediatr yoki parhezshunos (dietolog) ko'rigi tavsiya etiladi. Vazn yetishmasligi sabablarini aniqlash zarur.",
        "ru": "рџ‘ЁвЂЌвљ•пёЏ Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ РїРµРґРёР°С‚СЂР° РёР»Рё РґРёРµС‚РѕР»РѕРіР° РґР»СЏ РІС‹СЏРІР»РµРЅРёСЏ РїСЂРёС‡РёРЅ РґРµС„РёС†РёС‚Р° РјР°СЃСЃС‹ С‚РµР»Р°.",
        "en": "рџ‘ЁвЂЌвљ•пёЏ Consultation with a pediatrician or nutritionist is recommended to identify the causes of underweight.",
        "tg": "Муоинаи педиатр ё диетолог тавсия мешавад. Сабабҳои камвазниро муайян кардан зарур аст.",
        "kz": "рџ‘ЁвЂЌвљ•пёЏ РЎР°Р»РјР°Т› Р¶РµС‚С–СЃРїРµСѓС€С–Р»С–РіС–nin СЃРµР±РµРїС‚РµСЂС–РЅ Р°РЅС‹Т›С‚Р°Сѓ ТЇС€С–РЅ РїРµРґРёР°С‚СЂ РЅРµРјРµСЃРµ РґРёРµС‚РѕР»РѕРіС‚С‹ТЈ РєРµТЈРµСЃС– Т±СЃС‹РЅС‹Р»Р°РґС‹.",
    },
    "low_bmi_nutrition": {
        "uz": "рџЌЋ Yuqori kaloriyali va oqsillarga boy ovqatlanish tartibiga o'ting. Kuniga 5-6 marta kichik porsiyalarda ovqatlaning.",
        "ru": "рџЌЋ РџРµСЂРµР№РґРёС‚Рµ РЅР° РІС‹СЃРѕРєРѕРєР°Р»РѕСЂРёР№РЅРѕРµ РїРёС‚Р°РЅРёРµ, Р±РѕРіР°С‚РѕРµ Р±РµР»РєР°РјРё. РџРёС‚Р°Р№С‚РµСЃСЊ 5-6 СЂР°Р· РІ РґРµРЅСЊ РЅРµР±РѕР»СЊС€РёРјРё РїРѕСЂС†РёСЏРјРё.",
        "en": "рџЍЋ Switch to a high-calorie, protein-rich diet. Eat 5-6 times a day in small portions.",
        "tg": "Ба ғизои серкалория ва аз сафеда бой гузаред. Дар як рӯз 5-6 маротиба бо порсияҳои хурд ғизо гиред.",
        "kz": "рџЌЋ РђТ›СѓС‹Р·Т“Р° Р±Р°Р№ Р¶РѕТ“Р°СЂС‹ РєР°Р»РѕСЂРёСЏР»С‹ РґРёРµС‚Р°Т“Р° РєУ©С€С–ТЈС–Р·. РљТЇРЅС–РЅРµ 5-6 СЂРµС‚ Р°Р· РїРѕСЂС†РёСЏРјРµРЅ С‚Р°РјР°Т›С‚Р°РЅС‹ТЈС‹Р·.",
    },
    "low_bmi_activity": {
        "uz": "рџЏѓ Kuchli kardio mashqlarni kamaytirib, mushak massasini oshirishga qaratilgan mashqlarni bajaring.",
        "ru": "рџЏѓ РЈРјРµРЅСЊС€РёС‚Рµ РёРЅС‚РµРЅСЃРёРІРЅС‹Рµ РєР°СЂРґРёРѕРЅР°РіСЂСѓР·РєРё, СЃРѕСЃСЂРµРґРѕС‚РѕС‡СЊС‚РµСЃСЊ РЅР° СѓРїСЂР°Р¶РЅРµРЅРёСЏС… РґР»СЏ РЅР°Р±РѕСЂР° РјС‹С€РµС‡РЅРѕР№ РјР°СЃСЃС‹.",
        "en": "рџЏѓ Reduce intense cardio, focus on exercises to build muscle mass.",
        "tg": "Машқҳои пуршиддати кардиоро кам карда, машқҳои афзоиши массаи мушакҳоро иҷро кунед.",
        "kz": "рџЏѓ ТљР°СЂТ›С‹РЅРґС‹ РєР°СЂРґРёРѕ Р¶Р°С‚С‚С‹Т“СѓР»Р°СЂС‹РЅ Р°Р·Р°Р№С‚С‹Рї, Р±Т±Р»С€С‹Т›РµС‚ РјР°СЃСЃР°СЃС‹РЅ Р°СЂС‚С‚С‹СЂСѓТ“Р° Р±Р°Т“С‹С‚С‚Р°Р»Т“Р°РЅ Р¶Р°С‚С‚С‹Т“СѓР»Р°СЂТ“Р° РЅР°Р·Р°СЂ Р°СѓРґР°СЂС‹ТЈС‹Р·.",
    },
    "low_bmi_checkups": {
        "uz": "рџЏҐ Qon tahlili (gemoglobin), gormonal fon va oshqozon-ichak tizimi tekshiruvidan o'tish tavsiya etiladi.",
        "ru": "рџЏҐ Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ СЃРґР°С‚СЊ Р°РЅР°Р»РёР· РєСЂРѕРІРё (РіРµРјРѕРіР»РѕР±РёРЅ), РїСЂРѕРІРµСЂРёС‚СЊ РіРѕСЂРјРѕРЅР°Р»СЊРЅС‹Р№ С„РѕРЅ Рё Р–РљРў.",
        "en": "рџЏҐ Blood test (hemoglobin), hormonal profile, and gastrointestinal check-up are recommended.",
        "tg": "Гузаронидани таҳлили хун (гемоглобин), санҷиши заминаи гормонӣ ва низоми меъдаю рӯда тавсия мешавад.",
        "kz": "рџЏҐ ТљР°РЅ Р°РЅР°Р»РёР·С–РЅ (РіРµРјРѕРіР»РѕР±РёРЅ) С‚Р°РїСЃС‹СЂСѓ, РіРѕСЂРјРѕРЅР°Р»РґС‹ С„РѕРЅ РјРµРЅ Р°СЃТ›Р°Р·Р°РЅ-С–С€РµРє Р¶РѕР»РґР°СЂС‹РЅ С‚РµРєСЃРµСЂСѓ Т±СЃС‹РЅС‹Р»Р°РґС‹.",
    },
    "high_bmi_general": {
        "uz": "Ortiqcha tana vazni aniqlandi. Bu kelajakda salomatlikka salbiy ta'sir qilishi mumkin.",
        "ru": "Р’С‹СЏРІР»РµРЅ РёР·Р±С‹С‚РѕС‡РЅС‹Р№ РІРµСЃ. Р’ Р±СѓРґСѓС‰РµРј СЌС‚Рѕ РјРѕР¶РµС‚ РЅРµРіР°С‚РёРІРЅРѕ СЃРєР°Р·Р°С‚СЊСЃСЏ РЅР° Р·РґРѕСЂРѕРІСЊРµ.",
        "en": "Excess weight identified. This may negatively affect health in the future.",
        "kz": "РђСЂС‚С‹Т› СЃР°Р»РјР°Т› Р°РЅС‹Т›С‚Р°Р»РґС‹. Р‘Т±Р» Р±РѕР»Р°С€Р°Т›С‚Р° РґРµРЅСЃР°СѓР»С‹Т›Т›Р° РєРµСЂС– У™СЃРµСЂ РµС‚СѓС– РјТЇРјРєС–РЅ.",
    },
    "high_bmi_specialist": {
        "uz": "рџ‘ЁвЂЌвљ•пёЏ Endokrinolog va parhezshunos ko'rigidan o'tish maqsadga muvofiq.",
        "ru": "рџ‘ЁвЂЌвљ•пёЏ Р¦РµР»РµСЃРѕРѕР±СЂР°Р·РЅРѕ РїСЂРѕР№С‚Рё РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЋ СЌРЅРґРѕРєСЂРёРЅРѕР»РѕРіР° Рё РґРёРµС‚РѕР»РѕРіР°.",
        "en": "рџ‘ЁвЂЌвљ•пёЏ It is advisable to consult an endocrinologist and dietitian.",
        "kz": "рџ‘ЁвЂЌвљ•пёЏ Р­РЅРґРѕРєСЂРёРЅРѕР»РѕРі РїРµРЅ РґРёРµС‚РѕР»РѕРі РєРµТЈРµСЃС–РЅРµРЅ У©С‚Сѓ РјР°Т›СЃР°С‚Т›Р° СЃР°Р№.",
    },
    "high_bmi_nutrition": {
        "uz": "рџЌЋ Ratsionda shakar va tez hazm bo'luvchi uglevodlarni cheklang. Ko'proq sabzavotlar iste'mol qiling.",
        "ru": "рџЌЋ РћРіСЂР°РЅРёС‡СЊС‚Рµ СЃР°С…Р°СЂ Рё Р±С‹СЃС‚СЂС‹Рµ СѓРіР»РµРІРѕРґС‹ РІ СЂР°С†РёРѕРЅРµ. РЈРїРѕС‚СЂРµР±Р»СЏР№С‚Рµ Р±РѕР»СЊС€Рµ РѕРІРѕС‰РµР№.",
        "en": "рџЌЋ Limit sugar and fast carbohydrates in your diet. Consume more vegetables.",
        "kz": "рџЌЋ Р Р°С†РёРѕРЅРґР°Т“С‹ Т›Р°РЅС‚ РїРµРЅ С‚РµР· Т›РѕСЂС‹С‚С‹Р»Р°С‚С‹РЅ РєУ©РјС–СЂСЃСѓР»Р°СЂРґС‹ С€РµРєС‚РµТЈС–Р·. РљУ©Р±С–СЂРµРє РєУ©РєУ©РЅС–СЃС‚РµСЂРґС– С‚Т±С‚С‹РЅС‹ТЈС‹Р·.",
    },
    "high_bmi_activity": {
        "uz": "рџЏѓ Kundalik piyoda yurish va suzish kabi aerob mashqlarni ko'paytiring.",
        "ru": "рџЏѓ РЈРІРµР»РёС‡СЊС‚Рµ Р°СЌСЂРѕР±РЅС‹Рµ РЅР°РіСЂСѓР·РєРё, С‚Р°РєРёРµ РєР°Рє РµР¶РµРґРЅРµРІРЅС‹Рµ РїСЂРѕРіСѓР»РєРё Рё РїР»Р°РІР°РЅРёРµ.",
        "en": "рџЏѓ Increase aerobic activities such as daily walking and swimming.",
        "kz": "рџЏѓ РљТЇРЅРґРµР»С–РєС‚С– СЃРµСЂСѓРµРЅРґРµСѓ Р¶У™РЅРµ Р¶ТЇР·Сѓ СЃРёСЏТ›С‚С‹ Р°СЌСЂРѕР±С‚С‹ Р¶Р°С‚С‚С‹Т“СѓР»Р°СЂРґС‹ РєУ©Р±РµР№С‚С–ТЈС–Р·.",
    },
    "high_bmi_checkups": {
        "uz": "рџЏҐ Qondagi qand miqdori va lipid profilini tekshirish tavsiya etiladi.",
        "ru": "рџЏҐ Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ РїСЂРѕРІРµСЂРёС‚СЊ СѓСЂРѕРІРµРЅСЊ СЃР°С…Р°СЂР° РІ РєСЂРѕРІРё Рё Р»РёРїРёРґРЅС‹Р№ РїСЂРѕС„РёР»СЊ.",
        "en": "рџЏҐ It is recommended to check blood sugar levels and lipid profile.",
        "kz": "рџЏҐ ТљР°РЅРґР°Т“С‹ Т›Р°РЅС‚ РјУ©Р»С€РµСЂС–РЅ Р¶У™РЅРµ Р»РёРїРёРґС‚С–Рє РїСЂРѕС„РёР»СЊРґС– С‚РµРєСЃРµСЂСѓ Т±СЃС‹РЅС‹Р»Р°РґС‹.",
    },
}


def _ai(key: str, lang: str, all_settings: Dict[str, Any]) -> str:
    """Maslahat lug'atidan matnni oladi. Agar sozlamalarda bo'lmasa, _ADVICE_I18N dan oladi."""
    setting_key = f"adv_{key}"
    val = all_settings.get(setting_key, {})

    # 1. Database settings (override)
    res = val.get(lang)
    if not res:
        res = val.get("uz")
    if res:
        return report_text(_clean_advice_text(res), lang)

    # 2. Local dictionary fallback
    local_val = _ADVICE_I18N.get(key, {})
    res = local_val.get(lang)
    if not res:
        res = local_val.get("uz")
    if res:
        return report_text(_clean_advice_text(res), lang)

    # 3. Final fallback to key itself
    return key


def _clean_advice_text(text: str) -> str:
    """Remove broken emoji bytes that can appear at the start of advice text."""
    if not isinstance(text, str):
        return text
    return _MOJIBAKE_EMOJI_PREFIX_RE.sub("", text).strip()


_SPORT_I18N = {
    "uz": {
        "sports": {
            "swimming": "suzish",
            "athletics": "yengil atletika",
            "gymnastics": "gimnastika",
            "football": "futbol",
            "wrestling": "kurash",
            "basketball": "basketbol",
            "cycling": "velosport",
        },
        "balanced": "tana ko'rsatkichlari muvozanatli",
        "tall": "bo'y ko'rsatkichi yuqoriroq",
        "compact": "ixcham va chaqqon tana tuzilishi",
        "lean": "yengil vazn va nisbatan nozik tana tuzilishi",
        "high_bmi": "vazn/BMI yuqoriroq bo'lgani uchun bo'g'imlarga yengilroq yuklama ma'qul",
        "strong": "kuch va tayanch-mushak imkoniyatlari yaxshi rivojlanishi mumkin",
        "harmony": "morfologik uyg'unlik yaxshi",
        "endurance": "moslashuv ko'rsatkichlari chidamlilik mashqlariga mos",
        "template": (
            "Sportga yo'naltirish (taxminiy): {primary}. Qo'shimcha yo'nalishlar: {secondary}. "
            "Sabab: {reasons}. Yakuniy tanlovda bolaning qiziqishi, murabbiy bahosi va shifokor ruxsati hisobga olinsin."
        ),
    },
    "ru": {
        "sports": {
            "swimming": "плавание",
            "athletics": "лёгкая атлетика",
            "gymnastics": "гимнастика",
            "football": "футбол",
            "wrestling": "борьба",
            "basketball": "баскетбол",
            "cycling": "велоспорт",
        },
        "balanced": "показатели тела сбалансированы",
        "tall": "показатель роста относительно высокий",
        "compact": "компактное и подвижное телосложение",
        "lean": "лёгкий вес и относительно худощавое телосложение",
        "high_bmi": "вес/BMI выше нормы, поэтому предпочтительна нагрузка с меньшим воздействием на суставы",
        "strong": "силовые и опорно-мышечные возможности могут хорошо развиваться",
        "harmony": "морфологическая гармония хорошая",
        "endurance": "показатели адаптации подходят для тренировок на выносливость",
        "template": (
            "Спортивная ориентация (примерно): {primary}. Дополнительные направления: {secondary}. "
            "Причина: {reasons}. При окончательном выборе следует учитывать интерес ребёнка, оценку тренера и разрешение врача."
        ),
    },
    "kz": {
        "sports": {
            "swimming": "жүзу",
            "athletics": "жеңіл атлетика",
            "gymnastics": "гимнастика",
            "football": "футбол",
            "wrestling": "күрес",
            "basketball": "баскетбол",
            "cycling": "велоспорт",
        },
        "balanced": "дене көрсеткіштері теңгерімді",
        "tall": "бой көрсеткіші салыстырмалы түрде жоғары",
        "compact": "ықшам әрі ширақ дене бітімі",
        "lean": "салмағы жеңіл және дене бітімі салыстырмалы түрде нәзік",
        "high_bmi": "салмақ/BMI жоғары болғандықтан буындарға жеңілірек жүктеме қолайлы",
        "strong": "күш және тірек-бұлшықет мүмкіндіктері жақсы дамуы мүмкін",
        "harmony": "морфологиялық үйлесімділік жақсы",
        "endurance": "бейімделу көрсеткіштері төзімділік жаттығуларына сәйкес",
        "template": (
            "Спортқа бағыттау (шамамен): {primary}. Қосымша бағыттар: {secondary}. "
            "Себебі: {reasons}. Соңғы таңдауда баланың қызығушылығы, жаттықтырушы бағасы және дәрігер рұқсаты ескерілсін."
        ),
    },
    "en": {
        "sports": {
            "swimming": "swimming",
            "athletics": "athletics",
            "gymnastics": "gymnastics",
            "football": "football",
            "wrestling": "wrestling",
            "basketball": "basketball",
            "cycling": "cycling",
        },
        "balanced": "body indicators are balanced",
        "tall": "height indicator is relatively high",
        "compact": "compact and agile body build",
        "lean": "lighter weight and leaner body build",
        "high_bmi": "weight/BMI is higher, so lower joint-load activity is preferable",
        "strong": "strength and musculoskeletal capacity may develop well",
        "harmony": "morphological harmony is good",
        "endurance": "adaptation indicators fit endurance training",
        "template": (
            "Sports orientation (approximate): {primary}. Additional options: {secondary}. "
            "Reason: {reasons}. Final choice should consider the child's interest, coach assessment, and physician clearance."
        ),
    },
    "tr": {
        "sports": {
            "swimming": "yuzme",
            "athletics": "atletizm",
            "gymnastics": "jimnastik",
            "football": "futbol",
            "wrestling": "gures",
            "basketball": "basketbol",
            "cycling": "bisiklet sporu",
        },
        "balanced": "vucut gostergeleri dengeli",
        "tall": "boy gostergesi nispeten yuksek",
        "compact": "kompakt ve cevik vucut yapisi",
        "lean": "hafif kilo ve nispeten ince vucut yapisi",
        "high_bmi": "kilo/BMI daha yuksek oldugundan, eklemlere daha az yuk bindiren aktiviteler tercih edilmelidir",
        "strong": "guc ve kas-iskelet kapasitesi iyi gelisebilir",
        "harmony": "morfolojik uyum iyi",
        "endurance": "adaptasyon gostergeleri dayaniklilik antrenmanlarina uygun",
        "template": (
            "Spor yonlendirmesi (tahmini): {primary}. Ek secenekler: {secondary}. "
            "Neden: {reasons}. Son secimde cocugun ilgisi, antrenor degerlendirmesi ve doktor izni dikkate alinmalidir."
        ),
    },
}


def _sport_text(lang: str) -> Dict[str, Any]:
    return _SPORT_I18N.get(lang, _SPORT_I18N.get("uz"))


def _build_sport_recommendation(
    bmi: float,
    bmi_range: Dict[str, float],
    bio_data: Optional[dict],
    lang: str,
) -> str:
    txt = _sport_text(lang)
    sport_names = txt["sports"]
    scores = {
        "swimming": 1.0,
        "athletics": 1.0,
        "gymnastics": 1.0,
        "football": 1.0,
        "wrestling": 1.0,
        "basketball": 1.0,
        "cycling": 1.0,
    }
    reasons = [txt["balanced"]]

    z_h = 0.0
    mii = 0.0
    hmai = 0.0
    morph_key = ""
    if isinstance(bio_data, dict):
        z_h = float(bio_data.get("z_h") or 0)
        mii = float(bio_data.get("mii") or 0)
        hmai = float(bio_data.get("hmai") or 0)
        morph_key = str(bio_data.get("morphological_type_key") or "").lower()

    if z_h >= 1.0:
        scores["basketball"] += 3
        scores["athletics"] += 1
        reasons.append(txt["tall"])
    elif z_h <= -0.7:
        scores["gymnastics"] += 2
        scores["football"] += 1
        reasons.append(txt["compact"])

    if bmi < bmi_range["min"]:
        scores["gymnastics"] += 2
        scores["athletics"] += 1
        scores["swimming"] += 1
        reasons.append(txt["lean"])
    elif bmi > bmi_range["max"]:
        scores["swimming"] += 3
        scores["cycling"] += 2
        scores["football"] += 1
        reasons.append(txt["high_bmi"])

    if "asten" in morph_key or "ecto" in morph_key:
        scores["gymnastics"] += 2
        scores["athletics"] += 2
        scores["swimming"] += 1
    elif "giper" in morph_key or "endo" in morph_key:
        scores["wrestling"] += 3
        scores["swimming"] += 2
        scores["cycling"] += 1
        reasons.append(txt["strong"])
    elif "norm" in morph_key or "mezo" in morph_key:
        scores["football"] += 2
        scores["athletics"] += 2
        scores["wrestling"] += 1
        reasons.append(txt["harmony"])

    if mii >= 80:
        scores["football"] += 1
        scores["gymnastics"] += 1
        scores["wrestling"] += 1
    if hmai >= 80:
        scores["athletics"] += 1
        scores["cycling"] += 1
        reasons.append(txt["endurance"])

    ranked = sorted(scores, key=lambda key: (-scores[key], key))
    primary = sport_names[ranked[0]]
    secondary = ", ".join(sport_names[key] for key in ranked[1:3])
    unique_reasons = []
    for reason in reasons:
        if reason not in unique_reasons:
            unique_reasons.append(reason)

    return txt["template"].format(
        primary=primary,
        secondary=secondary,
        reasons=", ".join(unique_reasons[:3]),
    )


# Kalit so'zlar til bo'yicha (bio_data advice larini guruhlash uchun)
_KW = {
    "nutrition": {
        "uz": [
            "shirinlik",
            "ovqat",
            "suv",
            "oqsil",
            "ratsion",
            "iste'mol",
            "parhez",
            "yog'",
            "vitamin",
            "kalori",
            "sabzavot",
            "meva",
            "taom",
        ],
        "ru": [
            "СЃР»Р°РґРє",
            "РїРёС‚Р°РЅРё",
            "РІРѕРґ",
            "Р±РµР»РѕРє",
            "СЂР°С†РёРѕРЅ",
            "РїРѕС‚СЂРµР±Р»",
            "РґРёРµС‚",
            "Р¶РёСЂ",
            "РІРёС‚Р°РјРёРЅ",
            "РєР°Р»РѕСЂРё",
            "РѕРІРѕС‰",
            "С„СЂСѓРєС‚",
            "РїРёС‰",
        ],
        "en": [
            "sweet",
            "food",
            "water",
            "protein",
            "diet",
            "consum",
            "fat",
            "vitamin",
            "calori",
            "vegetabl",
            "fruit",
            "nutri",
        ],
        "kz": [
            "тәтті",
            "тамақ",
            "су",
            "ақуыз",
            "рацион",
            "тұтын",
            "парhez",
            "май",
            "дәрумен",
            "калори",
            "көкөніс",
            "жеміс",
        ],
        "tr": [
            "tatli",
            "yemek",
            "su",
            "protein",
            "diyet",
            "tuket",
            "beslen",
            "yag",
            "vitamin",
            "kalori",
            "sebze",
            "meyve",
        ],
    },
    "specialist": {
        "uz": [
            "pediatr",
            "endokrinolog",
            "mutaxassis",
            "ko'rig",
            "maslahat",
            "shifokor",
            "dРѕktor",
        ],
        "ru": [
            "РїРµРґРёР°С‚СЂ",
            "СЌРЅРґРѕРєСЂРёРЅРѕР»РѕРі",
            "СЃРїРµС†РёР°Р»РёСЃС‚",
            "РєРѕРЅСЃСѓР»СЊС‚Р°С†",
            "РІСЂР°С‡",
            "РґРѕРєС‚РѕСЂ",
        ],
        "en": [
            "pediatr",
            "endocrinolog",
            "specialist",
            "consult",
            "doctor",
            "physician",
        ],
        "kz": [
            "педиатр",
            "эндокринолог",
            "маман",
            "кеңес",
            "дәрігер",
        ],
        "tr": [
            "pediatrist",
            "endokrinolog",
            "uzman",
            "muayene",
            "doktor",
            "hekim",
            "tavsiye",
        ],
    },
    "activity": {
        "uz": [
            "mashq",
            "sport",
            "faollik",
            "harakat",
            "badantarbiya",
            "jismoniy",
            "yugurish",
            "suzish",
            "gimnastika",
        ],
        "ru": [
            "СѓРїСЂР°Р¶РЅРµРЅ",
            "СЃРїРѕСЂС‚",
            "Р°РєС‚РёРІРЅРѕСЃС‚",
            "РґРІРёР¶РµРЅ",
            "С„РёР·РёС‡РµСЃРє",
            "Р±РµРі",
            "РїР»Р°РІР°РЅРё",
            "РіРёРјРЅР°СЃС‚РёРє",
        ],
        "en": [
            "exercise",
            "sport",
            "activit",
            "movement",
            "physical",
            "running",
            "swimming",
            "gymnastic",
        ],
        "kz": [
            "жаттығу",
            "спорт",
            "белсенді",
            "қозғалыс",
            "дене",
            "жүгіру",
            "жүзу",
        ],
        "tr": [
            "egzersiz",
            "spor",
            "aktivite",
            "hareket",
            "fiziksel",
            "kosu",
            "yuzme",
            "jimnastik",
        ],
    },
    "checkups": {
        "uz": ["tahlil", "tekshiruv", "nazorat"],
        "ru": [
            "Р°РЅР°Р»РёР·",
            "РѕР±СЃР»РµРґРѕРІР°РЅ",
            "РєРѕРЅС‚СЂРѕР»",
            "РјРѕРЅРёС‚РѕСЂРёРЅРі",
        ],
        "en": ["test", "check", "monitor", "examination", "lab"],
        "kz": ["талдау", "тексеру", "бақылау"],
        "tr": ["test", "analiz", "kontrol", "muayene"],
    },
}


def generate_advices(
    bmi: float,
    weight_diff: float,
    age: int,
    gender: str,
    all_settings: Dict[str, Any],
    bio_data: dict = None,
    ppe_data: str = None,
    lang: str = "uz",
) -> Dict[str, str]:
    bmi_range = get_bmi_range_by_age_and_gender(age, gender)

    res = {
        "general": _ai("default_general", lang, all_settings),
        "specialist": _ai("default_specialist", lang, all_settings),
        "nutrition": _ai("default_nutrition", lang, all_settings),
        "activity": _ai("default_activity", lang, all_settings),
        "checkups": _ai("default_checkups", lang, all_settings),
        "sport": _build_sport_recommendation(bmi, bmi_range, bio_data, lang),
    }

    # 1. BMI based advice
    if bmi < bmi_range["min"]:
        res["general"] = _ai("low_bmi_general", lang, all_settings)
        res["specialist"] = _ai("low_bmi_specialist", lang, all_settings)
        res["nutrition"] = _ai("low_bmi_nutrition", lang, all_settings)
        res["activity"] = _ai("low_bmi_activity", lang, all_settings)
        res["checkups"] = _ai("low_bmi_checkups", lang, all_settings)
    elif bmi > bmi_range["max"]:
        res["general"] = _ai("high_bmi_general", lang, all_settings)
        res["specialist"] = _ai("high_bmi_specialist", lang, all_settings)
        res["nutrition"] = _ai("high_bmi_nutrition", lang, all_settings)
        res["activity"] = _ai("high_bmi_activity", lang, all_settings)
        res["checkups"] = _ai("high_bmi_checkups", lang, all_settings)

    # 2. Bioimpedance and Indices based advice (from bio_data)
    if bio_data:
        raw_advices = bio_data.get("advice", [])
        kw_lang = all_settings.get("keywords", {})  # keywords settings modelda bo'lsa
        # Agar keywords settingda bo'lmasa fallback _KW (hozircha shunday qolishi mumkin)
        if not kw_lang:
            kw_lang = _KW

        defv = {
            "general": _ai("default_general", lang, all_settings),
            "specialist": _ai("default_specialist", lang, all_settings),
            "nutrition": _ai("default_nutrition", lang, all_settings),
            "activity": _ai("default_activity", lang, all_settings),
            "checkups": _ai("default_checkups", lang, all_settings),
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

    # 3. Play & Preschool Engagement based advice
    if ppe_data:
        try:
            ppe = json.loads(ppe_data)
            ppe_advices = []

            # Contextual analysis of PPE
            if ppe.get("ppe_group_play") == "Low" or ppe.get("ppe_peer_interaction") == "Rare":
                if lang == "ru":
                    ppe_advices.append("Рекомендуется вовлекать ребенка в совместные игры для развития социальных навыков.")
                elif lang == "en":
                    ppe_advices.append("Encourage the child to participate in group games to develop social skills.")
                else:
                    ppe_advices.append("Bolani ijtimoiy ko'nikmalarni rivojlantirish uchun jamoaviy o'yinlarga jalb qilish tavsiya etiladi.")

            if ppe.get("ppe_physical_activity") == "Low" or ppe.get("ppe_daily_physical_activity") == "<1 hour":
                if lang == "ru":
                    ppe_advices.append("Необходимо увеличить ежедневную физическую активность (минимум 1-2 часа активных игр).")
                elif lang == "en":
                    ppe_advices.append("It is necessary to increase daily physical activity (at least 1-2 hours of active play).")
                else:
                    ppe_advices.append("Kundalik jismoniy faollikni oshirish zarur (kamida 1-2 soat faol o'yinlar).")

            if ppe.get("ppe_screen_time") == ">2 hours":
                if lang == "ru":
                    ppe_advices.append("Следует ограничить время перед экраном (менее 1-2 часов в день).")
                elif lang == "en":
                    ppe_advices.append("Screen time should be limited (less than 1-2 hours per day).")
                else:
                    ppe_advices.append("Ekran oldidagi vaqtni cheklash lozim (kuniga 1-2 soatdan kam).")

            if ppe.get("ppe_sleep_routine") == "Irregular" or ppe.get("ppe_fatigue_activity") == "High" or ppe.get("ppe_fatigue_home") == "Often":
                if lang == "ru":
                    ppe_advices.append("Обратите внимание на режим сна и отдыха, ребенок часто испытывает утомляемость.")
                elif lang == "en":
                    ppe_advices.append("Pay attention to sleep and rest routines, the child often experiences fatigue.")
                else:
                    ppe_advices.append("Uyqu va dam olish rejimiga e'tibor qarating, bolada toliqish holatlari ko'p uchraydi.")

            if ppe.get("ppe_appetite") == "Poor":
                if lang == "ru":
                    ppe_advices.append("Сниженный аппетит может требовать коррекции рациона и консультации педиатра.")
                elif lang == "en":
                    ppe_advices.append("Poor appetite may require diet correction and a pediatrician consultation.")
                else:
                    ppe_advices.append("Ishtahaning pastligi ovqatlanish ratsionini to'g'rilashni talab qilishi mumkin.")

            if ppe_advices:
                res["play_preschool"] = " ".join(ppe_advices)
            else:
                if lang == "ru":
                    res["play_preschool"] = "Показатели активности и социализации в пределах возрастной нормы."
                elif lang == "en":
                    res["play_preschool"] = "Activity and socialization indicators are within the age norm."
                else:
                    res["play_preschool"] = "Faollik va ijtimoiylashuv ko'rsatkichlari yosh normasiga mos keladi."
        except Exception as e:
            logger.error(f"Error parsing ppe_data: {e}")

    return {key: _clean_advice_text(value) for key, value in res.items()}
