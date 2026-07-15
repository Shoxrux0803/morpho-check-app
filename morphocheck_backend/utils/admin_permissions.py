import json
from copy import deepcopy
from typing import Any, Optional


PERMISSION_KEYS = (
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
    "bioimpedance",
    "play_preschool_engagement",
    "activity_advice",
    "sport_advice",
    "additional_instructions",
)

DEFAULT_ADMIN_PERMISSIONS = {key: True for key in PERMISSION_KEYS}

ANTHROPOMETRY_FIELDS = {
    "shoulder_length": ("shoulder_length", "shoulderLength"),
    "shoulder_breadth": ("shoulder_breadth", "shoulderBreadth"),
    "shoulder_circumference": ("shoulder_circumference", "shoulderCircumference"),
    "arm_elbow_length": ("arm_elbow_length", "armElbowLength"),
    "hand_length": ("hand_length", "handLength"),
    "thigh_length": ("thigh_length", "thighLength"),
    "thigh_circumference": ("thigh_circumference", "thighCircumference"),
    "calf_length": ("calf_length", "calfLength"),
    "calf_circumference": ("calf_circumference", "calfCircumference"),
    "foot_length": ("foot_length", "footLength"),
}

BIOIMPEDANCE_FIELDS = (
    ("total_body_water", "totalBodyWater"),
    ("fat_percent", "fatPercent"),
    ("fat_mass", "fatMass"),
    ("muscle_mass", "muscleMass"),
    ("bone_mass", "boneMass"),
    ("acm", "acm"),
    ("visceral_fat", "visceralFat"),
    ("body_length", "bodyLength"),
)

BIOIMPEDANCE_INDEX_KEYS = (
    "tbw_percent",
    "tbw_norm",
    "fm_percent",
    "fm_norm",
    "fm",
    "fm_kg_norm",
    "muscle_mass",
    "muscle_norm",
    "bone_mass",
    "bone_norm",
    "acm_percent",
    "acm_norm",
    "visceral_fat",
    "visceral_norm",
)


def normalize_admin_permissions(value: Any = None) -> dict[str, bool]:
    permissions = deepcopy(DEFAULT_ADMIN_PERMISSIONS)
    raw = value
    if isinstance(value, str):
        try:
            raw = json.loads(value)
        except (TypeError, ValueError):
            raw = {}
    if isinstance(raw, dict):
        for key in PERMISSION_KEYS:
            if key in raw:
                permissions[key] = bool(raw[key])
    return permissions


def serialize_admin_permissions(value: Any = None) -> str:
    return json.dumps(normalize_admin_permissions(value), ensure_ascii=False)


def get_effective_admin_permissions(user: Optional[Any]) -> dict[str, bool]:
    if not user:
        return deepcopy(DEFAULT_ADMIN_PERMISSIONS)
    owner = user
    if getattr(user, "role", None) == "field_assistant" and getattr(user, "supervisor", None):
        owner = user.supervisor
    return normalize_admin_permissions(getattr(owner, "admin_permissions", None))


def filter_payload_by_permissions(payload: dict[str, Any], permissions: dict[str, bool]) -> dict[str, Any]:
    data = deepcopy(payload)
    for permission_key, field_names in ANTHROPOMETRY_FIELDS.items():
        if not permissions.get(permission_key, True):
            for field_name in field_names:
                data.pop(field_name, None)
    if not permissions.get("bioimpedance", True):
        for field_names in BIOIMPEDANCE_FIELDS:
            for field_name in field_names:
                data.pop(field_name, None)
        analysis = data.get("analysis")
        if isinstance(analysis, dict) and isinstance(analysis.get("indices"), dict):
            for key in (*BIOIMPEDANCE_INDEX_KEYS, "z_body_length", "advice"):
                analysis["indices"].pop(key, None)
    advices = data.get("advices")
    if isinstance(advices, dict):
        if not permissions.get("activity_advice", True):
            advices.pop("activity", None)
        if not permissions.get("sport_advice", True):
            advices.pop("sport", None)
        if not permissions.get("play_preschool_engagement", True):
            advices.pop("play_preschool", None)

    if not permissions.get("additional_instructions", True):
        data["show_additional_instructions"] = False

    if not permissions.get("play_preschool_engagement", True):
        data.pop("play_preschool_engagement", None)
        data.pop("playPreschoolEngagement", None)
    analysis = data.get("analysis")
    if isinstance(analysis, dict) and isinstance(analysis.get("indices"), dict):
        has_any_anthropometry = any(
            permissions.get(key, True) for key in ANTHROPOMETRY_FIELDS.keys()
        )
        if not has_any_anthropometry:
            for key in (
                "hmai", "hmai_desc", "mii", "mii_desc", "adi", "adi_desc",
                "mcri", "mcri_desc", "morphological_type", "biological_age_status",
                "secular_trend", "morphological_type_key",
                "biological_age_status_key", "secular_trend_key", "advice",
            ):
                analysis["indices"].pop(key, None)
    if isinstance(analysis, dict):
        if not permissions.get("shoulder_breadth", True):
            analysis.pop("shoulder_ratio", None)
        if not permissions.get("thigh_circumference", True):
            analysis.pop("thigh_ratio", None)
    return data
