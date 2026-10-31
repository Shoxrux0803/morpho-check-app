"""Executable v6 research model, using the supplied definition without eval."""

import json
import math
from pathlib import Path

MODEL = json.loads(
    (Path(__file__).resolve().parents[1] / "data/index_model_v6.json").read_text(
        encoding="utf-8-sig"
    )
)
MODEL_VERSION = MODEL["model_id"]
_LMS = {(r["indicator"], r["sex"], r["month"]): r for r in MODEL["who_lms_source_rows"]}
_INTERNAL = {(r["variable"], r["sex"]): r for r in MODEL["internal_reference"]["rows"]}


def number(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return result if math.isfinite(result) else None


def normalize_sex(value):
    value = str(value or "").strip().lower()
    mapped = {str(key).lower(): sex for key, sex in MODEL["sex_map"].items()}.get(
        value, value
    )
    return {
        "erkak": "male",
        "ayol": "female",
        "o'g'il": "male",
        "ogil": "male",
        "qiz": "female",
        "m": "male",
        "f": "female",
    }.get(str(mapped).strip().lower(), str(mapped).strip().lower())


def who_z(indicator, value, sex, age_months):
    """Interpolate LMS first; restrict only WAZ/BAZ beyond +/-3 SD."""
    value, age = number(value), number(age_months)
    if value is None or value <= 0 or age is None or not 30 <= age <= 90:
        return None
    lo, hi = math.floor(age), math.ceil(age)
    a, b = (
        _LMS.get((indicator, normalize_sex(sex), lo)),
        _LMS.get((indicator, normalize_sex(sex), hi)),
    )
    if a is None or b is None:
        return None
    power, m, s = (a[k] + (age - lo) * (b[k] - a[k]) for k in ("L", "M", "S"))
    z = (
        math.log(value / m) / s
        if power == 0
        else math.expm1(power * math.log(value / m)) / (power * s)
    )
    if indicator in {"WFA", "BFA"} and abs(z) > 3:

        def measurement(sd):
            return (
                m * math.exp(s * sd)
                if power == 0
                else m * (1 + power * s * sd) ** (1 / power)
            )

        if z > 3:
            z = 3 + (value - measurement(3)) / (measurement(3) - measurement(2))
        else:
            z = -3 + (value - measurement(-3)) / (measurement(-2) - measurement(-3))
    return z


def internal_z(variable, value, sex, age):
    row = _INTERNAL[(variable, sex)]
    t = (age - MODEL["constants"]["age_center_months"]) / MODEL["constants"][
        "months_per_year"
    ]
    return (value - (row["b0"] + row["b1"] * t + row["b2"] * t * t)) / row[
        "residual_sd"
    ]


def calculate_v6(
    *,
    age_months,
    sex,
    height_cm,
    weight_kg,
    ffm_kg=None,
    thigh_circ_cm=None,
    calf_circ_cm=None,
    upper_arm_circ_cm=None,
    fm_kg=None,
    haz=None,
    waz=None,
    baz=None,
):
    age, height, weight = map(number, (age_months, height_cm, weight_kg))
    sex = normalize_sex(sex)
    flags = []
    result = dict.fromkeys(
        (
            "hmai",
            "mii",
            "adi",
            "mcri",
            "am",
            "gm",
            "haz",
            "waz",
            "baz",
            "z_fmi",
            "z_ffmi",
            "z_ln_th",
            "z_ln_ca",
            "z_ln_ar",
            "fmi",
            "ffmi",
        )
    )
    result.update(
        reference_model_version=MODEL_VERSION,
        model_version="6.0",
        clinical_status=MODEL["clinical_status"],
        component_flags=flags,
        who_source_status=MODEL["who_method"]["lms_source_status"],
    )
    applicable = age is not None and 30 <= age <= 90 and sex in {"male", "female"}
    if not applicable:
        flags.append("not_applicable:reference_age_or_sex")
    if height is None or height <= 0 or weight is None or weight <= 0:
        flags.append("invalid:height_or_weight")
        applicable = False
    if applicable:
        if height < 95:
            flags.append("warning:bia_height_under_95cm")
        h2 = (height / 100) ** 2
        haz, waz, baz = (
            number(override) if override is not None else who_z(ind, val, sex, age)
            for override, ind, val in (
                (haz, "HFA", height),
                (waz, "WFA", weight),
                (baz, "BFA", weight / h2),
            )
        )
        result.update(haz=haz, waz=waz, baz=baz)
        if None not in (haz, waz, baz):
            am = 100 * (
                1 - min(1, (abs(haz) + abs(baz)) / (2 * MODEL["constants"]["K"]))
            )
            gm = 100 * (1 - min(1, abs(haz - waz) / MODEL["constants"]["K"]))
            result.update(am=am, gm=gm, hmai=(am + gm) / 2)
        else:
            flags.append("invalid:who_z_override")
        if baz is not None and abs(baz) > 5:
            flags.append("warning:abs_baz_over_5")
        ffm = number(ffm_kg)
        if ffm is None:
            flags.append("missing:ffm_kg")
        elif not 0 < ffm <= weight:
            flags.append("invalid:ffm_kg")
        else:
            fmi, ffmi = (weight - ffm) / h2, ffm / h2
            zf, zl = (
                internal_z("FMI", fmi, sex, age),
                internal_z("FFMI", ffmi, sex, age),
            )
            result.update(fmi=fmi, ffmi=ffmi, z_fmi=zf, z_ffmi=zl)
            if (
                fm_kg is not None
                and number(fm_kg) is not None
                and abs(number(fm_kg) - (weight - ffm)) > 0.1 + 1e-12
            ):
                flags.append("warning:independent_fm_disagreement")
            result["mii"] = 100 * (1 - (d(zf) + d(zl) + d(zf - zl)) / 3)
        segments = []
        for key, variable, raw in (
            ("z_ln_th", "lnTh", thigh_circ_cm),
            ("z_ln_ca", "lnCa", calf_circ_cm),
            ("z_ln_ar", "lnAr", upper_arm_circ_cm),
        ):
            value = number(raw)
            if value is None or value <= 0:
                flags.append(f"missing_or_invalid:{variable}")
            else:
                z = internal_z(variable, math.log(value / height), sex, age)
                result[key] = z
                segments.append(z)
        if len(segments) == 3:
            result["adi"] = 100 * sum(d(z) for z in segments) / 3
        if None not in (baz, result["mii"], result["adi"]):
            weights = MODEL["constants"]["MCRI_weights"]
            result["mcri"] = (
                weights["BAZ_positive"] * risk(baz)
                + weights["FMI_positive"] * risk(result["z_fmi"])
                + weights["FFMI_deficit"] * risk(-result["z_ffmi"])
                + weights["ADI"] * result["adi"]
                + weights["inverse_MII"] * (100 - result["mii"])
            )
    result["qc_status"] = (
        "error"
        if any(f.startswith("invalid:") for f in flags)
        else "warning"
        if flags
        else "ok"
    )
    result["range_check_passed"] = all(
        v is None or 0 <= v <= 100
        for v in (result[k] for k in ("hmai", "mii", "adi", "mcri"))
    )
    for key in ("hmai", "mii", "adi", "mcri"):
        value = result[key]
        result[key + "_score"] = value
        result[key + "_category"] = category_for_score(key, value)
    result["raw_category"] = result["final_category"] = {
        k: result[k + "_category"] for k in ("hmai", "mii", "adi", "mcri")
    }
    return result


def d(z):
    return min(1, abs(z) / MODEL["constants"]["K"])


def risk(z):
    return 100 * min(1, max(0, z) / MODEL["constants"]["K"])


def category_for_score(key, value):
    if value is None:
        return "not_calculated"
    codes = {
        "hmai": ("high", "satisfactory", "borderline", "low"),
        "mii": ("high", "satisfactory", "borderline", "low"),
        "adi": ("severe", "disharmonic", "harmonic"),
        "mcri": ("very_high_risk", "high_risk", "moderate_risk", "low_risk"),
    }
    definition = next(index for index in MODEL["indexes"] if index["id"].lower() == key)
    return next(
        code
        for band, code in zip(definition["categories"], codes[key])
        if value >= band["min"]
    )
