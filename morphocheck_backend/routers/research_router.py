import asyncio
import calendar
import io
import re
import urllib.parse
from datetime import date, datetime
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import StreamingResponse
from jose import JWTError, jwt
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from models.schemas import ResearchRecordCreate, ResearchRecordOut
from models.user import User
from models.userdata import ResearchRecord
from routers.auth_router import get_current_user
from utils.audit_helper import record_audit_log
from services.consent_docx import generate_consent_docx
from services.indices_service import (
    calculate_age_independent_indices,
    calculate_detailed_indices,
)
from services.research_docx import generate_researcher_docx
from services.research_summary_docx import generate_research_summary_docx
from utils.database import get_db
from utils.i18n_export import get_research_header
from utils.security import ALGORITHM, SECRET_KEY
from utils.translit import lat2cyr
from utils.privacy import (
    CHILD_PII_EXPORT_FIELDS,
    child_audit_reference,
    get_child_privacy_enabled,
    redact_research_child_payload,
)

router = APIRouter(tags=["Researcher"])


class ResearchBulkAction(BaseModel):
    ids: List[int] = Field(default_factory=list, max_length=10000)


RESEARCH_IMPORT_FIELDS = [
    "full_name",
    "school_name",
    "settlement",
    "birth_place",
    "birth_date",
    "gender",
    "father_nationality",
    "mother_nationality",
    "living_since",
    "enrolled_date",
    "living_conditions",
    "labor_regime",
    "past_illnesses",
    "children_count",
    "child_order",
    "feeding_type",
    "parents_marriage",
    "mother_health_status",
    "parents_phone",
    "examination_date",
    "lower_leg_total",
    "lower_leg_spina_iliaca",
    "lower_leg_symphysion",
    "lower_leg_length",
    "tibiale_height",
    "pelvic_width",
    "thigh_length",
    "thigh_circumference",
    "calf_length",
    "calf_circumference",
    "foot_length",
    "teeth_count",
    "menstruation_start",
    "skull_longitudinal",
    "skull_transverse",
    "head_circumference",
    "forehead_transverse",
    "skull_height",
    "skull_base_length",
    "skull_base_width",
    "face_bizygomatic",
    "face_bigonial",
    "face_morphological_height",
    "face_physiognomic_height",
    "nose_height",
    "nose_width",
    "outer_canthal_width",
    "inner_canthal_width",
    "lips_mucosa_height",
    "mouth_width",
    "chest_standing_height",
    "chest_sitting_height",
    "weight",
    "trunk_length",
    "torso_length",
    "chest_circumference_pause",
    "chest_circumference_inhale",
    "chest_circumference_exhale",
    "waist_circumference",
    "abdomen_circumference",
    "upper_segment_length",
    "chest_transverse_diameter",
    "chest_anteroposterior_diameter",
    "chest_height",
    "arm_length",
    "shoulder_length",
    "shoulder_width",
    "arm_circumference_total",
    "shoulder_circumference_rest",
    "shoulder_circumference_flexed",
    "forearm_length",
    "hand_length",
    "dynamometry",
    "fat_triceps",
    "fat_biceps",
    "fat_subscapular",
    "fat_iliac",
    "fat_popliteal",
    "father_height",
    "mother_height",
    "consent_confirmed",
    "consent_guardian_name",
    "consent_guardian_relationship",
    "consent_guardian_phone",
    "consent_policy_version",
]

RESEARCH_TEMPLATE_EXCLUDED_FIELDS = {
    "father_height",
    "mother_height",
    "consent_confirmed",
    "consent_guardian_name",
    "consent_guardian_relationship",
    "consent_guardian_phone",
    "consent_policy_version",
}

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
    "rozilik": "consent_confirmed",
    "consent": "consent_confirmed",
    "vasiy": "consent_guardian_name",
    "guardian": "consent_guardian_name",
    "guardian name": "consent_guardian_name",
    "vasiy munosabati": "consent_guardian_relationship",
    "guardian relationship": "consent_guardian_relationship",
    "vasiy telefoni": "consent_guardian_phone",
    "guardian phone": "consent_guardian_phone",
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
    "created_at",
    "id",
    "full_name",
    "school_name",
    "settlement",
    "birth_place",
    "birth_date",
    "gender",
    "father_nationality",
    "mother_nationality",
    "living_since",
    "enrolled_date",
    "living_conditions",
    "labor_regime",
    "past_illnesses",
    "children_count",
    "child_order",
    "feeding_type",
    "parents_marriage",
    "mother_health_status",
    "examination_date",
    "lower_leg_total",
    "lower_leg_spina_iliaca",
    "lower_leg_symphysion",
    "lower_leg_length",
    "tibiale_height",
    "pelvic_width",
    "thigh_length",
    "thigh_circumference",
    "calf_length",
    "calf_circumference",
    "foot_length",
    "teeth_count",
    "menstruation_start",
    "skull_longitudinal",
    "skull_transverse",
    "head_circumference",
    "forehead_transverse",
    "skull_height",
    "skull_base_length",
    "skull_base_width",
    "face_bizygomatic",
    "face_bigonial",
    "face_morphological_height",
    "face_physiognomic_height",
    "nose_height",
    "nose_width",
    "outer_canthal_width",
    "inner_canthal_width",
    "lips_mucosa_height",
    "mouth_width",
    "chest_standing_height",
    "chest_sitting_height",
    "weight",
    "trunk_length",
    "torso_length",
    "chest_circumference_pause",
    "chest_circumference_inhale",
    "chest_circumference_exhale",
    "waist_circumference",
    "abdomen_circumference",
    "upper_segment_length",
    "chest_transverse_diameter",
    "chest_anteroposterior_diameter",
    "chest_height",
    "arm_length",
    "shoulder_length",
    "shoulder_width",
    "shoulder_circumference_rest",
    "shoulder_circumference_flexed",
    "forearm_length",
    "hand_length",
    "dynamometry",
    "fat_triceps",
    "fat_biceps",
    "fat_subscapular",
    "fat_iliac",
    "fat_popliteal",
]
RESEARCH_EXPORT_HEADERS = [
    "Сана",
    "ID",
    "Ф.И.Ш.",
    "Мактаб/Муассаса",
    "Аҳоли пункти",
    "Туғилган жойи",
    "Туғилган санаси",
    "Отасининг миллати",
    "Онасининг миллати",
    "Қачондан бери яшайди",
    "Рўйхатга олинган сана",
    "Яшаш шароити",
    "Меҳнат режими",
    "Ўтказилган касалликлар",
    "Болалар сони",
    "Бола нечанчи",
    "Озиқланиш тури",
    "Ота-она никоҳи",
    "Она соғлиғи",
    "Текширув санаси",
    "Отасининг бўйи (см)",
    "Онасининг бўйи (см)",
    "Олд юқори ёнбош ўсимтасидан (см)",
    "Қовуқ устидан (см)",
    "Болдир баландлиги (см)",
    "Чанноқ кенглиги (см)",
    "Сон узунлиги (см)",
    "Сон айланаси (см)",
    "Болдир узунлиги (см)",
    "Болдир айланаси (см)",
    "Оёқ кафти узунлиги (см)",
    "Тишлар сони",
    "Ҳайз бошланиши",
    "Бош суяги бўйлама (см)",
    "Бош суяги кўндаланг (см)",
    "Бош айланаси (см)",
    "Пешона кўндаланг (см)",
    "Бош суяги баландлиги (см)",
    "Бош суяги асоси узунлиги (см)",
    "Бош суяги асоси кенглиги (см)",
    "Юз кенглиги (см)",
    "Пастки жағ кенглиги (см)",
    "Юз морфологик баландлиги (см)",
    "Юз физиогномик баландлиги (см)",
    "Бурун баландлиги (см)",
    "Бурун кенглиги (см)",
    "Кўз ташқи бурчаклари (см)",
    "Кўз ички бурчаклари (см)",
    "Лаблар шиллиқ қавати (см)",
    "Оғиз кенглиги (см)",
    "Бўйи (тик) (см)",
    "Бўйи (ўтирган) (см)",
    "Вазн (кг)",
    "Гавда узунлиги (см)",
    "Тана узунлиги (см)",
    "Кўкрак айланаси (пауза) (см)",
    "Кўкрак айланаси (нафас) (см)",
    "Кўкрак айланаси (чиқариш) (см)",
    "Бел айланаси (см)",
    "Қорин айланаси (см)",
    "Юқори сегмент узунлиги (см)",
    "Кўкрак кўндаланг (см)",
    "Кўкрак олд-орқа (см)",
    "Кўкрак баландлиги (см)",
    "Қўл узунлиги (см)",
    "Елка узунлиги (см)",
    "Елка кенглиги (см)",
    "Елка айланаси (тинч) (см)",
    "Елка айланаси (букилган) (см)",
    "Билак узунлиги (см)",
    "Қўл кафти узунлиги (см)",
    "Динамометрия (кг)",
    "Трицепс ёғ (мм)",
    "Бицепс ёғ (мм)",
    "Курак ости ёғ (мм)",
    "Ёнбош ёғ (мм)",
    "Тизза ости ёғ (мм)",
]

INTEGER_IMPORT_FIELDS = {"children_count", "child_order", "teeth_count"}
DATE_IMPORT_FIELDS = {"birth_date", "examination_date"}
BOOLEAN_IMPORT_FIELDS = {"consent_confirmed"}
FLOAT_IMPORT_FIELDS = {
    field
    for field in RESEARCH_IMPORT_FIELDS
    if field not in INTEGER_IMPORT_FIELDS
    and field
    not in {
        "full_name",
        "school_name",
        "settlement",
        "birth_place",
        "birth_date",
        "gender",
        "father_nationality",
        "mother_nationality",
        "living_since",
        "enrolled_date",
        "living_conditions",
        "labor_regime",
        "past_illnesses",
        "feeding_type",
        "parents_marriage",
        "mother_health_status",
        "parents_phone",
        "examination_date",
        "menstruation_start",
        "consent_guardian_name",
        "consent_guardian_relationship",
        "consent_guardian_phone",
        "consent_policy_version",
    }
}


def normalize_research_import_gender(value: str) -> str:
    normalized = str(value or "").strip().lower()
    male_values = {
        "boy",
        "male",
        "erkak",
        "ogil",
        "o'g'il",
        "o'g'il bola",
        "\u045e\u0493\u0438\u043b",
        "\u045e\u0493\u0438\u043b \u0431\u043e\u043b\u0430",
        "\u043c\u0430\u043b\u044c\u0447\u0438\u043a",
    }
    female_values = {
        "girl",
        "female",
        "ayol",
        "qiz",
        "qiz bola",
        "\u049b\u0438\u0437",
        "\u049b\u0438\u0437 \u0431\u043e\u043b\u0430",
        "\u0434\u0435\u0432\u043e\u0447\u043a\u0430",
    }
    if normalized in male_values:
        return "boy"
    if normalized in female_values:
        return "girl"
    return str(value).strip()


