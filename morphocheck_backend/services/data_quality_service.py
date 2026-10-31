"""Dataset-level quality controls for anthropometric imports and exports.

These checks identify source values that need review.  They never replace or
"correct" healthcare measurements automatically.
"""

from __future__ import annotations

from math import sqrt
from statistics import fmean, pstdev
from typing import Any, Iterable, Optional

BMI_SCREENING_MIN = 10.0
BMI_SCREENING_MAX = 30.0
MIN_PROPORTIONALITY_SAMPLE = 30
THIGH_HEIGHT_CORRELATION_LIMIT = 0.97
THIGH_HEIGHT_RATIO_CV_LIMIT = 0.05


def _value(record: Any, key: str):
    if isinstance(record, dict):
        return record.get(key)
    return getattr(record, key, None)


def _positive_number(value) -> Optional[float]:
    try:
        normalized = value
        if isinstance(value, str):
            normalized = value.strip().replace(",", ".")
        number = float(normalized)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def calculate_source_bmi(height_cm, weight_kg) -> Optional[float]:
    """Calculate BMI directly from source height and weight."""
    height = _positive_number(height_cm)
    weight = _positive_number(weight_kg)
    if height is None or weight is None:
        return None
    return weight / ((height / 100.0) ** 2)


def bmi_screening_issue(height_cm, weight_kg) -> Optional[str]:
    """Return a data-review message when the configured BMI screen fails."""
    bmi = calculate_source_bmi(height_cm, weight_kg)
    if bmi is None:
        return None
    displayed_bmi = round(bmi, 1)
    if BMI_SCREENING_MIN <= displayed_bmi <= BMI_SCREENING_MAX:
        return None
    return (
        f"Bo'y va vazndan hisoblangan BMI {displayed_bmi:.1f}; "
        f"skrining oralig'i {BMI_SCREENING_MIN:g}-{BMI_SCREENING_MAX:g}. "
        "Manba o'lchovlarini tekshiring."
    )


def pearson_correlation(pairs: Iterable[tuple[float, float]]) -> Optional[float]:
    clean_pairs = []
    for x, y in pairs:
        x_number = _positive_number(x)
        y_number = _positive_number(y)
        if x_number is not None and y_number is not None:
            clean_pairs.append((x_number, y_number))
    if len(clean_pairs) < 2:
        return None

    xs, ys = zip(*clean_pairs)
    mean_x, mean_y = fmean(xs), fmean(ys)
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in clean_pairs)
    denominator = sqrt(
        sum((x - mean_x) ** 2 for x in xs)
        * sum((y - mean_y) ** 2 for y in ys)
    )
    if denominator == 0:
        return None
    return numerator / denominator


def summarize_anthropometry_quality(records: Iterable[Any]) -> dict:
    """Summarize BMI and thigh/height quality without mutating records."""
    rows = list(records)
    bmi_outliers = []
    thigh_height_pairs = []
    thigh_height_ratios = []

    for record in rows:
        height = _positive_number(_value(record, "height"))
        weight = _positive_number(_value(record, "weight"))
        thigh = _positive_number(_value(record, "thigh_circumference"))

        bmi = calculate_source_bmi(height, weight)
        displayed_bmi = round(bmi, 1) if bmi is not None else None
        if displayed_bmi is not None and not (
            BMI_SCREENING_MIN <= displayed_bmi <= BMI_SCREENING_MAX
        ):
            bmi_outliers.append(
                {
                    "id": _value(record, "id"),
                    "id_code": _value(record, "id_code"),
                    "bmi": displayed_bmi,
                    "height": height,
                    "weight": weight,
                }
            )

        if height is not None and thigh is not None:
            thigh_height_pairs.append((height, thigh))
            thigh_height_ratios.append(thigh / height)

    correlation = pearson_correlation(thigh_height_pairs)
    ratio_mean = fmean(thigh_height_ratios) if thigh_height_ratios else None
    ratio_sd = pstdev(thigh_height_ratios) if len(thigh_height_ratios) > 1 else None
    ratio_cv = (
        ratio_sd / ratio_mean
        if ratio_sd is not None and ratio_mean not in (None, 0)
        else None
    )
    proportionality_review = bool(
        len(thigh_height_pairs) >= MIN_PROPORTIONALITY_SAMPLE
        and correlation is not None
        and abs(correlation) >= THIGH_HEIGHT_CORRELATION_LIMIT
        and ratio_cv is not None
        and ratio_cv <= THIGH_HEIGHT_RATIO_CV_LIMIT
    )

    flags = []
    if bmi_outliers:
        flags.append("BMI_OUTSIDE_SCREENING_RANGE")
    if proportionality_review:
        flags.append("THIGH_HEIGHT_PROPORTIONALITY_REVIEW")

    return {
        "total_rows": len(rows),
        "bmi_outlier_count": len(bmi_outliers),
        "bmi_outliers": bmi_outliers,
        "thigh_height_pair_count": len(thigh_height_pairs),
        "thigh_height_correlation": (
            round(correlation, 6) if correlation is not None else None
        ),
        "thigh_height_ratio_mean": (
            round(ratio_mean, 6) if ratio_mean is not None else None
        ),
        "thigh_height_ratio_sd": (
            round(ratio_sd, 6) if ratio_sd is not None else None
        ),
        "thigh_height_ratio_cv": (
            round(ratio_cv, 6) if ratio_cv is not None else None
        ),
        "thigh_height_proportionality_review": proportionality_review,
        "flags": flags,
        "status": "review" if flags else "ok",
    }
