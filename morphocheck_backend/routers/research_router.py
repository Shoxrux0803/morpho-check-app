from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime
from models.user import User
from models.userdata import ResearchRecord
from models.schemas import ResearchRecordCreate, ResearchRecordOut
from utils.database import get_db
from routers.auth_router import get_current_user
from services.research_docx import generate_researcher_docx
from services.research_summary_docx import generate_research_summary_docx
from services.indices_service import calculate_detailed_indices
import pandas as pd
import io
import urllib.parse
import calendar
from jose import JWTError, jwt
import os
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from utils.translit import lat2cyr

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_please_change_in_prod")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(tags=["Researcher"])

RESEARCH_IMPORT_FIELDS = [
    "full_name", "school_name", "settlement", "birth_place", "birth_date", "gender",
    "father_nationality", "mother_nationality", "living_since", "enrolled_date",
    "living_conditions", "labor_regime", "past_illnesses", "children_count", "child_order",
    "feeding_type", "parents_marriage", "mother_health_status", "parents_phone",
    "examination_date",
    "lower_leg_total",
    "lower_leg_spina_iliaca", "lower_leg_symphysion", "lower_leg_length", "tibiale_height",
    "pelvic_width", "thigh_length", "thigh_circumference", "calf_length",
    "calf_circumference", "foot_length", "teeth_count", "menstruation_start",
    "skull_longitudinal", "skull_transverse", "head_circumference", "forehead_transverse",
    "skull_height", "skull_base_length", "skull_base_width", "face_bizygomatic",
    "face_bigonial", "face_morphological_height", "face_physiognomic_height", "nose_height",
    "nose_width", "outer_canthal_width", "inner_canthal_width", "lips_mucosa_height",
    "mouth_width", "chest_standing_height", "chest_sitting_height", "weight",
    "trunk_length", "torso_length", "chest_circumference_pause",
    "chest_circumference_inhale", "chest_circumference_exhale", "waist_circumference",
    "abdomen_circumference", "upper_segment_length", "chest_transverse_diameter",
    "chest_anteroposterior_diameter", "chest_height", "arm_length", "shoulder_length",
    "shoulder_width", "arm_circumference_total", "shoulder_circumference_rest",
    "shoulder_circumference_flexed", "forearm_length", "hand_length", "dynamometry",
    "fat_triceps", "fat_biceps", "fat_subscapular", "fat_iliac", "fat_popliteal",
    "father_height", "mother_height",
]

RESEARCH_IMPORT_ALIASES = {
    "fish": "full_name",
    "f.i.sh": "full_name",
    "f i sh": "full_name",
    "fio": "full_name",
    "ism familiya": "full_name",
    "full name": "full_name",
    "maktab": "school_name",
    "maktab muassasa": "school_name",
    "school": "school_name",
    "aholi punkti": "settlement",
    "yashash joyi": "settlement",
    "settlement": "settlement",
    "tugilgan joy": "birth_place",
    "tugilgan joyi": "birth_place",
    "tug ilgan joy": "birth_place",
    "tug ilgan joyi": "birth_place",
    "birth place": "birth_place",
    "tugilgan sana": "birth_date",
    "tugilgan sanasi": "birth_date",
    "tug ilgan sana": "birth_date",
    "tug ilgan sanasi": "birth_date",
    "birth date": "birth_date",
    "jinsi": "gender",
    "jins": "gender",
    "pol": "gender",
    "gender": "gender",
    "sex": "gender",
    "oziqlanish turi": "feeding_type",
    "ovqatlanish turi": "feeding_type",
    "oziqlanish": "feeding_type",
    "ovqatlanish": "feeding_type",
    "feeding type": "feeding_type",
    "nutrition type": "feeding_type",
    "ota ona qarindoshligi": "parents_marriage",
    "ota ona nikohi": "parents_marriage",
    "ota onaning qarindoshligi": "parents_marriage",
    "ota onasi qarindoshligi": "parents_marriage",
    "parents marriage": "parents_marriage",
    "parents kinship": "parents_marriage",
    "consanguinity": "parents_marriage",
    "telefon": "parents_phone",
    "ota ona telefoni": "parents_phone",
    "parents phone": "parents_phone",
    "father height": "father_height",
    "ota boyi": "father_height",
    "ota bo'yi": "father_height",
    "mother height": "mother_height",
    "ona boyi": "mother_height",
    "ona bo'yi": "mother_height",
    "pastki oyoq qol": "lower_leg_total",
    "pastki oyoq qul": "lower_leg_total",
    "pastki oyoq qo l": "lower_leg_total",
    "pastki oyoq": "lower_leg_total",
    "lower leg total": "lower_leg_total",
    "pastki oyoq qol uzunligi": "lower_leg_length",
    "pastki oyoq qul uzunligi": "lower_leg_length",
    "pastki oyoq qo l uzunligi": "lower_leg_length",
    "pastki oyoq uzunligi": "lower_leg_length",
    "lower leg length": "lower_leg_length",
    "tekshiruv sanasi": "examination_date",
    "examination date": "examination_date",
    "vazn": "weight",
    "weight": "weight",
    "boy": "chest_standing_height",
    "bo'y": "chest_standing_height",
    "bo yi": "chest_standing_height",
    "bo yi tik": "chest_standing_height",
    "boyi tik": "chest_standing_height",
    "standing height": "chest_standing_height",
    "height": "chest_standing_height",
    "bo yi otirgan": "chest_sitting_height",
    "boyi otirgan": "chest_sitting_height",
    "sitting height": "chest_sitting_height",
    "ona sog ligi": "mother_health_status",
}