def get_research_import_fields(privacy_enabled: bool = False) -> List[str]:
    # Privacy is a disclosure policy, not a storage policy. Import templates are
    # blank and therefore do not disclose any child's data; keeping the identity
    # columns here lets the server retain the original values while API responses
    # and exports continue to redact them for privacy-restricted roles.
    allowed_fields = [
        field
        for field in RESEARCH_IMPORT_FIELDS
        if field not in RESEARCH_TEMPLATE_EXCLUDED_FIELDS
    ]
    report_order = [
        field for field in RESEARCH_EXPORT_FIELD_ORDER if field in allowed_fields
    ]
    return report_order + [
        field for field in allowed_fields if field not in report_order
    ]


def get_research_import_headers(privacy_enabled: bool = False) -> List[str]:
    return [
        get_research_template_header(field)
        for field in get_research_import_fields(privacy_enabled)
    ]


def get_research_xlsx_styles():
    return {
        "header_fill": PatternFill(
            start_color="3498DB", end_color="3498DB", fill_type="solid"
        ),
        "header_font": Font(color="FFFFFF", bold=True),
        "border": Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        ),
        "center_align": Alignment(horizontal="center", vertical="center"),
        "left_align": Alignment(horizontal="left", vertical="center"),
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

RESEARCH_TEMPLATE_EXTRA_LABELS = {
    "parents_phone": "\u041e\u0442\u0430-\u043e\u043d\u0430 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0438",
    "arm_circumference_total": "\u049a\u045e\u043b \u0430\u0439\u043b\u0430\u043d\u0430\u0441\u0438 (\u0441\u043c)",
    "father_height": "\u041e\u0442\u0430\u0441\u0438\u043d\u0438\u043d\u0433 \u0431\u045e\u0439\u0438 (\u0441\u043c)",
    "mother_height": "\u041e\u043d\u0430\u0441\u0438\u043d\u0438\u043d\u0433 \u0431\u045e\u0439\u0438 (\u0441\u043c)",
    "consent_confirmed": "\u0420\u043e\u0437\u0438\u043b\u0438\u043a \u0442\u0430\u0441\u0434\u0438\u0493\u0438",
    "consent_guardian_name": "\u0412\u0430\u0441\u0438\u0439\u043d\u0438\u043d\u0433 \u0424.\u0418.\u0428.",
    "consent_guardian_relationship": "\u0412\u0430\u0441\u0438\u0439\u043d\u0438\u043d\u0433 \u049b\u0430\u0440\u0438\u043d\u0434\u043e\u0448\u043b\u0438\u0433\u0438",
    "consent_guardian_phone": "\u0412\u0430\u0441\u0438\u0439 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0438",
    "consent_policy_version": "\u0420\u043e\u0437\u0438\u043b\u0438\u043a \u0441\u0438\u0451\u0441\u0430\u0442\u0438 \u0432\u0435\u0440\u0441\u0438\u044f\u0441\u0438",
}


def get_research_template_header(field: str) -> str:
    report_header = get_research_header("uz", field)
    if report_header != field:
        return report_header
    return RESEARCH_TEMPLATE_EXTRA_LABELS.get(field, field)


RESEARCH_TEMPLATE_EXAMPLE = {
    "full_name": "\u0410\u043b\u0438\u0435\u0432 \u0410\u043b\u0438 \u0412\u0430\u043b\u0438\u0435\u0432\u0438\u0447",
    "school_name": "12-\u043c\u0430\u043a\u0442\u0430\u0431",
    "settlement": "\u0422\u043e\u0448\u043a\u0435\u043d\u0442",
    "birth_place": "\u0422\u043e\u0448\u043a\u0435\u043d\u0442",
    "birth_date": "2015-04-18",
    "gender": "\u040e\u0493\u0438\u043b \u0431\u043e\u043b\u0430",
    "father_nationality": "\u040e\u0437\u0431\u0435\u043a",
    "mother_nationality": "\u040e\u0437\u0431\u0435\u043a",
    "children_count": 3,
    "child_order": 1,
    "feeding_type": "\u0422\u0430\u0431\u0438\u0438\u0439",
    "parents_marriage": "\u049a\u0430\u0440\u0438\u043d\u0434\u043e\u0448 \u044d\u043c\u0430\u0441",
    "mother_health_status": "\u0421\u043e\u0493\u043b\u043e\u043c",
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


def research_record_to_dict(
    record: ResearchRecord,
    current_user: Optional[User] = None,
    privacy_enabled: Optional[bool] = None,
    lang: str = "uz",
) -> dict:
    payload = {
        column.name: getattr(record, column.name)
        for column in ResearchRecord.__table__.columns
    }
    
    # Maxfiylik faqat markaziy role sozlamasi orqali qo'llanadi.
    payload = redact_research_child_payload(
        payload, current_user, privacy_enabled=privacy_enabled
    )

    age_parts = _calculate_research_age_parts(record)
    if age_parts:
        years, months, days = age_parts
        payload["age_at_examination_years"] = years
        payload["age_at_examination_months"] = months
        payload["age_at_examination_days"] = days
        payload["age_at_examination"] = format_research_child_age(record, lang)
    else:
        payload["age_at_examination_years"] = None
        payload["age_at_examination_months"] = None
        payload["age_at_examination_days"] = None
        payload["age_at_examination"] = None

    payload["created_by_name"] = (
        record.created_by.name if getattr(record, "created_by", None) else None
    )
    payload["created_by_email"] = (
        record.created_by.email if getattr(record, "created_by", None) else None
    )
    payload["created_by_role"] = (
        record.created_by.role if getattr(record, "created_by", None) else None
    )
    payload["deleted_by_name"] = (
        record.deleted_by.name if getattr(record, "deleted_by", None) else None
    )
    from services.analyze_service import infer_uzbekistan_region

    payload["region"] = (
        infer_uzbekistan_region(record.settlement)
        or infer_uzbekistan_region(record.birth_place)
        or (
            record.created_by.region
            if getattr(record, "created_by", None)
            else None
        )
    )
    payload["district"] = (
        record.created_by.district if getattr(record, "created_by", None) else None
    )
    payload["mahalla"] = (
        record.created_by.mahalla if getattr(record, "created_by", None) else None
    )
    return payload


def _research_record_id_region(record: ResearchRecord, owner: User) -> str:
    """Resolve a regional ID from imported locality, then profile fallback."""
    from services.analyze_service import (
        _split_region_and_district,
        infer_uzbekistan_region,
    )

    region_source = (
        infer_uzbekistan_region(record.settlement)
        or infer_uzbekistan_region(record.birth_place)
        or (getattr(owner, "region", None) or "").strip()
        or (record.settlement or "").strip()
        or (record.birth_place or "").strip()
    )
    clean_region, _ = _split_region_and_district(region_source, None)
    return clean_region


def _research_record_id_district(record: ResearchRecord, owner: User) -> Optional[str]:
    """Resolve the district used in the regional research ID."""
    from services.analyze_service import infer_uzbekistan_district

    return (
        infer_uzbekistan_district(record.settlement)
        or infer_uzbekistan_district(record.birth_place)
        or infer_uzbekistan_district(getattr(owner, "district", None))
    )


def format_research_gender_for_xlsx(value, lang="uz") -> str:
    gender = str(value or "").strip().lower()
    is_male = gender in {"boy", "o'g'il", "ogil", "o'g'il bola", "ogil bola", "male", "erkak", "ўғил бола", "ўғил"}
    is_female = gender in {"girl", "qiz", "qiz bola", "female", "ayol", "қиз бола", "қиз"}
    
    if is_male:
        if lang == "tr":
            return "Erkek"
        elif lang == "tm":
            return "Oglan"
        elif lang == "en":
            return "Male"
        elif lang == "ru":
            return "\u041c\u0430\u043b\u044c\u0447\u0438\u043a"  # Мальчик
        elif lang == "kz":
            return "\u04b0\u043b \u0431\u0430\u043b\u0430"  # Ұл бала
        elif lang == "ky":
            return "\u042d\u0440\u043a\u0435\u043a \u0431\u0430\u043b\u0430"  # Эркек бала
        elif lang == "tg":
            return "\u041f\u0438\u0441\u0430\u0440\u0431\u0430\u0447\u0430"  # Писарбача
        else:
            return "\u040e\u0493\u0438\u043b \u0431\u043e\u043b\u0430"  # Ўғил бола
            
    if is_female:
        if lang == "tr":
            return "K\u0131z"
        elif lang == "tm":
            return "Gyz"
        elif lang == "en":
            return "Female"
        elif lang == "ru":
            return "\u0414\u0435\u0432\u043e\u0447\u043a\u0430"  # Девочка
        elif lang == "kz":
            return "\u049a\u044b\u0437 \u0431\u0430\u043b\u0430"  # Қыз бала
        elif lang == "ky":
            return "\u041a\u044b\u0437 \u0431\u0430\u043b\u0430"  # Кыз бала
        elif lang == "tg":
            return "\u0414\u0443\u0445\u0442\u0430\u0440\u0431\u0430\u0447\u0430"  # Духтарбача
        else:
            return "\u049a\u0438\u0437 \u0431\u043e\u043b\u0430"  # Қиз бола
            
    if not value:
        return "-"
    if lang == "uz":
        return lat2cyr(str(value))
    return str(value)


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

RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS = [
    "tbw_percent",
    "fat_percent",
    "fat_mass",
    "muscle_mass",
    "bone_mass",
    "acm_percent",
    "visceral_fat",
]

RESEARCH_BIOIMPEDANCE_EXPORT_LABELS = {
    "uz": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "\u0401\u0493 (%)",
        "fat_mass": "\u0401\u0493 (\u043a\u0433)",
        "muscle_mass": "\u041c\u0443\u0448\u0430\u043a (\u043a\u0433)",
        "bone_mass": "\u0421\u0443\u044f\u043a (\u043a\u0433)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "\u0412\u0438\u0441\u0446\u0435\u0440\u0430\u043b \u0451\u0493",
    },
    "ru": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "\u0416\u0438\u0440 (%)",
        "fat_mass": "\u0416\u0438\u0440 (\u043a\u0433)",
        "muscle_mass": "\u041c\u044b\u0448\u0446\u044b (\u043a\u0433)",
        "bone_mass": "\u041a\u043e\u0441\u0442\u0438 (\u043a\u0433)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "\u0412\u0438\u0441\u0446\u0435\u0440\u0430\u043b\u044c\u043d\u044b\u0439 \u0436\u0438\u0440",
    },
    "en": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "Fat (%)",
        "fat_mass": "Fat (kg)",
        "muscle_mass": "Muscle (kg)",
        "bone_mass": "Bone (kg)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "Visceral Fat",
    },
    "kz": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "\u041c\u0430\u0439 (%)",
        "fat_mass": "\u041c\u0430\u0439 (\u043a\u0433)",
        "muscle_mass": "\u0411\u04b1\u043b\u0448\u044b\u049b\u0435\u0442 (\u043a\u0433)",
        "bone_mass": "\u0421\u04af\u0439\u0435\u043a (\u043a\u0433)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "\u0412\u0438\u0441\u0446\u0435\u0440\u0430\u043b\u0434\u044b \u043c\u0430\u0439",
    },
    "ky": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "\u041c\u0430\u0439 (%)",
        "fat_mass": "\u041c\u0430\u0439 (\u043a\u0433)",
        "muscle_mass": "\u0411\u0443\u043b\u0447\u0443\u04a3 (\u043a\u0433)",
        "bone_mass": "\u0421\u04e9\u04e9\u043a (\u043a\u0433)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "\u0412\u0438\u0441\u0446\u0435\u0440\u0430\u043b\u0434\u044b\u043a \u043c\u0430\u0439",
    },
    "tg": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "\u0420\u0430\u0432\u0493\u0430\u043d (%)",
        "fat_mass": "\u0420\u0430\u0432\u0493\u0430\u043d (\u043a\u0433)",
        "muscle_mass": "\u041c\u0443\u0448\u0430\u043a (\u043a\u0433)",
        "bone_mass": "\u0423\u0441\u0442\u0443\u0445\u043e\u043d (\u043a\u0433)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "\u0420\u0430\u0432\u0493\u0430\u043d\u0438 \u0432\u0438\u0441\u0441\u0435\u0440\u0430\u043b\u04e3",
    },
    "tm": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "Yag (%)",
        "fat_mass": "Yag (kg)",
        "muscle_mass": "Muskul (kg)",
        "bone_mass": "Sunk (kg)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "Wisseral yag",
    },
    "tr": {
        "tbw_percent": "TBW (%)",
        "fat_percent": "Ya\u011f (%)",
        "fat_mass": "Ya\u011f (kg)",
        "muscle_mass": "Kas (kg)",
        "bone_mass": "Kemik (kg)",
        "acm_percent": "ACM (%)",
        "visceral_fat": "Visseral ya\u011f",
    },
}

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
    "tr": {
        "tvi": "BMI",
        "z_h": "Boy-yas z-score",
        "z_w": "Kilo-yas z-score",
        "z_bmi": "BMI-yas z-score",
        "z_body_length": "Vucut uzunlugu z-score",
        "centile": "Persentil araligi",
        "corridor": "Saglik koridoru",
        "morphological_type": "Somatotip",
        "hmai": "HMAI",
        "mii": "MII",
        "adi": "ADI",
        "mcri": "MCRI",
    },
    "tm": {
        "tvi": "BMI",
        "z_h": "Boy-yas z-score",
        "z_w": "Agram-yas z-score",
        "z_bmi": "BMI-yas z-score",
        "z_body_length": "Beden uzynlygy z-score",
        "centile": "Persentil aralygy",
        "corridor": "Saglyk koridory",
        "morphological_type": "Somatotip",
        "hmai": "HMAI",
        "mii": "MII",
        "adi": "ADI",
        "mcri": "MCRI",
    },
    "ky": {
        "tvi": "BMI",
        "z_h": "Бой-жаш z-score",
        "z_w": "Салмак-жаш z-score",
        "z_bmi": "BMI-жаш z-score",
        "z_body_length": "Дене узундугу z-score",
        "centile": "Центилдик интервал",
        "corridor": "Ден соолук коридору",
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
    "tr": "Muayene tarihindeki yas",
    "tm": "Barlag senesindaki yasy",
    "ky": "Текшерүү күнүндөгү жашы",
}

