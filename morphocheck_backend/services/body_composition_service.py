"""Safety-first canonical Body Composition/BIA calculations.

This module intentionally contains no population norms.  A BIA value is only
interpreted when a frozen, versioned reference entry is supplied explicitly.
Raw device/admin values are always retained separately from derived values.
"""

from __future__ import annotations

import math
from copy import deepcopy
from typing import Any, Iterable, Mapping, Optional

REFERENCE_NONE = "NONE"
CONSISTENCY_TOLERANCE_KG = 0.2
ESTIMATED_BIA_MODEL_VERSION = "MORPHOCHECK_ANTHRO_ESTIMATE_V1"


def _number(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def _normalize_sex(value: Optional[str]) -> Optional[str]:
    """Normalize every gender spelling accepted by import and analysis flows."""
    normalized = (value or "").strip().lower()
    if any(
        marker in normalized
        for marker in ("erkak", "male", "boy", "o'g'il", "ogil", "ўғил", "мальчик")
    ):
        return "male"
    if any(
        marker in normalized
        for marker in ("ayol", "female", "girl", "qiz", "қиз", "девочка")
    ):
        return "female"
    return None


def _metric(value: Optional[float], source: Optional[str] = None) -> dict[str, Any]:
    return {
        "value": value,
        "source": source,
        "reference_source": REFERENCE_NONE,
        "reference_version": None,
        "interpretation": None,
        "z_score": None,
        "status": "not_provided" if value is None else "reference_not_available",
    }


def _flag(flags: list[str], value: str) -> None:
    if value not in flags:
        flags.append(value)


def _reference_for(
    references: Iterable[Mapping[str, Any]],
    parameter: str,
    sex: Optional[str],
    age_months: Optional[int],
    device_method: Optional[str],
) -> Optional[Mapping[str, Any]]:
    """Choose only an explicitly supplied, frozen reference matching the record."""
    for ref in references:
        if ref.get("parameter") != parameter or not ref.get("source") or not ref.get("version"):
            continue
        if ref.get("sex") not in (None, "", "all", sex):
            continue
        if age_months is not None:
            if ref.get("age_min_months") is not None and age_months < ref["age_min_months"]:
                continue
            if ref.get("age_max_months") is not None and age_months > ref["age_max_months"]:
                continue
        if ref.get("device_method") not in (None, "", device_method):
            continue
        return ref
    return None


def _apply_reference(
    metric: dict[str, Any],
    parameter: str,
    references: Iterable[Mapping[str, Any]],
    sex: Optional[str],
    age_months: Optional[int],
    device_method: Optional[str],
    flags: list[str],
) -> None:
    if metric["value"] is None or metric["status"] == "invalid":
        return
    ref = _reference_for(references, parameter, sex, age_months, device_method)
    if not ref:
        return
    metric["reference_source"] = ref["source"]
    metric["reference_version"] = ref["version"]
    mean, sd = _number(ref.get("mean")), _number(ref.get("sd"))
    if mean is not None or ref.get("percentiles") is not None:
        metric["status"] = "valid"
    if mean is not None:
        if sd is None or sd <= 0:
            metric["status"] = "warning"
            _flag(flags, f"reference_model_error:{parameter}")
        else:
            metric["z_score"] = (metric["value"] - mean) / sd


def _segment(raw: Any, default_unit: str = "kg") -> dict[str, Any]:
    raw = raw if isinstance(raw, Mapping) else {}
    result = {
        part: _number(raw.get(part))
        for part in ("right_arm", "left_arm", "trunk", "right_leg", "left_leg")
    }
    result["unit"] = raw.get("unit") or default_unit
    extras = raw.get("extras")
    if extras is not None:
        result["extras"] = deepcopy(extras)
    result["asymmetry"] = {}
    for name, right, left in (
        ("arms", result["right_arm"], result["left_arm"]),
        ("legs", result["right_leg"], result["left_leg"]),
    ):
        if right is not None and left is not None:
            difference = abs(right - left)
            mean = (right + left) / 2
            result["asymmetry"][name] = {
                "absolute_difference": difference,
                "relative_difference_percent": (difference / mean * 100) if mean > 0 else None,
                "interpretation": "asymmetry_measured",
            }
    return result


def raw_body_composition_from_patient(data: Any) -> dict[str, Any]:
    """Build canonical raw input while retaining legacy scalar compatibility.

    Legacy ``total_body_water`` and ``acm`` are masses (litres/kg) in this
    application, so they are deliberately not relabelled as percentages.
    """
    nested = getattr(data, "body_composition", None)
    if nested is not None:
        return nested.model_dump(by_alias=False, exclude_none=True)
    raw: dict[str, Any] = {"source": "legacy_admin_input"}
    mappings = {
        "pbf_percent": "fat_percent",
        "fat_mass_measured_kg": "fat_mass",
        "smm_kg": "muscle_mass",
        "visceral_fat_value": "visceral_fat",
        "mineral_bone_mass_kg": "bone_mass",
    }
    for target, legacy in mappings.items():
        value = getattr(data, legacy, None)
        if value is not None:
            raw[target] = value
    if "visceral_fat_value" in raw:
        raw["visceral_fat_unit"] = "device_level_unspecified"
    return raw


def estimate_phase_angle_from_anthropometry(
    *, age_months: Any, sex: Optional[str], bmi: Any
) -> Optional[float]:
    """Return a visibly approximate Phase Angle for screening/export only.

    Phase Angle is measured from resistance/reactance.  This fallback is a
    bounded age/sex/BMI heuristic and must never be presented as a device
    measurement or a WHO reference result.
    """
    age_value = _number(age_months)
    bmi_value = _number(bmi)
    if age_value is None or age_value < 0 or bmi_value is None or bmi_value <= 0:
        return None

    age_years = age_value / 12
    sex_norm = _normalize_sex(sex)
    if sex_norm is None:
        return None
    male = sex_norm == "male"

    if age_years < 18:
        target_bmi = 15.5 + min(age_years, 18) * 0.32
        estimate = 4.65 + min(age_years, 18) * 0.085 + (0.15 if male else 0.0)
    else:
        target_bmi = 22.0
        estimate = 6.15 + (0.30 if male else 0.0) - 0.018 * abs(age_years - 35)

    estimate -= min(0.45, abs(bmi_value - target_bmi) * 0.035)
    return round(max(4.0, min(8.0, estimate)), 1)


def estimate_segmental_composition(
    *, ffm_kg: Any, fat_mass_kg: Any, age_months: Any, sex: Optional[str]
) -> dict[str, Any]:
    """Estimate segmental lean/fat distribution from whole-body composition.

    The result is symmetrical because current anthropometry is not side-specific.
    It is an export fallback, not a replacement for segmental BIA or DXA.
    """
    ffm = _number(ffm_kg)
    fat = _number(fat_mass_kg)
    age_value = _number(age_months)
    if age_value is None or age_value < 0:
        return {
            "phase_model_version": ESTIMATED_BIA_MODEL_VERSION,
            "segmental_lean_mass": None,
            "segmental_fat_mass": None,
        }
    age_years = age_value / 12
    sex_norm = _normalize_sex(sex)
    if sex_norm is None:
        return {
            "phase_model_version": ESTIMATED_BIA_MODEL_VERSION,
            "segmental_lean_mass": None,
            "segmental_fat_mass": None,
        }
    male = sex_norm == "male"

    lean = None
    if ffm is not None and ffm > 0:
        lean = {
            "right_arm": round(ffm * 0.053, 1),
            "left_arm": round(ffm * 0.053, 1),
            "trunk": round(ffm * 0.425, 1),
            "right_leg": round(ffm * 0.174, 1),
            "left_leg": round(ffm * 0.174, 1),
            "unit": "kg",
            "estimated": True,
            "source": ESTIMATED_BIA_MODEL_VERSION,
        }

    fat_segments = None
    if fat is not None and fat >= 0:
        if age_years is not None and age_years < 18:
            arm_each, trunk, leg_each = 0.05, 0.45, 0.20
        elif male:
            arm_each, trunk, leg_each = 0.05, 0.55, 0.15
        else:
            arm_each, trunk, leg_each = 0.05, 0.40, 0.225
        fat_segments = {
            "right_arm": round(fat * arm_each, 1),
            "left_arm": round(fat * arm_each, 1),
            "trunk": round(fat * trunk, 1),
            "right_leg": round(fat * leg_each, 1),
            "left_leg": round(fat * leg_each, 1),
            "unit": "kg",
            "estimated": True,
            "source": ESTIMATED_BIA_MODEL_VERSION,
        }

    return {
        "phase_model_version": ESTIMATED_BIA_MODEL_VERSION,
        "segmental_lean_mass": lean,
        "segmental_fat_mass": fat_segments,
    }


def calculate_body_composition(
    *,
    weight_kg: Any,
    raw: Optional[Mapping[str, Any]] = None,
    sex: Optional[str] = None,
    age_months: Optional[int] = None,
    references: Optional[Iterable[Mapping[str, Any]]] = None,
) -> dict[str, Any]:
    """Return the canonical BIA result without mutating ``raw`` or inventing norms."""
    source = deepcopy(dict(raw or {}))
    refs = tuple(references or ())
    flags: list[str] = []
    weight = _number(weight_kg)
    default_source = source.get("source") or "admin_input"
    device_method = source.get("measurement_method")

    tbw = _metric(_number(source.get("tbw_percent")), default_source)
    pbf = _metric(_number(source.get("pbf_percent")), default_source)
    fat_measured = _number(source.get("fat_mass_measured_kg", source.get("fat_mass_kg")))
    ffm_measured = _number(source.get("ffm_measured_kg", source.get("ffm_kg")))
    smm = _metric(_number(source.get("smm_kg")), default_source)

    for name, metric in (("tbw_percent", tbw), ("pbf_percent", pbf)):
        if metric["value"] is not None and not 0 < metric["value"] < 100:
            metric["status"] = "invalid"
            _flag(flags, f"bia_qc_error:{name}_out_of_range")

    fat_status = "not_provided" if fat_measured is None else "reference_not_available"
    if fat_measured is not None and (fat_measured <= 0 or weight is None or weight <= 0 or fat_measured >= weight):
        fat_status = "invalid"
        _flag(flags, "bia_qc_error:fat_mass_out_of_range")

    fat_calculated = None
    if fat_measured is None and weight is not None and weight > 0 and pbf["value"] is not None and pbf["status"] != "invalid":
        fat_calculated = weight * pbf["value"] / 100
    fat_used = fat_measured if fat_status != "invalid" and fat_measured is not None else fat_calculated
    fat_source = default_source if fat_measured is not None else ("calculated_from_pbf" if fat_calculated is not None else None)

    pbf_calculated = None
    if pbf["value"] is None and weight is not None and weight > 0 and fat_used is not None:
        pbf_calculated = fat_used / weight * 100
        pbf = _metric(pbf_calculated, "calculated_from_fat_mass")

    if fat_measured is not None and pbf["value"] is not None and weight is not None and weight > 0 and pbf["status"] != "invalid":
        expected = weight * pbf["value"] / 100
        if abs(fat_measured - expected) > max(CONSISTENCY_TOLERANCE_KG, weight * 0.01):
            _flag(flags, "fat_mass_consistency_warning")

    ffm_calculated = None
    if weight is not None and weight > 0 and fat_used is not None and 0 <= fat_used < weight:
        ffm_calculated = weight - fat_used
    ffm_status = "not_provided"
    if ffm_measured is not None:
        ffm_status = (
            "reference_not_available"
            if weight is not None and weight > 0 and 0 < ffm_measured < weight
            else "invalid"
        )
        if ffm_status == "invalid":
            _flag(flags, "bia_qc_error:ffm_not_positive")
    elif ffm_calculated is not None:
        ffm_status = "reference_not_available"
    ffm_used = ffm_measured if ffm_status != "invalid" and ffm_measured is not None else ffm_calculated
    if ffm_measured is not None and ffm_calculated is not None and abs(ffm_measured - ffm_calculated) > max(CONSISTENCY_TOLERANCE_KG, weight * 0.01):
        _flag(flags, "ffm_consistency_warning")

    if smm["value"] is not None and (smm["value"] <= 0 or ffm_used is None or smm["value"] > ffm_used):
        smm["status"] = "invalid"
        _flag(flags, "invalid_smm_ffm_relation")

    visceral = _metric(_number(source.get("visceral_fat_value")), default_source)
    visceral["unit"] = source.get("visceral_fat_unit")
    visceral["method"] = source.get("visceral_fat_method")
    if visceral["value"] is not None and visceral["value"] < 0:
        visceral["status"] = "invalid"
        _flag(flags, "bia_qc_error:visceral_fat_negative")
    phase = _metric(_number(source.get("phase_angle_deg")), default_source)
    if phase["value"] is not None and not 0 < phase["value"] < 90:
        phase["status"] = "invalid"
        _flag(flags, "bia_qc_error:phase_angle_out_of_range")
    bmr = _metric(_number(source.get("bmr_kcal_day")), source.get("bmr_source") or default_source)
    bmr["equation"] = source.get("bmr_equation")

    sex_norm = _normalize_sex(sex)
    if (
        bmr["value"] is None
        and weight is not None
        and weight > 0
        and age_months is not None
        and age_months >= 0
        and sex_norm is not None
    ):
        age_years = age_months / 12
        bmr_val = None
        if sex_norm == "male":
            if age_years < 3:
                bmr_val = 59.512 * weight - 30.4
            elif age_years < 10:
                bmr_val = 22.706 * weight + 504.3
            elif age_years < 18:
                bmr_val = 17.686 * weight + 658.2
            elif age_years < 30:
                bmr_val = 15.057 * weight + 692.2
            elif age_years < 60:
                bmr_val = 11.472 * weight + 873.1
            else:
                bmr_val = 11.711 * weight + 587.7
        elif sex_norm == "female":
            if age_years < 3:
                bmr_val = 58.317 * weight - 31.1
            elif age_years < 10:
                bmr_val = 20.315 * weight + 485.9
            elif age_years < 18:
                bmr_val = 13.384 * weight + 692.6
            elif age_years < 30:
                bmr_val = 14.818 * weight + 486.6
            elif age_years < 60:
                bmr_val = 8.126 * weight + 845.6
            else:
                bmr_val = 9.082 * weight + 658.5

        if bmr_val is not None and bmr_val > 0:
            bmr = _metric(round(bmr_val), "calculated")
            bmr["equation"] = "schofield_weight"

    if bmr["value"] is not None and bmr["value"] <= 0:
        bmr["status"] = "invalid"
        _flag(flags, "bia_qc_error:bmr_not_positive")
    bone = _metric(_number(source.get("mineral_bone_mass_kg")), default_source)
    if bone["value"] is not None and (bone["value"] <= 0 or (weight is not None and bone["value"] >= weight)):
        bone["status"] = "invalid"
        _flag(flags, "bia_qc_error:mineral_bone_mass_out_of_range")
    acm = _metric(_number(source.get("acm_percent")), default_source)
    acm["definition_version"] = source.get("acm_definition_version")
    if acm["value"] is not None and not acm["definition_version"]:
        acm["status"] = "warning"
        _flag(flags, "ACM_DEFINITION_REQUIRED")
    if acm["value"] is not None and not 0 <= acm["value"] <= 100:
        acm["status"] = "invalid"
        _flag(flags, "bia_qc_error:acm_percent_out_of_range")

    metrics = {
        "tbw_percent": tbw,
        "pbf_percent": pbf,
        "smm_kg": smm,
        "visceral_fat": visceral,
        "phase_angle_deg": phase,
        "bmr_kcal_day": bmr,
        "mineral_bone_mass_kg": bone,
        "acm_percent": acm,
    }
    for parameter, metric in metrics.items():
        _apply_reference(metric, parameter, refs, sex, age_months, device_method, flags)

    segmental_lean = _segment(source.get("segmental_lean_mass"))
    segmental_fat = _segment(source.get("segmental_fat_mass"))
    for parameter, segment in (("segmental_lean_mass", segmental_lean), ("segmental_fat_mass", segmental_fat)):
        if any(segment.get(part) is not None and segment[part] < 0 for part in ("right_arm", "left_arm", "trunk", "right_leg", "left_leg")):
            _flag(flags, f"bia_qc_error:{parameter}_negative")

    return {
        "raw_measurement": source,
        "tbw_percent": tbw,
        "pbf_percent": pbf,
        "fat_mass_kg": {
            "measured": fat_measured,
            "calculated": fat_calculated,
            "used_value": fat_used,
            "source": fat_source,
            "status": fat_status if fat_measured is not None else ("reference_not_available" if fat_calculated is not None else "not_provided"),
        },
        "ffm_kg": {
            "measured": ffm_measured,
            "calculated": ffm_calculated,
            "used_value": ffm_used,
            "source": default_source if ffm_measured is not None else ("calculated_from_weight_and_fat_mass" if ffm_calculated is not None else None),
            "status": ffm_status,
        },
        "smm_kg": smm,
        "visceral_fat": visceral,
        "phase_angle_deg": phase,
        "segmental_lean_mass": segmental_lean,
        "segmental_fat_mass": segmental_fat,
        "bmr_kcal_day": bmr,
        "mineral_bone_mass_kg": bone,
        "acm_percent": acm,
        "metadata": {
            key: source.get(key)
            for key in ("measurement_date", "device_manufacturer", "device_model", "device_serial_or_id", "measurement_method", "operator")
        },
        "qc_status": "error" if any(flag.startswith("bia_qc_error") or flag == "invalid_smm_ffm_relation" for flag in flags) else ("warning" if flags else "ok"),
        "flags": flags,
        "reference_model_version": source.get("reference_version"),
    }