RESEARCH_EXPORT_FIELD_ORDER = [
    "created_at", "id", "full_name", "school_name", "settlement", "birth_place", "birth_date",
    "gender", "father_nationality", "mother_nationality", "living_since", "enrolled_date",
    "living_conditions", "labor_regime", "past_illnesses", "children_count", "child_order",
    "feeding_type", "parents_marriage", "mother_health_status", "examination_date",
    "lower_leg_total", "lower_leg_spina_iliaca", "lower_leg_symphysion",
    "lower_leg_length", "tibiale_height", "pelvic_width", "thigh_length", "thigh_circumference", "calf_length",
    "calf_circumference", "foot_length", "teeth_count", "menstruation_start",
    "skull_longitudinal", "skull_transverse", "head_circumference", "forehead_transverse",
    "skull_height", "skull_base_length", "skull_base_width", "face_bizygomatic",
    "face_bigonial", "face_morphological_height", "face_physiognomic_height", "nose_height",
    "nose_width", "outer_canthal_width", "inner_canthal_width", "lips_mucosa_height",
    "mouth_width", "chest_standing_height", "chest_sitting_height", "weight", "trunk_length",
    "torso_length", "chest_circumference_pause", "chest_circumference_inhale",
    "chest_circumference_exhale", "waist_circumference", "abdomen_circumference",
    "upper_segment_length", "chest_transverse_diameter", "chest_anteroposterior_diameter",
    "chest_height", "arm_length", "shoulder_length", "shoulder_width",
    "shoulder_circumference_rest", "shoulder_circumference_flexed", "forearm_length",
    "hand_length", "dynamometry", "fat_triceps", "fat_biceps", "fat_subscapular",
    "fat_iliac", "fat_popliteal",
]
RESEARCH_EXPORT_HEADERS = [
    "Сана", "ID", "Ф.И.Ш.", "Мактаб/Муассаса", "Аҳоли пункти", "Туғилган жойи",
    "Туғилган санаси", "Отасининг миллати", "Онасининг миллати", "Қачондан бери яшайди",
    "Рўйхатга олинган сана", "Яшаш шароити", "Меҳнат режими", "Ўтказилган касалликлар",
    "Болалар сони", "Бола нечанчи", "Озиқланиш тури", "Ота-она никоҳи", "Она соғлиғи",
    "Текширув санаси", "Отасининг бўйи (см)", "Онасининг бўйи (см)",
    "Олд юқори ёнбош ўсимтасидан (см)", "Қовуқ устидан (см)", "Болдир баландлиги (см)",
    "Чанноқ кенглиги (см)", "Сон узунлиги (см)", "Сон айланаси (см)",
    "Болдир узунлиги (см)", "Болдир айланаси (см)", "Оёқ кафти узунлиги (см)",
    "Тишлар сони", "Ҳайз бошланиши", "Бош суяги бўйлама (см)",
    "Бош суяги кўндаланг (см)", "Бош айланаси (см)", "Пешона кўндаланг (см)",
    "Бош суяги баландлиги (см)", "Бош суяги асоси узунлиги (см)",
    "Бош суяги асоси кенглиги (см)", "Юз кенглиги (см)", "Пастки жағ кенглиги (см)",
    "Юз морфологик баландлиги (см)", "Юз физиогномик баландлиги (см)",
    "Бурун баландлиги (см)", "Бурун кенглиги (см)", "Кўз ташқи бурчаклари (см)",
    "Кўз ички бурчаклари (см)", "Лаблар шиллиқ қавати (см)", "Оғиз кенглиги (см)",
    "Бўйи (тик) (см)", "Бўйи (ўтирган) (см)", "Вазн (кг)", "Гавда узунлиги (см)",
    "Тана узунлиги (см)", "Кўкрак айланаси (пауза) (см)",
    "Кўкрак айланаси (нафас) (см)", "Кўкрак айланаси (чиқариш) (см)",
    "Бел айланаси (см)", "Қорин айланаси (см)", "Юқори сегмент узунлиги (см)",
    "Кўкрак кўндаланг (см)", "Кўкрак олд-орқа (см)", "Кўкрак баландлиги (см)",
    "Қўл узунлиги (см)", "Елка узунлиги (см)", "Елка кенглиги (см)",
    "Елка айланаси (тинч) (см)", "Елка айланаси (букилган) (см)",
    "Билак узунлиги (см)", "Қўл кафти узунлиги (см)", "Динамометрия (кг)",
    "Трицепс ёғ (мм)", "Бицепс ёғ (мм)", "Курак ости ёғ (мм)", "Ёнбош ёғ (мм)",
    "Тизза ости ёғ (мм)",
]

INTEGER_IMPORT_FIELDS = {"children_count", "child_order", "teeth_count"}
FLOAT_IMPORT_FIELDS = {
    field for field in RESEARCH_IMPORT_FIELDS
    if field not in INTEGER_IMPORT_FIELDS and field not in {
        "full_name", "school_name", "settlement", "birth_place", "birth_date", "gender",
        "father_nationality", "mother_nationality", "living_since", "enrolled_date",
        "living_conditions", "labor_regime", "past_illnesses", "feeding_type",
        "parents_marriage", "mother_health_status", "parents_phone", "examination_date",
        "menstruation_start",
    }
}

RESEARCH_TEMPLATE_LABELS = {
    "full_name": "F.I.SH",
    "school_name": "Maktab / muassasa",
    "settlement": "Aholi punkti",
    "birth_place": "Tug'ilgan joy",
    "birth_date": "Tug'ilgan sana (YYYY-MM-DD)",
    "gender": "Jinsi",
    "father_nationality": "Ota millati",
    "mother_nationality": "Ona millati",
    "children_count": "Bolalar soni",
    "child_order": "Nechanchi farzand",
    "feeding_type": "Oziqlanish turi",
    "parents_marriage": "Ota-ona nikohi",
    "mother_health_status": "Ona sog'ligi",
    "parents_phone": "Ota-ona telefoni",
    "examination_date": "Tekshiruv sanasi (YYYY-MM-DD)",
    "lower_leg_total": "Pastki oyoq-qo'l (sm)",
    "lower_leg_length": "Pastki oyoq-qo'l uzunligi (sm)",
    "chest_standing_height": "Bo'yi tik (sm)",
    "chest_sitting_height": "Bo'yi o'tirgan (sm)",
    "weight": "Vazn (kg)",
    "head_circumference": "Bosh aylanasi (sm)",
    "waist_circumference": "Bel aylanasi (sm)",
    "father_height": "Ota bo'yi (sm)",
    "mother_height": "Ona bo'yi (sm)",
}

RESEARCH_TEMPLATE_EXAMPLE = {
    "full_name": "Aliyev Ali Valiyevich",
    "school_name": "12-maktab",
    "settlement": "Toshkent",
    "birth_place": "Toshkent",
    "birth_date": "2015-04-18",
    "gender": "Boy",
    "father_nationality": "O'zbek",
    "mother_nationality": "O'zbek",
    "children_count": 3,
    "child_order": 1,
    "feeding_type": "Tabiiy",
    "parents_marriage": "Qarindosh emas",
    "mother_health_status": "Sog'lom",
    "parents_phone": "+998901234567",
    "examination_date": datetime.now().strftime("%Y-%m-%d"),
    "lower_leg_total": 64.5,
    "lower_leg_length": 37.2,
    "chest_standing_height": 125.5,
    "chest_sitting_height": 68.2,
    "weight": 26.4,
    "head_circumference": 52.1,
    "waist_circumference": 58.0,
    "father_height": 172.0,
    "mother_height": 164.0,
}


def research_record_to_dict(record: ResearchRecord) -> dict:
    payload = {
        column.name: getattr(record, column.name)
        for column in ResearchRecord.__table__.columns
    }
    payload["created_by_name"] = (
        record.created_by.name
        if getattr(record, "created_by", None)
        else None
    )
    payload["created_by_email"] = (
        record.created_by.email
        if getattr(record, "created_by", None)
        else None
    )
    payload["deleted_by_name"] = (
        record.deleted_by.name
        if getattr(record, "deleted_by", None)
        else None
    )
    return payload