RESEARCH_AGE_GROUP_EXPORT_LABELS = {
    "uz": "Ёш гуруҳи",
    "ru": "Vozrastnaya gruppa",
    "en": "Age group",
    "kz": "Jas toby",
    "tr": "Yas grubu",
    "tm": "Yas toparlary",
    "ky": "Жаш тобу",
}

RESEARCH_CHILD_AGE_UNITS = {
    "uz": ("ёш", "ой", "кун"),
    "ru": ("г.", "мес.", "дн."),
    "en": ("years", "months", "days"),
    "kz": ("жас", "ай", "күн"),
    "tr": ("yas", "ay", "gun"),
    "tm": ("yas", "ay", "gun"),
    "ky": ("жаш", "ай", "күн"),
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
        "tr": {
            "< 3": "Cok zayif (<3. persentil)",
            "3 - 15": "Zayif (3-15. persentil)",
            "15 - 85": "Normal (15-85. persentil)",
            "85 - 97": "Fazla kilolu (85-97. persentil)",
            "> 97": "Obezite (>97. persentil)",
        },
        "tm": {
            "< 3": "Pes agram (<3-persentil)",
            "3 - 15": "Agram yetmezciligi (3-15-persentil)",
            "15 - 85": "Kada (15-85-persentil)",
            "85 - 97": "Artyk agram (85-97-persentil)",
            "> 97": "Semizlik (>97-persentil)",
        },
        "ky": {
            "< 3": "Өтө аз салмак (<3-центиль)",
            "3 - 15": "Салмак жетишсиздиги (3-15-центиль)",
            "15 - 85": "Норма (15-85-центиль)",
            "85 - 97": "Ашыкча салмак (85-97-центиль)",
            "> 97": "Семирүү (>97-центиль)",
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
        "tr": {
            "astenik": "Astenik",
            "normostenik": "Normostenik",
            "giperstenik": "Hiperstenik",
        },
        "tm": {
            "astenik": "Astenik",
            "normostenik": "Normostenik",
            "giperstenik": "Hiperstenik",
        },
        "ky": {
            "astenik": "Астеник",
            "normostenik": "Нормостеник",
            "giperstenik": "Гиперстеник",
        },
    },
}


RESEARCH_INDEX_EXPORT_LABELS["tg"] = {
    **RESEARCH_INDEX_EXPORT_LABELS["uz"],
    "tvi": "BMI",
    "z_h": "Қад-синну сол z-score",
    "z_w": "Вазн-синну сол z-score",
    "z_bmi": "BMI-синну сол z-score",
    "z_body_length": "Дарозии бадан z-score",
    "centile": "Интервали сентилӣ",
    "corridor": "Коридори саломатӣ",
    "morphological_type": "Соматотип",
    "mcri": "MCRI",
}

RESEARCH_CHILD_AGE_EXPORT_LABELS["tg"] = "Синну сол дар санаи муоина"
RESEARCH_AGE_GROUP_EXPORT_LABELS["tg"] = "Гурӯҳи синнусолӣ"
RESEARCH_CHILD_AGE_UNITS["tg"] = ("сол", "моҳ", "рӯз")

if "corridor" in RESEARCH_INDEX_VALUE_LABELS:
    RESEARCH_INDEX_VALUE_LABELS["corridor"]["tg"] = {
        "< 3": "Камвазнии шадид (<3-сентил)",
        "3 - 15": "Камвазнӣ (3-15-сентил)",
        "15 - 85": "Меъёр (15-85-сентил)",
        "85 - 97": "Вазни зиёдатӣ (85-97-сентил)",
        "> 97": "Фарбеҳӣ (>97-сентил)",
    }
if "morphological_type" in RESEARCH_INDEX_VALUE_LABELS:
    RESEARCH_INDEX_VALUE_LABELS["morphological_type"]["tg"] = {
        "astenik": "Астеник",
        "normostenik": "Нормостеник",
        "giperstenik": "Гиперстеник",
    }


def get_research_index_export_headers(lang: str):
    labels = RESEARCH_INDEX_EXPORT_LABELS.get(lang, RESEARCH_INDEX_EXPORT_LABELS["uz"])
    return [
        (labels.get(field, RESEARCH_INDEX_EXPORT_LABELS["uz"].get(field, field)), field)
        for field in RESEARCH_INDEX_EXPORT_FIELDS
    ]


def get_research_bioimpedance_export_headers(lang: str):
    labels = RESEARCH_BIOIMPEDANCE_EXPORT_LABELS.get(
        lang, RESEARCH_BIOIMPEDANCE_EXPORT_LABELS["uz"]
    )
    return [
        (
            labels.get(
                field, RESEARCH_BIOIMPEDANCE_EXPORT_LABELS["uz"].get(field, field)
            ),
            field,
        )
        for field in RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
    ]


RESEARCH_BASE_EXPORT_FIELDS = [
    "created_at",
    "id",
    "full_name",
    "school_name",
    "settlement",
    "birth_place",
    "birth_date",
    "child_age",
    "age_group",
    "gender",
    "father_nationality",
    "mother_nationality",
    "living_since",
    "enrolled_date",
    "living_conditions",
    "labor_regime",
    "past_illnesses",
    "children_count",
    "child_order",
    "feeding_type",
    "parents_marriage",
    "mother_health_status",
    "examination_date",
    "lower_leg_total",
    "lower_leg_spina_iliaca",
    "lower_leg_symphysion",
    "lower_leg_length",
    "tibiale_height",
    "pelvic_width",
    "thigh_length",
    "thigh_circumference",
    "calf_length",
    "calf_circumference",
    "foot_length",
    "teeth_count",
    "menstruation_start",
    "skull_longitudinal",
    "skull_transverse",
    "head_circumference",
    "forehead_transverse",
    "skull_height",
    "skull_base_length",
    "skull_base_width",
    "face_bizygomatic",
    "face_bigonial",
    "face_morphological_height",
    "face_physiognomic_height",
    "nose_height",
    "nose_width",
    "outer_canthal_width",
    "inner_canthal_width",
    "lips_mucosa_height",
    "mouth_width",
    "chest_standing_height",
    "chest_sitting_height",
    "weight",
    "trunk_length",
    "torso_length",
    "chest_circumference_pause",
    "chest_circumference_inhale",
    "chest_circumference_exhale",
    "waist_circumference",
    "abdomen_circumference",
    "upper_segment_length",
    "chest_transverse_diameter",
    "chest_anteroposterior_diameter",
    "chest_height",
    "arm_length",
    "shoulder_length",
    "shoulder_width",
    "shoulder_circumference_rest",
    "shoulder_circumference_flexed",
    "forearm_length",
    "hand_length",
    "dynamometry",
    "fat_triceps",
    "fat_biceps",
    "fat_subscapular",
    "fat_iliac",
    "fat_popliteal",
]


def get_research_xlsx_export_field_order() -> list[str]:
    return (
        RESEARCH_BASE_EXPORT_FIELDS
        + RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
        + RESEARCH_INDEX_EXPORT_FIELDS
    )


def normalize_export_lang(lang: Optional[str]) -> str:
    value = (lang or "uz").strip().lower()
    if value == "kk":
        return "kz"
    return value if value in RESEARCH_INDEX_EXPORT_LABELS else "uz"


def get_research_index_value_label(group: str, key: str, lang: str):
    values = RESEARCH_INDEX_VALUE_LABELS.get(group, {})
    lang_values = values.get(lang, values.get("uz", {}))
    return lang_values.get(key, key)


def get_research_child_age_export_header(lang: str):
    return RESEARCH_CHILD_AGE_EXPORT_LABELS.get(
        lang, RESEARCH_CHILD_AGE_EXPORT_LABELS["uz"]
    )


def get_research_age_group_export_header(lang: str):
    return RESEARCH_AGE_GROUP_EXPORT_LABELS.get(
        lang, RESEARCH_AGE_GROUP_EXPORT_LABELS["uz"]
    )


