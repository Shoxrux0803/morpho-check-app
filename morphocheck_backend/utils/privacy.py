from copy import deepcopy
from typing import Any, Mapping, Optional


PRIVACY_MANAGED_ROLES = ("superadmin", "admin", "field_assistant", "researcher")
ROLE_PRIVACY_ALIASES = {
    "assistant": "field_assistant",
    "field-assistant": "field_assistant",
    "field assistant": "field_assistant",
    "super_admin": "superadmin",
    "super-admin": "superadmin",
    "super admin": "superadmin",
}
ROLE_PRIVACY_DEFAULTS = {
    "superadmin": True,
    "admin": True,
    "field_assistant": True,
    "researcher": False,
}

CHILD_IDENTITY_FIELDS = {
    "name",
    "full_name",
    "first_name",
    "last_name",
    "child_name",
}

CHILD_PRIVATE_FIELDS = {
    "birth_date",
    "birth_place",
    "address",
    "mahalla",
    "preschool_institution",
    "school_name",
    "settlement",
    "parents_phone",
    "consent_guardian_name",
    "consent_guardian_phone",
    "guardian_name",
    "guardian_phone",
}

CHILD_PII_EXPORT_FIELDS = CHILD_IDENTITY_FIELDS | CHILD_PRIVATE_FIELDS


def normalize_privacy_role(role_name: Any) -> Optional[str]:
    if role_name is None:
        return None
    normalized = str(role_name).strip().lower()
    return ROLE_PRIVACY_ALIASES.get(normalized, normalized)


def _role_name(viewer: Any) -> Optional[str]:
    if isinstance(viewer, str):
        return normalize_privacy_role(viewer)
    role_name = getattr(viewer, "role", None) if viewer is not None else None
    return normalize_privacy_role(role_name)


def default_child_privacy_enabled(viewer: Any) -> bool:
    return ROLE_PRIVACY_DEFAULTS.get(_role_name(viewer), True)


def get_child_privacy_enabled(db: Any, viewer: Any) -> bool:
    role_name = _role_name(viewer)
    if role_name not in PRIVACY_MANAGED_ROLES:
        return True
    try:
        from models.settings import RoleSettings

        setting = db.query(RoleSettings).filter(RoleSettings.role_name == role_name).first()
        if setting is not None:
            return bool(setting.child_data_privacy_enabled)
    except Exception:
        pass
    return default_child_privacy_enabled(role_name)


def should_redact_child_pii(viewer: Any, privacy_enabled: Optional[bool] = None) -> bool:
    if privacy_enabled is not None:
        return privacy_enabled
    return default_child_privacy_enabled(viewer)


def child_reference(data: Mapping[str, Any] | Any) -> str:
    def value(field: str) -> Any:
        if isinstance(data, Mapping):
            return data.get(field)
        return getattr(data, field, None)

    id_code = str(value("id_code") or "").strip()
    if id_code:
        return id_code

    record_id = value("id") or value("analysis_id")
    if record_id is not None:
        return f"MC-{record_id}"
    return "MC-MAXFIY"


def redact_child_payload(
    payload: Mapping[str, Any], viewer: Any = None, *, force: bool = False,
    privacy_enabled: Optional[bool] = None,
) -> dict[str, Any]:
    result = deepcopy(dict(payload))
    if not force and not should_redact_child_pii(viewer, privacy_enabled):
        result["privacy_redacted"] = False
        return result

    for field in CHILD_PII_EXPORT_FIELDS:
        result.pop(field, None)

    for nested_field in ("patient_info", "patient_data"):
        nested = result.get(nested_field)
        if isinstance(nested, Mapping):
            result[nested_field] = redact_child_payload(nested, force=True)

    result["privacy_redacted"] = True
    return result


def redact_research_child_payload(
    payload: Mapping[str, Any], viewer: Any = None,
    privacy_enabled: Optional[bool] = None,
) -> dict[str, Any]:
    return redact_child_payload(payload, viewer, privacy_enabled=privacy_enabled)


def child_audit_reference(data: Mapping[str, Any] | Any) -> str:
    return child_reference(data)