def format_research_gender_for_xlsx(value) -> str:
    gender = str(value or "").strip().lower()
    if gender in {"boy", "o'g'il", "ogil", "o'g'il bola", "ogil bola"}:
        return "Ўғил бола"
    if gender in {"girl", "qiz", "qiz bola"}:
        return "Қиз бола"
    if gender in {"erkak", "male"}:
        return "Эркак"
    if gender in {"ayol", "female"}:
        return "Аёл"
    return lat2cyr(str(value)) if value else "-"


RESEARCH_INDEX_EXPORT_FIELDS = [
    "tvi",
    "z_h",
    "z_w",
    "z_bmi",
    "z_body_length",
    "centile",
    "corridor",
    "morphological_type",
    "hmai",
    "mii",
    "adi",
    "mcri",
]

RESEARCH_INDEX_EXPORT_LABELS = {
    "uz": {
        "tvi": "ТВИ",
        "z_h": "Бўй-ёш z-score",
        "z_w": "Вазн-ёш z-score",
        "z_bmi": "ТВИ-ёш z-score",
        "z_body_length": "Тана узунлиги z-score",
        "centile": "Сентил интервали",
        "corridor": "Соғломлик йўлаги",
        "morphological_type": "Соматотип",
        "hmai": "HMAI",
        "mii": "MII",
        "adi": "ADI",
        "mcri": "MCRI",
    },
    "ru": {
        "tvi": "ИМТ",
        "z_h": "Рост-возраст z-score",
        "z_w": "Вес-возраст z-score",
        "z_bmi": "ИМТ-возраст z-score",
        "z_body_length": "Длина тела z-score",
        "centile": "Центильный интервал",
        "corridor": "Коридор здоровья",
        "morphological_type": "Соматотип",
        "hmai": "HMAI",
        "mii": "MII",
        "adi": "ADI",
        "mcri": "MCRI",
    },
    "en": {
        "tvi": "BMI",
        "z_h": "Height-for-age z-score",
        "z_w": "Weight-for-age z-score",
        "z_bmi": "BMI-for-age z-score",
        "z_body_length": "Body length z-score",
        "centile": "Centile interval",
        "corridor": "Health corridor",
        "morphological_type": "Somatotype",
        "hmai": "HMAI",
        "mii": "MII",
        "adi": "ADI",
        "mcri": "MCRI",
    },
    "kz": {
        "tvi": "ДСИ",
        "z_h": "Бой-жас z-score",
        "z_w": "Салмақ-жас z-score",
        "z_bmi": "ДСИ-жас z-score",
        "z_body_length": "Дене ұзындығы z-score",
        "centile": "Центильдік интервал",
        "corridor": "Денсаулық дәлізі",
        "morphological_type": "Соматотип",
        "hmai": "HMAI",
        "mii": "MII",
        "adi": "ADI",
        "mcri": "MCRI",
    },
}

RESEARCH_CHILD_AGE_EXPORT_LABELS = {
    "uz": "Текширув санасидаги ёши",
    "ru": "Возраст на дату обследования",
    "en": "Age at examination",
    "kz": "Тексеру күніндегі жасы",
}

RESEARCH_CHILD_AGE_UNITS = {
    "uz": ("ёш", "ой", "кун"),
    "ru": ("г.", "мес.", "дн."),
    "en": ("years", "months", "days"),
    "kz": ("жас", "ай", "күн"),
}

RESEARCH_INDEX_VALUE_LABELS = {
    "corridor": {
        "uz": {
            "< 3": "Жуда кам вазн (<3-сентил)",
            "3 - 15": "Кам вазн (3-15-сентил)",
            "15 - 85": "Меъёр (15-85-сентил)",
            "85 - 97": "Ортиқча вазн (85-97-сентил)",
            "> 97": "Семизлик (>97-сентил)",
        },
        "ru": {
            "< 3": "Крайний дефицит массы (<3-центиль)",
            "3 - 15": "Дефицит массы (3-15-центиль)",
            "15 - 85": "Норма (15-85-центиль)",
            "85 - 97": "Избыточная масса (85-97-центиль)",
            "> 97": "Ожирение (>97-центиль)",
        },
        "en": {
            "< 3": "Severe underweight (<3rd centile)",
            "3 - 15": "Underweight (3rd-15th centile)",
            "15 - 85": "Normal (15th-85th centile)",
            "85 - 97": "Overweight (85th-97th centile)",
            "> 97": "Obesity (>97th centile)",
        },
        "kz": {
            "< 3": "Салмақтың өте төмендігі (<3-центиль)",
            "3 - 15": "Салмақ тапшылығы (3-15-центиль)",
            "15 - 85": "Норма (15-85-центиль)",
            "85 - 97": "Артық салмақ (85-97-центиль)",
            "> 97": "Семіздік (>97-центиль)",
        },
    },
    "morphological_type": {
        "uz": {
            "astenik": "Астеник",
            "normostenik": "Нормостеник",
            "giperstenik": "Гиперстеник",
        },
        "ru": {
            "astenik": "Астенический",
            "normostenik": "Нормостенический",
            "giperstenik": "Гиперстенический",
        },
        "en": {
            "astenik": "Asthenic",
            "normostenik": "Normosthenic",
            "giperstenik": "Hypersthenic",
        },
        "kz": {
            "astenik": "Астеник",
            "normostenik": "Нормостеник",
            "giperstenik": "Гиперстеник",
        },
    },
}


def get_research_index_export_headers(lang: str):
    labels = RESEARCH_INDEX_EXPORT_LABELS.get(lang, RESEARCH_INDEX_EXPORT_LABELS["uz"])
    return [
        (labels.get(field, RESEARCH_INDEX_EXPORT_LABELS["uz"].get(field, field)), field)
        for field in RESEARCH_INDEX_EXPORT_FIELDS
    ]


def normalize_export_lang(lang: Optional[str]) -> str:
    value = (lang or "uz").strip().lower()
    return value if value in RESEARCH_INDEX_EXPORT_LABELS else "uz"


def get_research_index_value_label(group: str, key: str, lang: str):
    values = RESEARCH_INDEX_VALUE_LABELS.get(group, {})
    lang_values = values.get(lang, values.get("uz", {}))
    return lang_values.get(key, key)


def get_research_child_age_export_header(lang: str):
    return RESEARCH_CHILD_AGE_EXPORT_LABELS.get(lang, RESEARCH_CHILD_AGE_EXPORT_LABELS["uz"])


def _parse_research_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text[:10], fmt)
        except ValueError:
            continue
    return None