def _parse_research_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())

    text = str(value).strip()
    date_numbers = re.findall(r"\d+", text)
    normalized = ".".join(date_numbers[:3]) if len(date_numbers) >= 3 else text
    candidates = (text[:10], normalized)
    for candidate in candidates:
        for fmt in (
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%Y.%m.%d",
            "%d.%m.%Y",
            "%d.%m.%y",
        ):
            try:
                return datetime.strptime(candidate, fmt)
            except ValueError:
                continue
    return None


def _calculate_research_age_parts(record: ResearchRecord):
    birth_date = _parse_research_date(record.birth_date)
    if not birth_date:
        return None
    exam_date = _parse_research_date(record.examination_date)
    if not exam_date:
        # Older/imported records may not have an explicit examination date.
        # Their creation date is the closest reliable date to the examination;
        # using it also keeps report calculations deterministic.
        exam_date = _parse_research_date(getattr(record, "created_at", None))
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


def calculate_research_age_group(record: ResearchRecord) -> Optional[float]:
    parts = _calculate_research_age_parts(record)
    if not parts:
        return None
    years, months, days = parts
    total_months = years * 12 + months + days / 30.4375
    half_year_units = int(total_months / 6 + 0.5)
    half_year_units = max(2, min(14, half_year_units))
    return half_year_units / 2


def format_research_age_group(record: ResearchRecord):
    age_group = calculate_research_age_group(record)
    if age_group is None:
        return None
    if float(age_group).is_integer():
        return str(int(age_group))
    return str(age_group).replace(".", ",")


def _calculate_research_age(record: ResearchRecord) -> Optional[int]:
    parts = _calculate_research_age_parts(record)
    if not parts:
        return None
    return parts[0]


def build_research_index_export_values(
    record: ResearchRecord, lang: str = "uz"
) -> dict:
    height = float(record.chest_standing_height or 0)
    weight = float(record.weight or 0)
    empty_values = dict.fromkeys(
        RESEARCH_INDEX_EXPORT_FIELDS + RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
    )
    if height <= 0 or weight <= 0:
        return empty_values

    # BMI/TVI does not depend on age and must still be exported when dates are
    # incomplete. Previously the early age check blanked this column together
    # with every calculated index.
    tvi = round(weight / ((height / 100) ** 2), 2)
    empty_values["tvi"] = tvi

    manual_data = {
        # Current forms use torso_length, while legacy/imported datasets store
        # the same body-length measurement in trunk_length.
        "body_length": record.torso_length or record.trunk_length,
        "chest": record.chest_circumference_pause,
        "region": record.settlement or record.birth_place,
        "address": record.settlement or record.birth_place,
    }
    composition = calculate_age_independent_indices(
        record.gender or "",
        height,
        weight,
        tvi,
        manual_data,
    )
    empty_values.update(
        {
            "hmai": composition["hmai"],
            "tbw_percent": composition["tbw_percent"],
            "fat_percent": round(composition["fm_percent"], 1),
            "fat_mass": round(composition["fm"], 1),
            "muscle_mass": round(composition["muscle_mass"], 1),
            "bone_mass": round(composition["bone_mass"], 1),
            "acm_percent": composition["acm_percent"],
            "visceral_fat": composition["visceral_fat"],
        }
    )

    age = _calculate_research_age(record)
    if age is None:
        return empty_values

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
        "tbw_percent": detailed.get("tbw_percent"),
        "fat_percent": detailed.get("fm_percent"),
        "fat_mass": detailed.get("fm"),
        "muscle_mass": detailed.get("muscle_mass"),
        "bone_mass": detailed.get("bone_mass"),
        "acm_percent": detailed.get("acm_percent"),
        "visceral_fat": detailed.get("visceral_fat"),
        "tvi": tvi,
        "z_h": detailed.get("z_h"),
        "z_w": detailed.get("z_w"),
        "z_bmi": detailed.get("z_bmi"),
        "z_body_length": detailed.get("z_body_length"),
        "centile": centile,
        "corridor": get_research_index_value_label(
            "corridor", centile, normalize_export_lang(lang)
        ),
        "morphological_type": get_research_index_value_label(
            "morphological_type", morph_type_key, normalize_export_lang(lang)
        ),
        "hmai": detailed.get("hmai"),
        "mii": detailed.get("mii"),
        "adi": detailed.get("adi"),
        "mcri": detailed.get("mcri"),
    }


def filter_by_parents_marriage(query, val: str):
    import re
    val_norm = val.strip().lower()
    val_norm = re.sub(r"\s*\(.*?\)", "", val_norm).strip()
    
    if val_norm in ["qarindosh emas", "notrelative", "not relative", "not_relative", "неродственный", "хеш нест", "туыс емес", "garyndash dal", "akraba degil"]:
        return query.filter(
            ResearchRecord.parents_marriage.ilike("%qarindosh emas%")
            | ResearchRecord.parents_marriage.ilike("%қариндош эмас%")
            | ResearchRecord.parents_marriage.ilike("%қариндош емас%")
            | ResearchRecord.parents_marriage.ilike("%кариндош эмас%")
            | ResearchRecord.parents_marriage.ilike("%кариндош емас%")
            | ResearchRecord.parents_marriage.ilike("%неродственный%")
            | ResearchRecord.parents_marriage.ilike("%not%relat%")
            | ResearchRecord.parents_marriage.ilike("%туыс емес%")
            | ResearchRecord.parents_marriage.ilike("%хеш нест%")
            | ResearchRecord.parents_marriage.ilike("%garyndash dal%")
            | ResearchRecord.parents_marriage.ilike("%akraba degil%")
        )
    elif val_norm in ["yaqin qarindosh", "closerelative", "close relative", "close_relative", "близкородственный", "родственный", "хеши наздик", "жақын туыс", "жакын тууган", "yakin garyndash", "yakyn garyndas", "yakin akraba"]:
        return query.filter(
            ResearchRecord.parents_marriage.ilike("%yaqin qarindosh%")
            | ResearchRecord.parents_marriage.ilike("%яқин қариндош%")
            | ResearchRecord.parents_marriage.ilike("%якин кариндош%")
            | ResearchRecord.parents_marriage.ilike("%близкородственный%")
            | ResearchRecord.parents_marriage.ilike("%родственный%")
            | ResearchRecord.parents_marriage.ilike("%close%relat%")
            | ResearchRecord.parents_marriage.ilike("%жақын туыс%")
            | ResearchRecord.parents_marriage.ilike("%жакын тууган%")
            | ResearchRecord.parents_marriage.ilike("%хеши наздик%")
            | ResearchRecord.parents_marriage.ilike("%yakin garyndash%")
            | ResearchRecord.parents_marriage.ilike("%yakyn garynda%")
            | ResearchRecord.parents_marriage.ilike("%yakin akraba%")
        )
    elif val_norm in ["uzoq qarindosh", "distantrelative", "distant relative", "distant_relative", "дальнородственный", "дальнеродственный", "хеши дур", "алыс туыс", "алыс тууган", "uzak garyndash", "uzak akraba"]:
        return query.filter(
            ResearchRecord.parents_marriage.ilike("%uzoq qarindosh%")
            | ResearchRecord.parents_marriage.ilike("%узоқ қариндош%")
            | ResearchRecord.parents_marriage.ilike("%узок кариндош%")
            | ResearchRecord.parents_marriage.ilike("%дальнородственный%")
            | ResearchRecord.parents_marriage.ilike("%дальнеродственный%")
            | ResearchRecord.parents_marriage.ilike("%distant%relat%")
            | ResearchRecord.parents_marriage.ilike("%алыс туыс%")
            | ResearchRecord.parents_marriage.ilike("%алыс тууган%")
            | ResearchRecord.parents_marriage.ilike("%хеши дур%")
            | ResearchRecord.parents_marriage.ilike("%uzak garyndash%")
            | ResearchRecord.parents_marriage.ilike("%uzak akraba%")
        )
    else:
        return query.filter(ResearchRecord.parents_marriage.ilike(f"%{val_norm}%"))


def filter_by_feeding_type(query, val: str):
    import re
    val_norm = val.strip().lower()
    val_norm = re.sub(r"\s*\(.*?\)", "", val_norm).strip()
    
    if val_norm in ["tabiiy", "natural", "естественное", "табигый", "табиӣ", "табиғи", "tebigy", "dogal"]:
        return query.filter(
            ResearchRecord.feeding_type.ilike("%tabiiy%")
            | ResearchRecord.feeding_type.ilike("%табиий%")
            | ResearchRecord.feeding_type.ilike("%естествен%")
            | ResearchRecord.feeding_type.ilike("%natural%")
            | ResearchRecord.feeding_type.ilike("%табигый%")
            | ResearchRecord.feeding_type.ilike("%табиӣ%")
            | ResearchRecord.feeding_type.ilike("%табиғи%")
            | ResearchRecord.feeding_type.ilike("%tebigy%")
            | ResearchRecord.feeding_type.ilike("%dogal%")
        )
    elif val_norm in ["sun'iy", "suniy", "artificial", "искусственное", "жасалма", "сунъӣ", "жасанды", "suny", "yapay"]:
        return query.filter(
            ResearchRecord.feeding_type.ilike("%sun'iy%")
            | ResearchRecord.feeding_type.ilike("%suniy%")
            | ResearchRecord.feeding_type.ilike("%сунъий%")
            | ResearchRecord.feeding_type.ilike("%искусствен%")
            | ResearchRecord.feeding_type.ilike("%artificial%")
            | ResearchRecord.feeding_type.ilike("%жасалма%")
            | ResearchRecord.feeding_type.ilike("%сунъӣ%")
            | ResearchRecord.feeding_type.ilike("%жасанды%")
            | ResearchRecord.feeding_type.ilike("%suny%")
            | ResearchRecord.feeding_type.ilike("%yapay%")
        )
    elif val_norm in ["aralash", "mixed", "смешанное", "аралаш", "омехта", "аралас", "garyszyk", "karisik"]:
        return query.filter(
            ResearchRecord.feeding_type.ilike("%aralash%")
            | ResearchRecord.feeding_type.ilike("%аралаш%")
            | ResearchRecord.feeding_type.ilike("%смешан%")
            | ResearchRecord.feeding_type.ilike("%mixed%")
            | ResearchRecord.feeding_type.ilike("%омехта%")
            | ResearchRecord.feeding_type.ilike("%аралас%")
            | ResearchRecord.feeding_type.ilike("%garyszyk%")
            | ResearchRecord.feeding_type.ilike("%karisik%")
        )
    else:
        return query.filter(ResearchRecord.feeding_type.ilike(f"%{val_norm}%"))


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
    privacy_enabled: Optional[bool] = None,
):
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    privacy_restricted = bool(privacy_enabled)
    if search and privacy_restricted:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.id_code.ilike(like)
            | ResearchRecord.settlement.ilike(like)
        )
    elif search:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.full_name.ilike(like)
            | ResearchRecord.school_name.ilike(like)
            | ResearchRecord.settlement.ilike(like)
        )
    if full_name and not privacy_restricted:
        query = query.filter(ResearchRecord.full_name.ilike(f"%{full_name}%"))
    if school_name and not privacy_restricted:
        query = query.filter(ResearchRecord.school_name.ilike(f"%{school_name}%"))
    if settlement:
        s = settlement.strip()
        settlement_filter = ResearchRecord.settlement.ilike(f"%{s}%")
        if not privacy_restricted:
            settlement_filter = settlement_filter | ResearchRecord.birth_place.ilike(
                f"%{s}%"
            )
        query = query.filter(settlement_filter)
    if feeding_type:
        query = filter_by_feeding_type(query, feeding_type)
    if parents_marriage:
        query = filter_by_parents_marriage(query, parents_marriage)
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
                (ResearchRecord.gender.ilike("%erkak%"))
                | (ResearchRecord.gender.ilike("%male%"))
                | (ResearchRecord.gender.ilike("%boy%"))
                | (ResearchRecord.gender.ilike("%o'g%"))
                | (ResearchRecord.gender.ilike("%og%"))
            )
        elif gender_norm in ["ayol", "female", "girl", "qiz"]:
            query = query.filter(
                (ResearchRecord.gender.ilike("%ayol%"))
                | (ResearchRecord.gender.ilike("%female%"))
                | (ResearchRecord.gender.ilike("%girl%"))
                | (ResearchRecord.gender.ilike("%qiz%"))
            )
        else:
            query = query.filter(func.lower(ResearchRecord.gender) == gender_norm)
    return query