def _calculate_research_age_parts(record: ResearchRecord):
    birth_date = _parse_research_date(record.birth_date)
    if not birth_date:
        return None
    exam_date = _parse_research_date(record.examination_date)
    if not exam_date:
        return None
    if exam_date < birth_date:
        return None

    years = exam_date.year - birth_date.year
    months = exam_date.month - birth_date.month
    days = exam_date.day - birth_date.day

    if days < 0:
        months -= 1
        prev_month = exam_date.month - 1 or 12
        prev_year = exam_date.year if exam_date.month > 1 else exam_date.year - 1
        days += calendar.monthrange(prev_year, prev_month)[1]

    if months < 0:
        years -= 1
        months += 12

    return years, months, days


def format_research_child_age(record: ResearchRecord, lang: str = "uz"):
    parts = _calculate_research_age_parts(record)
    if not parts:
        return None
    years, months, days = parts
    year_unit, month_unit, day_unit = RESEARCH_CHILD_AGE_UNITS.get(
        normalize_export_lang(lang),
        RESEARCH_CHILD_AGE_UNITS["uz"],
    )
    return f"{years} {year_unit} {months} {month_unit} {days} {day_unit}"


def _calculate_research_age(record: ResearchRecord) -> Optional[int]:
    parts = _calculate_research_age_parts(record)
    if not parts:
        return None
    return parts[0]


def build_research_index_export_values(record: ResearchRecord, lang: str = "uz") -> dict:
    height = float(record.chest_standing_height or 0)
    weight = float(record.weight or 0)
    age = _calculate_research_age(record)
    if age is None or height <= 0 or weight <= 0:
        return {field: None for field in RESEARCH_INDEX_EXPORT_FIELDS}

    tvi = round(weight / ((height / 100) ** 2), 2)
    manual_data = {
        "body_length": record.torso_length,
        "chest": record.chest_circumference_pause,
        "region": record.settlement or record.birth_place,
    }
    detailed = calculate_detailed_indices(
        age,
        record.gender or "",
        height,
        weight,
        tvi,
        manual_data,
        lang=normalize_export_lang(lang),
    )
    centile = detailed.get("centile")
    morph_type_key = detailed.get("morphological_type_key")
    return {
        "tvi": tvi,
        "z_h": detailed.get("z_h"),
        "z_w": detailed.get("z_w"),
        "z_bmi": detailed.get("z_bmi"),
        "z_body_length": detailed.get("z_body_length"),
        "centile": centile,
        "corridor": get_research_index_value_label("corridor", centile, normalize_export_lang(lang)),
        "morphological_type": get_research_index_value_label("morphological_type", morph_type_key, normalize_export_lang(lang)),
        "hmai": detailed.get("hmai"),
        "mii": detailed.get("mii"),
        "adi": detailed.get("adi"),
        "mcri": detailed.get("mcri"),
    }


def apply_research_filters(
    query,
    current_user: User,
    search: Optional[str] = None,
    full_name: Optional[str] = None,
    school_name: Optional[str] = None,
    settlement: Optional[str] = None,
    feeding_type: Optional[str] = None,
    parents_marriage: Optional[str] = None,
    weight_min: Optional[float] = None,
    weight_max: Optional[float] = None,
    height_min: Optional[float] = None,
    height_max: Optional[float] = None,
    researcher_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    gender: Optional[str] = None,
):
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.full_name.ilike(like) |
            ResearchRecord.school_name.ilike(like) |
            ResearchRecord.settlement.ilike(like)
        )
    if full_name:
        query = query.filter(ResearchRecord.full_name.ilike(f"%{full_name}%"))
    if school_name:
        query = query.filter(ResearchRecord.school_name.ilike(f"%{school_name}%"))
    if settlement:
        s = settlement.strip()
        query = query.filter(
            (ResearchRecord.settlement.ilike(f"%{s}%")) |
            (ResearchRecord.birth_place.ilike(f"%{s}%"))
        )
    if feeding_type:
        query = query.filter(ResearchRecord.feeding_type == feeding_type)
    if parents_marriage:
        query = query.filter(ResearchRecord.parents_marriage == parents_marriage)
    if weight_min is not None:
        query = query.filter(ResearchRecord.weight >= weight_min)
    if weight_max is not None:
        query = query.filter(ResearchRecord.weight <= weight_max)
    if height_min is not None:
        query = query.filter(ResearchRecord.chest_standing_height >= height_min)
    if height_max is not None:
        query = query.filter(ResearchRecord.chest_standing_height <= height_max)
    if date_from:
        query = query.filter(ResearchRecord.examination_date >= date_from)
    if date_to:
        query = query.filter(ResearchRecord.examination_date <= date_to)
    if gender:
        gender_norm = gender.strip().lower()
        if gender_norm in ["erkak", "male", "boy", "o'g'il", "ogil"]:
            query = query.filter(
                (ResearchRecord.gender.ilike("%erkak%")) |
                (ResearchRecord.gender.ilike("%male%")) |
                (ResearchRecord.gender.ilike("%boy%")) |
                (ResearchRecord.gender.ilike("%o'g%")) |
                (ResearchRecord.gender.ilike("%og%"))
            )
        elif gender_norm in ["ayol", "female", "girl", "qiz"]:
            query = query.filter(
                (ResearchRecord.gender.ilike("%ayol%")) |
                (ResearchRecord.gender.ilike("%female%")) |
                (ResearchRecord.gender.ilike("%girl%")) |
                (ResearchRecord.gender.ilike("%qiz%"))
            )
        else:
            query = query.filter(func.lower(ResearchRecord.gender) == gender_norm)
    return query