def get_current_researcher_or_superadmin(
    request: Request,
    accessToken: Optional[str] = Query(None),
    db: Session = Depends(get_db),
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
            raise HTTPException(
                status_code=401, detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    # 3. Userni topish
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if getattr(user, "is_deleted", 0) == 1:
        raise HTTPException(
            status_code=403, detail="Foydalanuvchi bloklangan yoki o'chirilgan"
        )

    # 4. Roli bo'yicha tekshirish
    is_researcher_assistant = (
        user.role == "field_assistant"
        and user.supervisor is not None
        and user.supervisor.role == "researcher"
        and getattr(user.supervisor, "is_deleted", 0) != 1
    )
    if user.role not in ["researcher", "superadmin"] and not is_researcher_assistant:
        raise HTTPException(
            status_code=403, detail="Sizda ushbu amalni bajarish uchun ruxsat yo'q."
        )

    # Update activity — 5 daqiqada bir marta (har so'rovda commit qilmaslik)
    _now = datetime.utcnow()
    _last = getattr(user, "last_active_at", None)
    if _last is None or (_now - _last).total_seconds() > 300:
        user.last_active_at = _now
        try:
            db.commit()
        except Exception:
            db.rollback()

    return user


# ═══════════════════════════════════════════════
#  STATIC PATHS — MUST BE BEFORE /{record_id}
# ═══════════════════════════════════════════════


@router.get("/deleted/list")
def list_deleted_research(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    paginated: bool = Query(False),
    all_ids: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """O'chirilgan yozuvlar ro'yxati — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.deleted_by))
        .filter(ResearchRecord.is_deleted == 1)
        .order_by(ResearchRecord.deleted_at.desc())
    )
    if all_ids:
        return [record_id for (record_id,) in query.with_entities(ResearchRecord.id).all()]
    total = query.order_by(None).count()
    records = query.offset((page - 1) * page_size).limit(page_size).all()
    privacy_enabled = get_child_privacy_enabled(db, current_user)
    items = [
        research_record_to_dict(
            record, current_user, privacy_enabled=privacy_enabled
        )
        for record in records
    ]
    if paginated:
        return {"items": items, "total": int(total)}
    return items


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
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Eksport qilishga ruxsatingiz yo'q")
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
        privacy_enabled=get_child_privacy_enabled(db, current_user),
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

    # Age filter — SQL orqali (Python loop o'rniga)
    if age_min is not None or age_max is not None:
        if age_min is not None:
            query = query.filter(
                ResearchRecord.birth_date.isnot(None),
                (
                    func.julianday(
                        func.coalesce(
                            ResearchRecord.examination_date,
                            func.strftime("%Y-%m-%d", "now"),
                        )
                    )
                    - func.julianday(ResearchRecord.birth_date)
                )
                / 365.25
                >= age_min,
            )
        if age_max is not None:
            query = query.filter(
                ResearchRecord.birth_date.isnot(None),
                (
                    func.julianday(
                        func.coalesce(
                            ResearchRecord.examination_date,
                            func.strftime("%Y-%m-%d", "now"),
                        )
                    )
                    - func.julianday(ResearchRecord.birth_date)
                )
                / 365.25
                <= age_max,
            )

    # Export limit: xotira uchun maksimal 10000 yozuv
    records = query.order_by(ResearchRecord.id.desc()).limit(10000).all()
    if not records:
        raise HTTPException(status_code=404, detail="Ma'lumotlar mavjud emas")

    wb = Workbook()
    ws = wb.active
    ws.title = "Research Data"

    # 1. Заголовки (Локализованные)
    headers_map = [
        (get_research_header(export_lang, "created_at"), "created_at"),
        (get_research_header(export_lang, "id"), "id"),
        (get_research_header(export_lang, "full_name"), "full_name"),
        (get_research_header(export_lang, "school_name"), "school_name"),
        (get_research_header(export_lang, "settlement"), "settlement"),
        (get_research_header(export_lang, "birth_place"), "birth_place"),
        (get_research_header(export_lang, "birth_date"), "birth_date"),
        (get_research_child_age_export_header(export_lang), "child_age"),
        (get_research_age_group_export_header(export_lang), "age_group"),
        (get_research_header(export_lang, "gender"), "gender"),
        (get_research_header(export_lang, "father_nationality"), "father_nationality"),
        (get_research_header(export_lang, "mother_nationality"), "mother_nationality"),
        (get_research_header(export_lang, "living_since"), "living_since"),
        (get_research_header(export_lang, "enrolled_date"), "enrolled_date"),
        (get_research_header(export_lang, "living_conditions"), "living_conditions"),
        (get_research_header(export_lang, "labor_regime"), "labor_regime"),
        (get_research_header(export_lang, "past_illnesses"), "past_illnesses"),
        (get_research_header(export_lang, "children_count"), "children_count"),
        (get_research_header(export_lang, "child_order"), "child_order"),
        (get_research_header(export_lang, "feeding_type"), "feeding_type"),
        (get_research_header(export_lang, "parents_marriage"), "parents_marriage"),
        (
            get_research_header(export_lang, "mother_health_status"),
            "mother_health_status",
        ),
        (get_research_header(export_lang, "examination_date"), "examination_date"),
        # I Показатели физического развития
        (get_research_header(export_lang, "lower_leg_total"), "lower_leg_total"),
        (
            get_research_header(export_lang, "lower_leg_spina_iliaca"),
            "lower_leg_spina_iliaca",
        ),
        (
            get_research_header(export_lang, "lower_leg_symphysion"),
            "lower_leg_symphysion",
        ),
        (get_research_header(export_lang, "lower_leg_length"), "lower_leg_length"),
        (get_research_header(export_lang, "tibiale_height"), "tibiale_height"),
        (get_research_header(export_lang, "pelvic_width"), "pelvic_width"),
        (get_research_header(export_lang, "thigh_length"), "thigh_length"),
        (
            get_research_header(export_lang, "thigh_circumference"),
            "thigh_circumference",
        ),
        (get_research_header(export_lang, "calf_length"), "calf_length"),
        (get_research_header(export_lang, "calf_circumference"), "calf_circumference"),
        (get_research_header(export_lang, "foot_length"), "foot_length"),
        (get_research_header(export_lang, "teeth_count"), "teeth_count"),
        (get_research_header(export_lang, "menstruation_start"), "menstruation_start"),
        # II Определение формы черепа
        (get_research_header(export_lang, "skull_longitudinal"), "skull_longitudinal"),
        (get_research_header(export_lang, "skull_transverse"), "skull_transverse"),
        (get_research_header(export_lang, "head_circumference"), "head_circumference"),
        (
            get_research_header(export_lang, "forehead_transverse"),
            "forehead_transverse",
        ),
        (get_research_header(export_lang, "skull_height"), "skull_height"),
        (get_research_header(export_lang, "skull_base_length"), "skull_base_length"),
        (get_research_header(export_lang, "skull_base_width"), "skull_base_width"),
        # Лицо
        (get_research_header(export_lang, "face_bizygomatic"), "face_bizygomatic"),
        (get_research_header(export_lang, "face_bigonial"), "face_bigonial"),
        (
            get_research_header(export_lang, "face_morphological_height"),
            "face_morphological_height",
        ),
        (
            get_research_header(export_lang, "face_physiognomic_height"),
            "face_physiognomic_height",
        ),
        (get_research_header(export_lang, "nose_height"), "nose_height"),
        (get_research_header(export_lang, "nose_width"), "nose_width"),
        (
            get_research_header(export_lang, "outer_canthal_width"),
            "outer_canthal_width",
        ),
        (
            get_research_header(export_lang, "inner_canthal_width"),
            "inner_canthal_width",
        ),
        (get_research_header(export_lang, "lips_mucosa_height"), "lips_mucosa_height"),
        (get_research_header(export_lang, "mouth_width"), "mouth_width"),
        # Грудь
        (
            get_research_header(export_lang, "chest_standing_height"),
            "chest_standing_height",
        ),
        (
            get_research_header(export_lang, "chest_sitting_height"),
            "chest_sitting_height",
        ),
        (get_research_header(export_lang, "weight"), "weight"),
        (get_research_header(export_lang, "trunk_length"), "trunk_length"),
        (get_research_header(export_lang, "torso_length"), "torso_length"),
        (
            get_research_header(export_lang, "chest_circumference_pause"),
            "chest_circumference_pause",
        ),
        (
            get_research_header(export_lang, "chest_circumference_inhale"),
            "chest_circumference_inhale",
        ),
        (
            get_research_header(export_lang, "chest_circumference_exhale"),
            "chest_circumference_exhale",
        ),
        (
            get_research_header(export_lang, "waist_circumference"),
            "waist_circumference",
        ),
        (
            get_research_header(export_lang, "abdomen_circumference"),
            "abdomen_circumference",
        ),
        (
            get_research_header(export_lang, "upper_segment_length"),
            "upper_segment_length",
        ),
        (
            get_research_header(export_lang, "chest_transverse_diameter"),
            "chest_transverse_diameter",
        ),
        (
            get_research_header(export_lang, "chest_anteroposterior_diameter"),
            "chest_anteroposterior_diameter",
        ),
        (get_research_header(export_lang, "chest_height"), "chest_height"),
        # Верхняя конечность
        (get_research_header(export_lang, "arm_length"), "arm_length"),
        (get_research_header(export_lang, "shoulder_length"), "shoulder_length"),
        (get_research_header(export_lang, "shoulder_width"), "shoulder_width"),
        (
            get_research_header(export_lang, "shoulder_circumference_rest"),
            "shoulder_circumference_rest",
        ),
        (
            get_research_header(export_lang, "shoulder_circumference_flexed"),
            "shoulder_circumference_flexed",
        ),
        (get_research_header(export_lang, "forearm_length"), "forearm_length"),
        (get_research_header(export_lang, "hand_length"), "hand_length"),
        (get_research_header(export_lang, "dynamometry"), "dynamometry"),
        # Толщина подкожно-жировой клетчатки
        (get_research_header(export_lang, "fat_triceps"), "fat_triceps"),
        (get_research_header(export_lang, "fat_biceps"), "fat_biceps"),
        (get_research_header(export_lang, "fat_subscapular"), "fat_subscapular"),
        (get_research_header(export_lang, "fat_iliac"), "fat_iliac"),
        (get_research_header(export_lang, "fat_popliteal"), "fat_popliteal"),
    ]

    if current_user.role == "superadmin":
        headers_map.insert(
            2, (get_research_header(export_lang, "created_by_name"), "created_by_name")
        )
        headers_map.insert(
            3,
            (get_research_header(export_lang, "created_by_email"), "created_by_email"),
        )

    headers_map.extend(get_research_bioimpedance_export_headers(export_lang))
    headers_map.extend(get_research_index_export_headers(export_lang))
    if get_child_privacy_enabled(db, current_user):
        headers_map = [
            item for item in headers_map if item[1] not in CHILD_PII_EXPORT_FIELDS
        ]

    # Style definitions
    header_fill = PatternFill(
        start_color="3498DB", end_color="3498DB", fill_type="solid"
    )
    header_font = Font(color="FFFFFF", bold=True)
    zebra_fill = PatternFill(
        start_color="F2F2F2", end_color="F2F2F2", fill_type="solid"
    )
    border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin"),
    )
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")

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
            elif field_name == "age_group":
                val = format_research_age_group(record)
            elif field_name in index_values:
                val = index_values[field_name]
            else:
                val = getattr(record, field_name, None)

            # Special formatting
            if field_name == "created_at":
                display_val = val.strftime("%Y-%m-%d %H:%M") if val else "-"
            elif field_name == "id":
                display_val = record.id_code if record.id_code else val
            elif field_name == "gender":
                display_val = format_research_gender_for_xlsx(val, export_lang)
            elif field_name == "created_by_email":
                display_val = val if val else "-"
            elif field_name in {"child_age", "age_group"} or field_name in index_values:
                display_val = val if val is not None else "-"
            elif isinstance(val, str):
                from services.ky_localization import report_text

                localized = report_text(val, export_lang) if val else "-"
                if export_lang == "uz":
                    display_val = lat2cyr(localized) if localized != "-" else "-"
                else:
                    display_val = localized
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
                cell_length = len(str(cell.value))
            except (TypeError, ValueError):
                continue
            if cell_length > max_length:
                max_length = cell_length
        ws.column_dimensions[column].width = min(50, max_length + 2)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    filename = f"research_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-store, private",
        },
    )


def clean_import_value(value):
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return None if cleaned in {"", "-", "—"} else cleaned
    return value


def normalize_import_header(value) -> str:
    text = str(value or "").strip().lower()
    text = text.replace("*", " ")
    for old, new in {
        "ў": "o",
        "ӯ": "o",
        "ғ": "g",
        "қ": "q",
        "ҳ": "h",
        "й": "y",
        "ё": "yo",
        "я": "ya",
        "ю": "yu",
        "'": " ",
        "`": " ",
        "’": " ",
        "_": " ",
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
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    if field == "gender":
        return normalize_research_import_gender(value)
    if field in DATE_IMPORT_FIELDS:
        parsed = _parse_research_date(value)
        if not parsed:
            raise ValueError(f"{field}: sana YYYY-MM-DD formatida bo'lishi kerak")
        return parsed.strftime("%Y-%m-%d")
    if field in BOOLEAN_IMPORT_FIELDS:
        normalized = str(value).strip().lower()
        if normalized in {
            "1",
            "true",
            "yes",
            "ha",
            "\u04b3\u0430",
            "\u0442\u0430\u0441\u0434\u0438\u049b\u043b\u0430\u043d\u0433\u0430\u043d",
        }:
            return 1
        if normalized in {
            "0",
            "false",
            "no",
            "yo'q",
            "yoq",
            "\u0439\u045e\u049b",
        }:
            return 0
        raise ValueError(f"{field}: \u04b3\u0430 \u0451\u043a\u0438 \u0439\u045e\u049b \u0431\u045e\u043b\u0438\u0448\u0438 \u043a\u0435\u0440\u0430\u043a")
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
    return str(value).strip() if isinstance(value, str) else value


def map_import_headers(headers: List[str], privacy_enabled: bool = False) -> dict:
    # Accept every supported import column even while privacy is enabled.
    # Visibility is enforced when records are read/exported; dropping columns
    # here irreversibly destroyed data when the setting was later disabled.
    field_set = set(get_research_import_fields())
    label_aliases = {
        normalize_import_header(label): field
        for field, label in RESEARCH_TEMPLATE_LABELS.items()
        if field in field_set
    }
    label_aliases.update(
        {
            normalize_import_header(get_research_template_header(field)): field
            for field in field_set
        }
    )
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
        if field and field in field_set:
            mapped[index] = field
            known_count += 1

    if known_count and (
        privacy_enabled or known_count >= max(3, len([h for h in headers if h]) // 3)
    ):
        return mapped

    normalized_headers = [normalize_import_header(header) for header in headers]
    has_superadmin_owner_columns = (
        len(normalized_headers) > 3
        and "kiritgan" in normalized_headers[2]
        and "email" in normalized_headers[3]
    )
    export_order = [
        field for field in RESEARCH_EXPORT_FIELD_ORDER if field in field_set
    ]
    if has_superadmin_owner_columns:
        export_order = [
            "created_at",
            "id",
            "created_by_name",
            "created_by_email",
            *[field for field in RESEARCH_EXPORT_FIELD_ORDER[2:] if field in field_set],
        ]

    for index, field in enumerate(export_order[: len(headers)]):
        if field in field_set:
            mapped[index] = field
    return mapped


map_research_import_headers = map_import_headers


def build_research_import_template_workbook(
    privacy_enabled: bool = False,
) -> Workbook:
    wb = Workbook()
    ws = wb.active
    ws.title = "\u041c\u0430\u044a\u043b\u0443\u043c\u043e\u0442\u043b\u0430\u0440"
    template_fields = get_research_import_fields(privacy_enabled)
    input_headers = get_research_import_headers(privacy_enabled)
    template_headers = input_headers
    styles = get_research_xlsx_styles()
    wrapped_center = Alignment(
        horizontal="center", vertical="center", wrap_text=True
    )
    wrapped_left = Alignment(horizontal="left", vertical="top", wrap_text=True)

    for col_num, header_text in enumerate(template_headers, 1):
        header = ws.cell(row=1, column=col_num, value=header_text)
        header.fill = styles["header_fill"]
        header.font = styles["header_font"]
        header.alignment = wrapped_center
        header.border = styles["border"]
    ws.row_dimensions[1].height = 42

    # The main sheet deliberately starts blank so its example is never imported
    # as a real research record.
    for row_num in range(2, 102):
        for col_num in range(1, len(template_headers) + 1):
            cell = ws.cell(row=row_num, column=col_num, value=None)
            cell.alignment = styles["left_align"]
            cell.border = styles["border"]

    for col_num, header_text in enumerate(template_headers, 1):
        width = min(42, max(14, len(str(header_text)) + 2))
        ws.column_dimensions[ws.cell(row=1, column=col_num).column_letter].width = width

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{ws.cell(row=101, column=len(template_headers)).coordinate}"
    ws.sheet_view.showGridLines = False

    example_ws = wb.create_sheet("\u041d\u0430\u043c\u0443\u043d\u0430")
    for col_num, header_text in enumerate(input_headers, 1):
        header = example_ws.cell(row=1, column=col_num, value=header_text)
        header.fill = styles["header_fill"]
        header.font = styles["header_font"]
        header.alignment = wrapped_center
        header.border = styles["border"]
        cell = example_ws.cell(
            row=2,
            column=col_num,
            value=RESEARCH_TEMPLATE_EXAMPLE.get(template_fields[col_num - 1]),
        )
        cell.alignment = styles["left_align"]
        cell.border = styles["border"]
        example_ws.column_dimensions[header.column_letter].width = min(
            42, max(14, len(str(header_text)) + 2)
        )
    example_ws.freeze_panes = "A2"
    example_ws.row_dimensions[1].height = 42
    example_ws.sheet_view.showGridLines = False

    guide_ws = wb.create_sheet("\u049a\u045e\u043b\u043b\u0430\u043d\u043c\u0430")
    guide_rows = [
        [
            "\u0418\u043c\u043f\u043e\u0440\u0442 \u049b\u043e\u0438\u0434\u0430\u043b\u0430\u0440\u0438",
            "\u0418\u0437\u043e\u04b3",
        ],
        [
            "\u041c\u0430\u0436\u0431\u0443\u0440\u0438\u0439 \u043c\u0430\u0439\u0434\u043e\u043d\u043b\u0430\u0440",
            "\u041c\u0430\u0436\u0431\u0443\u0440\u0438\u0439 \u043c\u0430\u0439\u0434\u043e\u043d \u0439\u045e\u049b. \u0424.\u0418.\u0428., \u043c\u0430\u043a\u0442\u0430\u0431 \u0432\u0430 \u043c\u0430\u043d\u0437\u0438\u043b\u0441\u0438\u0437 \u04b3\u0430\u043c \u0438\u043c\u043f\u043e\u0440\u0442 \u049b\u0430\u0431\u0443\u043b \u049b\u0438\u043b\u0438\u043d\u0430\u0434\u0438.",
        ],
        [
            "\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u043a \u04b3\u0438\u0441\u043e\u0431",
            "\u0422\u0443\u0493\u0438\u043b\u0433\u0430\u043d \u0441\u0430\u043d\u0430, \u0442\u0435\u043a\u0448\u0438\u0440\u0443\u0432 \u0441\u0430\u043d\u0430\u0441\u0438, \u0436\u0438\u043d\u0441, \u0431\u045e\u0439 \u0432\u0430 \u0432\u0430\u0437\u043d \u043a\u0438\u0440\u0438\u0442\u0438\u043b\u0441\u0430, \u0431\u0438\u043e\u0438\u043c\u043f\u0435\u0434\u0430\u043d\u0441 \u043d\u0430\u0442\u0438\u0436\u0430\u043b\u0430\u0440\u0438 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u043a \u04b3\u0438\u0441\u043e\u0431\u043b\u0430\u043d\u0430\u0434\u0438.",
        ],
        [
            "\u0421\u0430\u043d\u0430 \u0444\u043e\u0440\u043c\u0430\u0442\u0438",
            "YYYY-MM-DD, \u043c\u0430\u0441\u0430\u043b\u0430\u043d: 2015-04-18.",
        ],
        [
            "\u0411\u0438\u043e\u0438\u043c\u043f\u0435\u0434\u0430\u043d\u0441 \u0443\u0441\u0442\u0443\u043d\u043b\u0430\u0440\u0438",
            "\u041e\u0445\u0438\u0440\u0433\u0438 7 \u0442\u0430 \u0443\u0441\u0442\u0443\u043d\u043d\u0438 \u0442\u045e\u043b\u0434\u0438\u0440\u0438\u0448 \u0448\u0430\u0440\u0442 \u044d\u043c\u0430\u0441; \u0443\u043b\u0430\u0440 \u0440\u0435\u043f\u043e\u0440\u0442\u0434\u0430 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u043a \u04b3\u0438\u0441\u043e\u0431\u043b\u0430\u043d\u0430\u0434\u0438.",
        ],
    ]
    for row in guide_rows:
        guide_ws.append(row)
    for row in guide_ws.iter_rows(
        min_row=1, max_row=len(guide_rows), min_col=1, max_col=2
    ):
        for cell in row:
            cell.border = styles["border"]
            cell.alignment = wrapped_center if cell.row == 1 else wrapped_left
            if cell.row == 1:
                cell.fill = styles["header_fill"]
                cell.font = styles["header_font"]
    guide_ws.row_dimensions[1].height = 28
    for row_num in range(2, len(guide_rows) + 1):
        guide_ws.row_dimensions[row_num].height = 48
    guide_ws.column_dimensions["A"].width = 32
    guide_ws.column_dimensions["B"].width = 110
    guide_ws.freeze_panes = "A2"
    guide_ws.sheet_view.showGridLines = False

    return wb


#  LIST  (superadmin hammani, researcher o'zini)


@router.get("/import/template")
def download_research_import_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    """Research XLSX import uchun export ko'rinishidagi shablon."""
    privacy_enabled = get_child_privacy_enabled(db, current_user)
    wb = build_research_import_template_workbook(privacy_enabled)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = "research_import_template.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-store, private",
        },
    )


@router.post("/import/xlsx")
async def import_research_xlsx(
    file: UploadFile = File(...),
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Import qilishga ruxsatingiz yo'q")
    region_offsets = {}
    filename = (file.filename or "").lower()
    if not filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Faqat .xlsx fayl qabul qilinadi")

    target_user = current_user
    if researcher_id is not None:
        if current_user.role != "superadmin":
            raise HTTPException(
                status_code=403, detail="Researcherni tanlash faqat superadmin uchun"
            )
        target_user = db.get(User, researcher_id)
        if not target_user or target_user.role != "researcher":
            raise HTTPException(status_code=404, detail="Researcher topilmadi")

    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Fayl hajmi 10 MB dan oshmasligi kerak")
        if not contents:
            raise HTTPException(status_code=400, detail="Bo'sh fayl yuklanmaydi")
        wb = await asyncio.to_thread(
            load_workbook, io.BytesIO(contents), data_only=True
        )
        ws = wb.active
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Excel fayl o'qilmadi: {exc}"
        ) from exc

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise HTTPException(status_code=400, detail="Excel faylda ma'lumot topilmadi")

    privacy_enabled = get_child_privacy_enabled(db, current_user)
    headers = [str(value or "").strip() for value in rows[0]]
    column_map = map_import_headers(headers, privacy_enabled)
    if not column_map:
        raise HTTPException(
            status_code=400, detail="Import uchun mos ustunlar topilmadi"
        )

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
        if row_errors:
            errors.append({"row": row_number, "errors": row_errors})
            continue

        record = ResearchRecord(**payload)
        record.created_by_id = target_user.id

        from services.analyze_service import generate_region_based_id

        clean_region = _research_record_id_region(record, target_user)
        clean_district = _research_record_id_district(record, target_user)
        location_key = (clean_region, clean_district)
        
        if location_key not in region_offsets:
            base_id = generate_region_based_id(db, clean_region, clean_district)
            parts = base_id.split("-")
            if len(parts) >= 3 and parts[-1].isdigit():
                region_offsets[location_key] = {
                    "prefix": "-".join(parts[:-1]),
                    "count": int(parts[-1])
                }
            else:
                region_offsets[location_key] = {"prefix": "MC-UNK", "count": 1}
                
        pfx = region_offsets[location_key]["prefix"]
        cnt = region_offsets[location_key]["count"]
        record.id_code = f"{pfx}-{cnt:04d}"
        region_offsets[location_key]["count"] += 1
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
        raise HTTPException(
            status_code=400, detail="Import qilish uchun ma'lumot topilmadi"
        )

    try:
        db.add_all(records)
        target_user.completed_entries_count = (
            target_user.completed_entries_count or 0
        ) + len(records)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import saqlanmadi: {exc}")

    return {"status": "ok", "imported": len(records), "skipped": skipped}


@router.get("/")
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
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    paginated: bool = Query(False),
    all_ids: bool = Query(False),
    include_export_values: bool = Query(False),
    lang: Optional[str] = Query("uz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.created_by))
        .filter(ResearchRecord.is_deleted == 0)
    )

    if current_user.role == "field_assistant":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)
    elif current_user.role == "researcher":
        # Researcher sees their own records + records of assistants supervised by them
        assistant_ids = db.query(User.id).filter(User.supervisor_id == current_user.id, User.role == "field_assistant").subquery()
        query = query.filter(
            (ResearchRecord.created_by_id == current_user.id) | 
            (ResearchRecord.created_by_id.in_(assistant_ids))
        )
    elif researcher_id:
        query = query.filter(ResearchRecord.created_by_id == researcher_id)

    # Generic search
    privacy_restricted = get_child_privacy_enabled(db, current_user)
    if search and privacy_restricted:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.id_code.ilike(like)
            | ResearchRecord.settlement.ilike(like)
        )
    elif search:
        like = f"%{search}%"
        query = query.filter(
            ResearchRecord.full_name.ilike(like)
            | ResearchRecord.school_name.ilike(like)
            | ResearchRecord.settlement.ilike(like)
        )

    # Specific demographic filters
    if full_name and not privacy_restricted:
        query = query.filter(ResearchRecord.full_name.ilike(f"%{full_name}%"))
    if school_name and not privacy_restricted:
        query = query.filter(ResearchRecord.school_name.ilike(f"%{school_name}%"))
    if settlement:
        s = settlement.strip()
        settlement_filter = ResearchRecord.settlement.ilike(f"%{s}%")
        if not privacy_restricted:
            settlement_filter = settlement_filter | ResearchRecord.birth_place.ilike(
                f"%{s}%"
            )
        query = query.filter(settlement_filter)
    if feeding_type:
        query = filter_by_feeding_type(query, feeding_type)
    if parents_marriage:
        query = filter_by_parents_marriage(query, parents_marriage)

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
                (ResearchRecord.gender.ilike("%erkak%"))
                | (ResearchRecord.gender.ilike("%male%"))
                | (ResearchRecord.gender.ilike("%boy%"))
                | (ResearchRecord.gender.ilike("%o'g%"))
                | (ResearchRecord.gender.ilike("%og%"))
            )
        elif gender_norm in ["ayol", "female", "girl", "qiz"]:
            query = query.filter(
                (ResearchRecord.gender.ilike("%ayol%"))
                | (ResearchRecord.gender.ilike("%female%"))
                | (ResearchRecord.gender.ilike("%girl%"))
                | (ResearchRecord.gender.ilike("%qiz%"))
            )
        else:
            query = query.filter(func.lower(ResearchRecord.gender) == gender_norm)

    # Age filter — endi SQL orqali (Python loop o'rniga)
    if age_min is not None or age_max is not None:
        # SQLite: julianday(exam_date) - julianday(birth_date) = kunlar soni
        # Yil: / 365.25
        # NULL bo'lsa chiqarib tashlash
        age_expr = func.cast(
            (
                func.julianday(
                    func.coalesce(
                        ResearchRecord.examination_date,
                        func.strftime("%Y-%m-%d", "now"),
                    )
                )
                - func.julianday(ResearchRecord.birth_date)
            )
            / 365.25,
            func.cast(0.0, type_=None).__class__,
        )
        if age_min is not None:
            query = query.filter(
                ResearchRecord.birth_date.isnot(None),
                (
                    func.julianday(
                        func.coalesce(
                            ResearchRecord.examination_date,
                            func.strftime("%Y-%m-%d", "now"),
                        )
                    )
                    - func.julianday(ResearchRecord.birth_date)
                )
                / 365.25
                >= age_min,
            )
        if age_max is not None:
            query = query.filter(
                ResearchRecord.birth_date.isnot(None),
                (
                    func.julianday(
                        func.coalesce(
                            ResearchRecord.examination_date,
                            func.strftime("%Y-%m-%d", "now"),
                        )
                    )
                    - func.julianday(ResearchRecord.birth_date)
                )
                / 365.25
                <= age_max,
            )

    if all_ids:
        return [record_id for (record_id,) in query.with_entities(ResearchRecord.id).all()]

    total = query.order_by(None).count()
    records = (
        query.order_by(ResearchRecord.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    privacy_enabled = get_child_privacy_enabled(db, current_user)
    items = [
        research_record_to_dict(
            record,
            current_user,
            privacy_enabled=privacy_enabled,
            lang=normalize_export_lang(lang),
        )
        for record in records
    ]
    if include_export_values:
        export_lang = normalize_export_lang(lang)
        for item, record in zip(items, records):
            item.update(build_research_index_export_values(record, export_lang))
    if paginated:
        return {"items": items, "total": int(total)}
    return items


@router.get("/export/dataset")
def export_dataset_for_analysis(
    gender: Optional[str] = Query(None),
    age_min: Optional[float] = Query(None),
    age_max: Optional[float] = Query(None),
    settlement: Optional[str] = Query(None),
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Eksport qilishga ruxsatingiz yo'q")
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
        settlement_filter = ResearchRecord.settlement.ilike(f"%{s}%")
        if not get_child_privacy_enabled(db, current_user):
            settlement_filter = settlement_filter | ResearchRecord.birth_place.ilike(
                f"%{s}%"
            )
        query = query.filter(settlement_filter)
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
        except (TypeError, ValueError):
            age = None

        if age_min is not None and (age is None or age < age_min):
            continue
        if age_max is not None and (age is None or age > age_max):
            continue

        # Encoding categories
        # Gender: 0=Boy, 1=Girl
        gender_code = 0 if r.gender == "Boy" else 1
        if not r.gender:
            gender_code = -1

        # Feeding: 0=Natural, 1=Artificial
        feeding_code = 0 if "Tabiiy" in (r.feeding_type or "") else 1

        # Marriage: 0=Non-relative, 1=Distant, 2=Close
        marriage_code = (
            2
            if "Yaqin" in (r.parents_marriage or "")
            else 1
            if "Uzoq" in (r.parents_marriage or "")
            else 0
        )

        dataset_row = {
            "id": r.id_code or r.id,
            "full_name": r.full_name,
            "age_years": age,
            "age_group": calculate_research_age_group(r),
            "gender": r.gender,
            "gender_code": gender_code,
            "settlement": r.settlement,
            "school": r.school_name,
            "weight": r.weight,
            "height": r.chest_standing_height,
            "bmi": round(r.weight / ((r.chest_standing_height / 100) ** 2), 2)
            if r.weight and r.chest_standing_height
            else None,
            "feeding_code": feeding_code,
            "marriage_code": marriage_code,
            "head_circ": r.head_circumference,
            "waist_circ": r.waist_circumference,
            "chest_circ": r.chest_circumference_pause,
            "created_at": r.created_at.strftime("%Y-%m-%d")
            if r.created_at
            else None,
        }
        if get_child_privacy_enabled(db, current_user):
            for field in ("full_name", "school"):
                dataset_row.pop(field, None)
        dataset.append(dataset_row)

    if not dataset:
        raise HTTPException(
            status_code=404, detail="Filterga mos ma'lumotlar topilmadi"
        )

    df = pd.DataFrame(dataset)

    # Save to Excel
    buf = io.BytesIO()
    df.to_excel(buf, index=False, engine="openpyxl")
    buf.seek(0)

    filename = f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-store, private",
        },
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
    lang: Optional[str] = Query("uz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Eksport qilishga ruxsatingiz yo'q")
    export_lang = normalize_export_lang(lang)
    query = (
        db.query(ResearchRecord)
        .options(joinedload(ResearchRecord.created_by))
        .filter(ResearchRecord.is_deleted == 0)
    )
    query = apply_research_filters(
        query,
        current_user,
        privacy_enabled=get_child_privacy_enabled(db, current_user),
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
    # Age filter — SQL orqali (Python loop o'rniga)
    if age_min is not None or age_max is not None:
        if age_min is not None:
            query = query.filter(
                ResearchRecord.birth_date.isnot(None),
                (
                    func.julianday(
                        func.coalesce(
                            ResearchRecord.examination_date,
                            func.strftime("%Y-%m-%d", "now"),
                        )
                    )
                    - func.julianday(ResearchRecord.birth_date)
                )
                / 365.25
                >= age_min,
            )
        if age_max is not None:
            query = query.filter(
                ResearchRecord.birth_date.isnot(None),
                (
                    func.julianday(
                        func.coalesce(
                            ResearchRecord.examination_date,
                            func.strftime("%Y-%m-%d", "now"),
                        )
                    )
                    - func.julianday(ResearchRecord.birth_date)
                )
                / 365.25
                <= age_max,
            )

    records = query.order_by(ResearchRecord.id.desc()).limit(5000).all()

    if not records:
        raise HTTPException(
            status_code=404, detail="Filterga mos ma'lumotlar topilmadi"
        )

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
        lang=export_lang,
        privacy_redacted=get_child_privacy_enabled(db, current_user),
    )
    encoded_filename = urllib.parse.quote(
        f"research_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
    )
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Cache-Control": "no-store, private",
        },
    )


@router.post("/")
def create_research_record(
    payload: ResearchRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    from services.analyze_service import generate_region_based_id

    record = ResearchRecord(**payload.model_dump(exclude_unset=True))
    record.created_by_id = current_user.id
    if record.consent_confirmed and not record.consent_confirmed_at:
        record.consent_confirmed_at = datetime.utcnow()

    clean_region = _research_record_id_region(record, current_user)
    clean_district = _research_record_id_district(record, current_user)
    record.id_code = generate_region_based_id(db, clean_region, clean_district)

    db.add(record)

    # Update user stats
    current_user.completed_entries_count = (
        current_user.completed_entries_count or 0
    ) + 1

    db.commit()
    db.refresh(record)

    # ClickHouse ga ma'lumot jo'natish
    try:
        from routers.research_router import research_record_to_dict
        from utils.clickhouse import insert_research_event

        insert_research_event(research_record_to_dict(record, current_user))
    except Exception:
        pass

    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="create",
        target_type="ResearchRecord",
        target_id=record.id,
        details=f"Yangi tadqiqot ma'lumoti yaratildi: {child_audit_reference(record)}"
    )

    return research_record_to_dict(
        record, current_user,
        privacy_enabled=get_child_privacy_enabled(db, current_user),
    )


# ═══════════════════════════════════════════════
#  DYNAMIC PATHS — AFTER STATIC PATHS
# ═══════════════════════════════════════════════