def get_current_researcher_or_superadmin(
    request: Request,
    accessToken: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # 1. Tokenni aniqlash (Header yoki Query Param)
    token = accessToken
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 2. JWT Decode
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # 3. Userni topish
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if getattr(user, "is_deleted", 0) == 1:
        raise HTTPException(status_code=403, detail="Foydalanuvchi bloklangan yoki o'chirilgan")

    # 4. Roli bo'yicha tekshirish
    if user.role not in ["researcher", "superadmin"]:
        raise HTTPException(status_code=403, detail="Sizda ushbu amalni bajarish uchun ruxsat yo'q.")
    
    # Update activity
    user.last_active_at = datetime.utcnow()
    try:
        db.commit()
    except:
        db.rollback()

    return user


# ═══════════════════════════════════════════════
#  STATIC PATHS — MUST BE BEFORE /{record_id}
# ═══════════════════════════════════════════════

@router.get("/deleted/list", response_model=List[ResearchRecordOut])
def list_deleted_research(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """O'chirilgan yozuvlar ro'yxati — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    records = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.deleted_by))
        .filter(ResearchRecord.is_deleted == 1)
        .order_by(ResearchRecord.deleted_at.desc())
        .all()
    )
    return [research_record_to_dict(record) for record in records]


@router.get("/export/xlsx")
def export_research_xlsx(
    search: Optional[str] = Query(None),
    full_name: Optional[str] = Query(None),
    school_name: Optional[str] = Query(None),
    settlement: Optional[str] = Query(None),
    feeding_type: Optional[str] = Query(None),
    parents_marriage: Optional[str] = Query(None),
    weight_min: Optional[float] = Query(None),
    weight_max: Optional[float] = Query(None),
    height_min: Optional[float] = Query(None),
    height_max: Optional[float] = Query(None),
    researcher_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    lang: Optional[str] = Query("uz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """XLSX Export - Advanced version with styling and Cyrillic headers"""
    export_lang = normalize_export_lang(lang)
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.created_by))
        .filter(ResearchRecord.is_deleted == 0)
    )
    query = apply_research_filters(
        query,
        current_user,
        search=search,
        full_name=full_name,
        school_name=school_name,
        settlement=settlement,
        feeding_type=feeding_type,
        parents_marriage=parents_marriage,
        weight_min=weight_min,
        weight_max=weight_max,
        height_min=height_min,
        height_max=height_max,
        researcher_id=researcher_id,
        date_from=date_from,
        date_to=date_to,
        gender=gender,
    )

    records = query.order_by(ResearchRecord.id.desc()).all()
    if age_min is not None or age_max is not None:
        filtered_records = []
        for record in records:
            try:
                if not record.birth_date:
                    continue
                b_date = datetime.strptime(record.birth_date, "%Y-%m-%d")
                e_date_str = record.examination_date if record.examination_date else datetime.now().strftime("%Y-%m-%d")
                e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
                age = (e_date - b_date).days / 365.25
                if age_min is not None and age < age_min:
                    continue
                if age_max is not None and age > age_max:
                    continue
                filtered_records.append(record)
            except Exception:
                continue
        records = filtered_records
    if not records:
        raise HTTPException(status_code=404, detail="Ma'lumotlar mavjud emas")

    wb = Workbook()
    ws = wb.active
    ws.title = "Research Data"

    # 1. Заголовки (Кириллица)
    headers_map = [
        ("Сана", "created_at"),
        ("ID", "id"),
        ("Ф.И.Ш.", "full_name"),
        ("Мактаб/Муассаса", "school_name"),
        ("Аҳоли пункти", "settlement"),
        ("Туғилган жойи", "birth_place"),
        ("Туғилган санаси", "birth_date"),
        (get_research_child_age_export_header(export_lang), "child_age"),
        ("Жинси", "gender"),
        ("Отасининг миллати", "father_nationality"),
        ("Онасининг миллати", "mother_nationality"),
        ("Қачондан бери яшайди", "living_since"),
        ("Рўйхатга олинган сана", "enrolled_date"),
        ("Яшаш шароити", "living_conditions"),
        ("Меҳнат режими", "labor_regime"),
        ("Ўтказилган касалликлар", "past_illnesses"),
        ("Болалар сони", "children_count"),
        ("Бола нечанчи", "child_order"),
        ("Озиқланиш тури", "feeding_type"),
        ("Ота-она никоҳи", "parents_marriage"),
        ("Она соғлиғи", "mother_health_status"),
        ("Текширув санаси", "examination_date"),
        
        # I Показатели физического развития
        ("Пастки оёқ-қўл (см)", "lower_leg_total"),
        ("Олд юқори ёнбош ўсимтасидан (см)", "lower_leg_spina_iliaca"),
        ("Қовуқ устидан (см)", "lower_leg_symphysion"),
        ("Пастки оёқ-қўл узунлиги (см)", "lower_leg_length"),
        ("Болдир баландлиги (см)", "tibiale_height"),
        ("Чанноқ кенглиги (см)", "pelvic_width"),
        ("Сон узунлиги (см)", "thigh_length"),
        ("Сон айланаси (см)", "thigh_circumference"),
        ("Болдир узунлиги (см)", "calf_length"),
        ("Болдир айланаси (см)", "calf_circumference"),
        ("Оёқ кафти узунлиги (см)", "foot_length"),
        ("Тишлар сони", "teeth_count"),
        ("Ҳайз бошланиши", "menstruation_start"),

        # II Определение формы черепа
        ("Бош суяги бўйлама (см)", "skull_longitudinal"),
        ("Бош суяги кўндаланг (см)", "skull_transverse"),
        ("Бош айланаси (см)", "head_circumference"),
        ("Пешона кўндаланг (см)", "forehead_transverse"),
        ("Бош суяги баландлиги (см)", "skull_height"),
        ("Бош суяги асоси узунлиги (см)", "skull_base_length"),
        ("Бош суяги асоси кенглиги (см)", "skull_base_width"),

        # Лицо
        ("Юз кенглиги (см)", "face_bizygomatic"),
        ("Пастки жағ кенглиги (см)", "face_bigonial"),
        ("Юз морфологик баландлиги (см)", "face_morphological_height"),
        ("Юз физиогномик баландлиги (см)", "face_physiognomic_height"),
        ("Бурун баландлиги (см)", "nose_height"),
        ("Бурун кенглиги (см)", "nose_width"),
        ("Кўз ташқи бурчаклари (см)", "outer_canthal_width"),
        ("Кўз ички бурчаклари (см)", "inner_canthal_width"),
        ("Лаблар шиллиқ қавати (см)", "lips_mucosa_height"),
        ("Оғиз кенглиги (см)", "mouth_width"),

        # Грудь
        ("Бўйи (тик) (см)", "chest_standing_height"),
        ("Бўйи (ўтирган) (см)", "chest_sitting_height"),
        ("Вазн (кг)", "weight"),
        ("Гавда узунлиги (см)", "trunk_length"),
        ("Тана узунлиги (см)", "torso_length"),
        ("Кўкрак айланаси (пауза) (см)", "chest_circumference_pause"),
        ("Кўкрак айланаси (нафас) (см)", "chest_circumference_inhale"),
        ("Кўкрак айланаси (чиқариш) (см)", "chest_circumference_exhale"),
        ("Бел айланаси (см)", "waist_circumference"),
        ("Қорин айланаси (см)", "abdomen_circumference"),
        ("Юқори сегмент узунлиги (см)", "upper_segment_length"),
        ("Кўкрак кўндаланг (см)", "chest_transverse_diameter"),
        ("Кўкрак олд-орқа (см)", "chest_anteroposterior_diameter"),
        ("Кўкрак баландлиги (см)", "chest_height"),

        # Верхняя конечность
        ("Қўл узунлиги (см)", "arm_length"),
        ("Елка узунлиги (см)", "shoulder_length"),
        ("Елка кенглиги (см)", "shoulder_width"),
        ("Елка айланаси (тинч) (см)", "shoulder_circumference_rest"),
        ("Елка айланаси (букилган) (см)", "shoulder_circumference_flexed"),
        ("Билак узунлиги (см)", "forearm_length"),
        ("Қўл кафти узунлиги (см)", "hand_length"),
        ("Динамометрия (кг)", "dynamometry"),

        # Толщина подкожно-жировой клетчатки
        ("Трицепс ёғ (мм)", "fat_triceps"),
        ("Бицепс ёғ (мм)", "fat_biceps"),
        ("Курак ости ёғ (мм)", "fat_subscapular"),
        ("Ёнбош ёғ (мм)", "fat_iliac"),
        ("Тизза ости ёғ (мм)", "fat_popliteal"),
    ]

    if current_user.role == "superadmin":
        headers_map.insert(2, ("Киритган изланувчи", "created_by_name"))
        headers_map.insert(3, ("Киритган email", "created_by_email"))

    headers_map.extend(get_research_index_export_headers(export_lang))

    # Style definitions
    header_fill = PatternFill(start_color="3498DB", end_color="3498DB", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    zebra_fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
    border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))
    center_align = Alignment(horizontal='center', vertical='center')
    left_align = Alignment(horizontal='left', vertical='center')

    # Writing headers
    for col_num, (header_text, _) in enumerate(headers_map, 1):
        cell = ws.cell(row=1, column=col_num, value=header_text)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = border

    # Writing data
    for row_num, record in enumerate(records, 2):
        index_values = build_research_index_export_values(record, export_lang)
        for col_num, (_, field_name) in enumerate(headers_map, 1):
            if field_name == "created_by_name":
                val = record.created_by.name if record.created_by else None
            elif field_name == "created_by_email":
                val = record.created_by.email if record.created_by else None
            elif field_name == "child_age":
                val = format_research_child_age(record, export_lang)
            elif field_name in index_values:
                val = index_values[field_name]
            else:
                val = getattr(record, field_name)
            
            # Special formatting
            if field_name == "created_at":
                display_val = val.strftime("%Y-%m-%d %H:%M") if val else "-"
            elif field_name == "id":
                display_val = val # ID o'zgarmasin
            elif field_name == "gender":
                display_val = format_research_gender_for_xlsx(val)
            elif field_name == "created_by_email":
                display_val = val if val else "-"
            elif field_name == "child_age" or field_name in index_values:
                display_val = val if val is not None else "-"
            elif isinstance(val, str):
                display_val = lat2cyr(val) if val else "-"
            elif val is None:
                display_val = "-"
            else:
                display_val = val
            
            cell = ws.cell(row=row_num, column=col_num, value=display_val)
            cell.alignment = left_align
            cell.border = border
            
            # Zebra rows
            if row_num % 2 == 0:
                cell.fill = zebra_fill

    # Auto-width
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        ws.column_dimensions[column].width = min(50, max_length + 2)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    
    filename = f"research_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def clean_import_value(value):
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned or cleaned in {"-", "—"}:
            return None
        return cleaned
    return value


def normalize_import_header(value) -> str:
    text = str(value or "").strip().lower()
    text = text.replace("*", " ")
    for old, new in {
        "ў": "o", "ӯ": "o", "ғ": "g", "қ": "q", "ҳ": "h",
        "й": "y", "ё": "yo", "я": "ya", "ю": "yu",
        "'": " ", "`": " ", "’": " ", "_": " ",
    }.items():
        text = text.replace(old, new)
    keep = []
    for char in text:
        keep.append(char if char.isalnum() else " ")
    return " ".join("".join(keep).split())


def coerce_import_value(field: str, value):
    value = clean_import_value(value)
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if field in INTEGER_IMPORT_FIELDS:
        try:
            return int(float(str(value).replace(",", ".")))
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{field}: butun son bo'lishi kerak") from exc
    if field in FLOAT_IMPORT_FIELDS:
        try:
            return float(str(value).replace(",", "."))
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{field}: raqam bo'lishi kerak") from exc
    return str(value).strip()


def map_research_import_headers(headers):
    field_set = set(RESEARCH_IMPORT_FIELDS)
    label_aliases = {
        normalize_import_header(label): field
        for field, label in RESEARCH_TEMPLATE_LABELS.items()
        if field in field_set
    }
    mapped = {}
    known_count = 0
    for index, header in enumerate(headers):
        raw = str(header or "").strip()
        normalized = normalize_import_header(raw)
        direct = raw if raw in field_set else normalized.replace(" ", "_")
        field = None
        if direct in field_set:
            field = direct
        elif normalized in RESEARCH_IMPORT_ALIASES:
            field = RESEARCH_IMPORT_ALIASES[normalized]
        elif normalized in label_aliases:
            field = label_aliases[normalized]
        if field:
            mapped[index] = field
            known_count += 1

    if known_count and known_count >= max(3, len([h for h in headers if h]) // 3):
        return mapped

    normalized_headers = [normalize_import_header(header) for header in headers]
    has_superadmin_owner_columns = (
        len(normalized_headers) > 3
        and "kiritgan" in normalized_headers[2]
        and "email" in normalized_headers[3]
    )
    export_order = RESEARCH_EXPORT_FIELD_ORDER
    if has_superadmin_owner_columns:
        export_order = [
            "created_at",
            "id",
            "created_by_name",
            "created_by_email",
            *RESEARCH_EXPORT_FIELD_ORDER[2:],
        ]

    for index, field in enumerate(export_order[:len(headers)]):
        if field in field_set:
            mapped[index] = field
    return mapped


@router.get("/import/template")
def download_research_import_template(
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    """Research XLSX import uchun export ko'rinishidagi shablon."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Research Data"
    template_headers = [
        RESEARCH_TEMPLATE_LABELS.get(field, field)
        for field in RESEARCH_IMPORT_FIELDS
    ]
    template_values = [
        RESEARCH_TEMPLATE_EXAMPLE.get(field)
        for field in RESEARCH_IMPORT_FIELDS
    ]
    header_fill = PatternFill(start_color="3498DB", end_color="3498DB", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(left=Side(style="thin"), right=Side(style="thin"), top=Side(style="thin"), bottom=Side(style="thin"))
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")

    for col_num, header_text in enumerate(template_headers, 1):
        header = ws.cell(row=1, column=col_num, value=header_text)
        header.fill = header_fill
        header.font = header_font
        header.alignment = center_align
        header.border = border

    for col_num, value in enumerate(template_values, 1):
        cell = ws.cell(row=2, column=col_num, value=value)
        cell.alignment = left_align
        cell.border = border

    for row_num in range(2, 102):
        for col_num in range(1, len(template_headers) + 1):
            cell = ws.cell(row=row_num, column=col_num)
            cell.alignment = left_align
            cell.border = border

    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value or "")) > max_length:
                    max_length = len(str(cell.value or ""))
            except:
                pass
        ws.column_dimensions[column].width = min(50, max_length + 2)

    ws.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = "research_import_template.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/import/xlsx")