@router.get("/{record_id}")
def get_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "field_assistant" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")
    elif current_user.role == "researcher" and record.created_by_id != current_user.id:
        creator = db.get(User, record.created_by_id)
        if not (creator and creator.supervisor_id == current_user.id):
            raise HTTPException(status_code=403, detail="Ruxsat etilmagan")
    return research_record_to_dict(
        record, current_user,
        privacy_enabled=get_child_privacy_enabled(db, current_user),
    )


@router.put("/{record_id}")
def update_research_record(
    record_id: int,
    payload: ResearchRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Tahrirlashga ruxsatingiz yo'q")
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if (
            get_child_privacy_enabled(db, current_user)
            and field in CHILD_PII_EXPORT_FIELDS
        ):
            continue
        setattr(record, field, value)
    if record.consent_confirmed and not record.consent_confirmed_at:
        record.consent_confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="update",
        target_type="ResearchRecord",
        target_id=record.id,
        details=f"Tadqiqot ma'lumoti yangilandi: {child_audit_reference(record)}"
    )
    return research_record_to_dict(
        record, current_user,
        privacy_enabled=get_child_privacy_enabled(db, current_user),
    )


@router.post("/bulk/soft-delete")
def bulk_soft_delete_research_records(
    payload: ResearchBulkAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    """Tanlangan yozuvlarni bitta tranzaksiyada savatga yuboradi."""
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="O'chirishga ruxsatingiz yo'q")

    ids = list(dict.fromkeys(payload.ids))
    if not ids:
        return {"deleted": 0}

    query = db.query(ResearchRecord).filter(
        ResearchRecord.id.in_(ids),
        ResearchRecord.is_deleted == 0,
    )
    if current_user.role == "researcher":
        query = query.filter(ResearchRecord.created_by_id == current_user.id)

    try:
        deleted = query.update(
            {
                ResearchRecord.is_deleted: 1,
                ResearchRecord.deleted_by_id: current_user.id,
                ResearchRecord.deleted_at: datetime.utcnow(),
            },
            synchronize_session=False,
        )
        db.commit()
        if deleted:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="delete_bulk",
                target_type="ResearchRecord",
                details=f"{deleted} ta tadqiqot ma'lumoti savatga yuborildi",
                request=request,
            )
        return {"deleted": int(deleted or 0)}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {exc}")