async def import_research_xlsx(
    file: UploadFile = File(...),
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Faqat Excel fayllari (.xlsx, .xls) qabul qilinadi")

    target_user = current_user
    if researcher_id is not None:
        if current_user.role != "superadmin":
            raise HTTPException(status_code=403, detail="Researcherni tanlash faqat superadmin uchun")
        target_user = db.get(User, researcher_id)
        if not target_user or target_user.role != "researcher":
            raise HTTPException(status_code=404, detail="Researcher topilmadi")

    contents = await file.read()
    try:
        wb = load_workbook(io.BytesIO(contents), data_only=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Excel fayl o'qilmadi: {exc}") from exc
    ws = wb.active
    rows = [tuple(cell.value for cell in row) for row in ws.iter_rows()]
    if not rows:
        raise HTTPException(status_code=400, detail="Excel faylda ma'lumot topilmadi")

    headers = rows[0]
    column_map = map_research_import_headers(headers)
    if not column_map:
        raise HTTPException(status_code=400, detail="Import uchun mos ustunlar topilmadi")

    skipped = 0
    errors = []
    records = []

    for row_number, row in enumerate(rows[1:], start=2):
        if not row or all(clean_import_value(value) is None for value in row):
            skipped += 1
            continue

        payload = {}
        row_errors = []
        for index, field in column_map.items():
            if index >= len(row):
                continue
            try:
                value = coerce_import_value(field, row[index])
            except ValueError as exc:
                row_errors.append(str(exc))
                continue
            if value is not None:
                payload[field] = value

        if not payload:
            skipped += 1
            continue
        if not payload.get("full_name"):
            errors.append({"row": row_number, "errors": ["F.I.SH ustuni to'ldirilishi kerak"]})
            continue
        if row_errors:
            errors.append({"row": row_number, "errors": row_errors})
            continue

        record = ResearchRecord(**payload)
        record.created_by_id = target_user.id
        records.append(record)

    if errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Importda xatolik bor. Iltimos, ko'rsatilgan satrlarni tekshiring.",
                "errors": errors[:50],
            },
        )

    if not records:
        raise HTTPException(status_code=400, detail="Import qilish uchun ma'lumot topilmadi")

    try:
        db.add_all(records)
        target_user.completed_entries_count = (target_user.completed_entries_count or 0) + len(records)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import saqlanmadi: {exc}")

    return {"status": "ok", "imported": len(records), "skipped": skipped}


@router.get("/", response_model=List[ResearchRecordOut])
def list_research_records(
    search: Optional[str] = Query(None),
    full_name: Optional[str] = Query(None),
    school_name: Optional[str] = Query(None),
    settlement: Optional[str] = Query(None),
    feeding_type: Optional[str] = Query(None),
    parents_marriage: Optional[str] = Query(None),
    weight_min: Optional[float] = Query(None),
    weight_max: Optional[float] = Query(None),
    height_min: Optional[float] = Query(None),
    height_max: Optional[float] = Query(None),
    researcher_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.created_by))
        .filter(ResearchRecord.is_deleted == 0)
    )

    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    # Generic search
    if search:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.full_name.ilike(like) |
            ResearchRecord.school_name.ilike(like) |
            ResearchRecord.settlement.ilike(like)
        )
    
    # Specific demographic filters
    if full_name:
        query = query.filter(ResearchRecord.full_name.ilike(f"%{full_name}%"))
    if school_name:
        query = query.filter(ResearchRecord.school_name.ilike(f"%{school_name}%"))
    if settlement:
        s = settlement.strip()
        query = query.filter(
            (ResearchRecord.settlement.ilike(f"%{s}%")) |
            (ResearchRecord.birth_place.ilike(f"%{s}%"))
        )
    if feeding_type:
        query = query.filter(ResearchRecord.feeding_type == feeding_type)
    if parents_marriage:
        query = query.filter(ResearchRecord.parents_marriage == parents_marriage)
    
    # Biometric filters
    if weight_min is not None:
        query = query.filter(ResearchRecord.weight >= weight_min)
    if weight_max is not None:
        query = query.filter(ResearchRecord.weight <= weight_max)
    if height_min is not None:
        query = query.filter(ResearchRecord.chest_standing_height >= height_min)
    if height_max is not None:
        query = query.filter(ResearchRecord.chest_standing_height <= height_max)

    # Date filters
    if date_from:
        query = query.filter(ResearchRecord.examination_date >= date_from)
    if date_to:
        query = query.filter(ResearchRecord.examination_date <= date_to)

    if gender:
        gender_norm = gender.strip().lower()
        if gender_norm in ["erkak", "male", "boy", "o'g'il", "ogil"]:
            query = query.filter(
                (ResearchRecord.gender.ilike("%erkak%")) |
                (ResearchRecord.gender.ilike("%male%")) |
                (ResearchRecord.gender.ilike("%boy%")) |
                (ResearchRecord.gender.ilike("%o'g%")) |
                (ResearchRecord.gender.ilike("%og%"))
            )
        elif gender_norm in ["ayol", "female", "girl", "qiz"]:
            query = query.filter(
                (ResearchRecord.gender.ilike("%ayol%")) |
                (ResearchRecord.gender.ilike("%female%")) |
                (ResearchRecord.gender.ilike("%girl%")) |
                (ResearchRecord.gender.ilike("%qiz%"))
            )
        else:
            query = query.filter(func.lower(ResearchRecord.gender) == gender_norm)

    records = query.order_by(ResearchRecord.id.desc()).all()

    # Age filter (in Python for accuracy)
    if age_min is not None or age_max is not None:
        filtered = []
        for r in records:
            try:
                if not r.birth_date: continue
                b_date = datetime.strptime(r.birth_date, "%Y-%m-%d")
                e_date_str = r.examination_date if r.examination_date else datetime.now().strftime("%Y-%m-%d")
                e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
                age = (e_date - b_date).days / 365.25
                if age_min is not None and age < age_min: continue
                if age_max is not None and age > age_max: continue
                filtered.append(r)
            except Exception as e:
                print(f"Age filter error for record {r.id}: {e}")
                continue
                # If date format is invalid, include in list only if no age filter applied
                if age_min is None and age_max is None:
                    filtered.append(r)
        return [research_record_to_dict(record) for record in filtered]

    return [research_record_to_dict(record) for record in records]