@router.post("/bulk/hard-delete")
def bulk_hard_delete_research_records(
    payload: ResearchBulkAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tanlangan yozuvlarni bitta so'rovda butunlay o'chiradi."""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")

    ids = list(dict.fromkeys(payload.ids))
    if not ids:
        return {"deleted": 0}

    try:
        deleted = (
            db.query(ResearchRecord)
            .filter(ResearchRecord.id.in_(ids))
            .delete(synchronize_session=False)
        )
        db.commit()
        if deleted:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="hard_delete_bulk",
                target_type="ResearchRecord",
                details=f"{deleted} ta tadqiqot ma'lumoti butunlay o'chirildi",
                request=request,
            )
        return {"deleted": int(deleted or 0)}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {exc}")


@router.post("/bulk/restore")
def bulk_restore_research_records(
    payload: ResearchBulkAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tanlangan yozuvlarni bitta tranzaksiyada tiklaydi."""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")

    ids = list(dict.fromkeys(payload.ids))
    if not ids:
        return {"restored": 0}

    try:
        restored = (
            db.query(ResearchRecord)
            .filter(
                ResearchRecord.id.in_(ids),
                ResearchRecord.is_deleted == 1,
            )
            .update(
                {
                    ResearchRecord.is_deleted: 0,
                    ResearchRecord.deleted_by_id: None,
                    ResearchRecord.deleted_at: None,
                },
                synchronize_session=False,
            )
        )
        db.commit()
        if restored:
            record_audit_log(
                db=db,
                user_id=current_user.id,
                action="restore_bulk",
                target_type="ResearchRecord",
                details=f"{restored} ta tadqiqot ma'lumoti tiklandi",
                request=request,
            )
        return {"restored": int(restored or 0)}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {exc}")


@router.delete("/{record_id}")
def delete_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    """Soft delete"""
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="O'chirishga ruxsatingiz yo'q")
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    record.is_deleted = 1
    record.deleted_by_id = current_user.id
    record.deleted_at = datetime.utcnow()
    db.commit()
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="delete",
        target_type="ResearchRecord",
        target_id=record.id,
        details=f"Tadqiqot ma'lumoti savatga yuborildi: {child_audit_reference(record)}"
    )
    return {"status": "ok", "message": "Soft o'chirildi"}


@router.delete("/{record_id}/hard")
def hard_delete_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hard delete — faqat superadmin"""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat superadmin uchun")
    record = db.get(ResearchRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    record_name = record.full_name
    db.delete(record)
    db.commit()
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="hard_delete",
        target_type="ResearchRecord",
        target_id=record_id,
        details=f"Tadqiqot ma'lumoti butunlay o'chirildi: {record_name} (ID: {record_id})"
    )
    return {"status": "ok", "message": "Bazadan butunlay o'chirildi"}


@router.post("/{record_id}/restore")
def restore_research_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    record_audit_log(
        db=db,
        user_id=current_user.id,
        action="restore",
        target_type="ResearchRecord",
        target_id=record.id,
        details=f"Tadqiqot ma'lumoti savatdan tiklandi: {child_audit_reference(record)}"
    )
    return {"status": "ok", "message": "Tiklandi"}


@router.get("/{record_id}/docx")
def download_research_docx(
    record_id: int,
    lang: str = Query("ru"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    """DOCX hisobot yuklab olish"""
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Eksport qilishga ruxsatingiz yo'q")
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    data = {c.name: getattr(record, c.name) for c in record.__table__.columns}
    data = redact_research_child_payload(
        data, current_user,
        privacy_enabled=get_child_privacy_enabled(db, current_user),
    )
    buf = generate_researcher_docx(data, lang=lang)
    encoded_filename = urllib.parse.quote(f"Research_{record.id}_{lang}.docx")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Cache-Control": "no-store, private",
        },
    )


@router.get("/{record_id}/consent-docx")
def download_research_consent_docx(
    record_id: int,
    lang: str = Query("uz"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_researcher_or_superadmin),
):
    if current_user.role == "field_assistant":
        raise HTTPException(status_code=403, detail="Eksport qilishga ruxsatingiz yo'q")
    record = db.get(ResearchRecord, record_id)
    if not record or record.is_deleted == 1:
        raise HTTPException(status_code=404, detail="Ma'lumot topilmadi")
    if current_user.role == "researcher" and record.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ruxsat etilmagan")

    data = {
        "child_name": record.full_name or "",
        "guardian_name": getattr(record, "consent_guardian_name", None) or "",
        "guardian_relationship": getattr(record, "consent_guardian_relationship", None)
        or "",
        "guardian_phone": getattr(record, "consent_guardian_phone", None)
        or record.parents_phone
        or "",
        "confirmed_at": str(getattr(record, "consent_confirmed_at", None) or ""),
        "consent_policy_version": getattr(record, "consent_policy_version", None)
        or "helsinki-declaration-consent-v1",
    }
    buf = generate_consent_docx(data, lang=lang)
    encoded_filename = urllib.parse.quote(f"Research_consent_{record.id}_{lang}.docx")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Cache-Control": "no-store, private",
        },
    )