@router.get("/export/dataset")
def export_dataset_for_analysis(
    gender: Optional[str] = Query(None),
    age_min: Optional[float] = Query(None),
    age_max: Optional[float] = Query(None),
    settlement: Optional[str] = Query(None),
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """
    Advanced export for statistical analysis (SPSS/Python).
    - Numeric encoding for categorical variables.
    - Machine-readable headers.
    - Age calculation.
    """
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.created_by))
        .filter(ResearchRecord.is_deleted == 0)
    )
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)
    
    if settlement:
        s = settlement.strip()
        query = query.filter(
            (ResearchRecord.settlement.ilike(f"%{s}%")) |
            (ResearchRecord.birth_place.ilike(f"%{s}%"))
        )
    if gender:
        query = query.filter(ResearchRecord.gender == gender)
    
    records = query.all()

    # Filtered and Processed Data
    dataset = []
    for r in records:
        try:
            b_date = datetime.strptime(r.birth_date, "%Y-%m-%d")
            # Examination date string to date
            e_date_str = r.examination_date or datetime.now().strftime("%Y-%m-%d")
            e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
            age = round((e_date - b_date).days / 365.25, 2)
        except:
            age = None
        
        if age_min is not None and (age is None or age < age_min): continue
        if age_max is not None and (age is None or age > age_max): continue

        # Encoding categories
        # Gender: 0=Boy, 1=Girl
        gender_code = 0 if r.gender == "Boy" else 1
        if not r.gender: gender_code = -1
        
        # Feeding: 0=Natural, 1=Artificial
        feeding_code = 0 if "Tabiiy" in (r.feeding_type or "") else 1
        
        # Marriage: 0=Non-relative, 1=Distant, 2=Close
        marriage_code = 2 if "Yaqin" in (r.parents_marriage or "") else 1 if "Uzoq" in (r.parents_marriage or "") else 0

        dataset.append({
            "id": r.id,
            "full_name": r.full_name,
            "age_years": age,
            "gender": r.gender,
            "gender_code": gender_code,
            "settlement": r.settlement,
            "school": r.school_name,
            "weight": r.weight,
            "height": r.chest_standing_height,
            "bmi": round(r.weight / ((r.chest_standing_height/100)**2), 2) if r.weight and r.chest_standing_height else None,
            "feeding_code": feeding_code,
            "marriage_code": marriage_code,
            "head_circ": r.head_circumference,
            "waist_circ": r.waist_circumference,
            "chest_circ": r.chest_circumference_pause,
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else None
        })

    if not dataset:
        raise HTTPException(status_code=404, detail="Filterga mos ma'lumotlar topilmadi")

    df = pd.DataFrame(dataset)
    
    # Save to Excel
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine='openpyxl')
    buf.seek(0)

    filename = f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



# ═══════════════════════════════════════════════
#  CREATE
# ═══════════════════════════════════════════════
@router.get("/export/summary-docx")
def export_research_summary_docx(
    search: Optional[str] = Query(None),
    full_name: Optional[str] = Query(None),
    school_name: Optional[str] = Query(None),
    settlement: Optional[str] = Query(None),
    feeding_type: Optional[str] = Query(None),
    parents_marriage: Optional[str] = Query(None),
    weight_min: Optional[float] = Query(None),
    weight_max: Optional[float] = Query(None),
    height_min: Optional[float] = Query(None),
    height_max: Optional[float] = Query(None),
    researcher_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.created_by))
        .filter(ResearchRecord.is_deleted == 0)
    )
    query = apply_research_filters(
        query,
        current_user,
        search=search,
        full_name=full_name,
        school_name=school_name,
        settlement=settlement,
        feeding_type=feeding_type,
        parents_marriage=parents_marriage,
        weight_min=weight_min,
        weight_max=weight_max,
        height_min=height_min,
        height_max=height_max,
        researcher_id=researcher_id,
        date_from=date_from,
        date_to=date_to,
        gender=gender,
    )
    records = query.order_by(ResearchRecord.id.desc()).all()

    if age_min is not None or age_max is not None:
        filtered_records = []
        for record in records:
            try:
                if not record.birth_date:
                    continue
                b_date = datetime.strptime(record.birth_date, "%Y-%m-%d")
                e_date_str = record.examination_date if record.examination_date else datetime.now().strftime("%Y-%m-%d")
                e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
                age = (e_date - b_date).days / 365.25
                if age_min is not None and age < age_min:
                    continue
                if age_max is not None and age > age_max:
                    continue
                filtered_records.append(record)
            except Exception:
                continue
        records = filtered_records

    if not records:
        raise HTTPException(status_code=404, detail="Filterga mos ma'lumotlar topilmadi")

    researcher = None
    if researcher_id:
        researcher = db.get(User, researcher_id)
    elif current_user.role == "researcher":
        researcher = current_user

    filters = {
        "search": search,
        "full_name": full_name,
        "school_name": school_name,
        "settlement": settlement,
        "feeding_type": feeding_type,
        "parents_marriage": parents_marriage,
        "weight_min": weight_min,
        "weight_max": weight_max,
        "height_min": height_min,
        "height_max": height_max,
        "researcher_id": researcher_id,
        "date_from": date_from,
        "date_to": date_to,
        "gender": gender,
        "age_min": age_min,
        "age_max": age_max,
    }
    buf = generate_research_summary_docx(
        records,
        current_user=current_user,
        researcher=researcher,
        filters=filters,
    )
    encoded_filename = urllib.parse.quote(
        f"research_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
    )
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )


@router.post("/", response_model=ResearchRecordOut)
def create_research_record(
    payload: ResearchRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    record = ResearchRecord(**payload.model_dump(exclude_unset=True))
    record.created_by_id = current_user.id
    db.add(record)
    
    # Update user stats
    current_user.completed_entries_count = (current_user.completed_entries_count or 0) + 1
    
    db.commit()
    db.refresh(record)
    return record


# ═══════════════════════════════════════════════
#  DYNAMIC PATHS — AFTER STATIC PATHS
# ═══════════════════════════════════════════════

@router.get("/{record_id}", response_model=ResearchRecordOut)
def get_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")
    return research_record_to_dict(record)


@router.put("/{record_id}", response_model=ResearchRecordOut)
def update_research_record(
    record_id: int,
    payload: ResearchRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """Soft delete"""
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    record.is_deleted = 1
    record.deleted_by_id = current_user.id
    record.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "ok", "message": "Soft o'chirildi"}


@router.delete("/{record_id}/hard")
def hard_delete_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hard delete — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    record = db.get(ResearchRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    db.delete(record)
    db.commit()
    return {"status": "ok", "message": "Bazadan butunlay o'chirildi"}


@router.post("/{record_id}/restore")
def restore_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restore soft-deleted record — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    record = db.get(ResearchRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    record.is_deleted = 0
    record.deleted_by_id = None
    record.deleted_at = None
    db.commit()
    return {"status": "ok", "message": "Tiklandi"}


@router.get("/{record_id}/docx")
def download_research_docx(
    record_id: int,
    lang: str = Query("ru"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin)
):
    """DOCX hisobot yuklab olish"""
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    data = {c.name: getattr(record, c.name) for c in record.__table__.columns}
    buf = generate_researcher_docx(data, lang=lang)
    encoded_filename = urllib.parse.quote(f"Research_{record.id}_{lang}.docx")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )
