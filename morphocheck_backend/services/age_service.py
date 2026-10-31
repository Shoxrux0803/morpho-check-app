"""Keep total months distinct from the legacy year/month/day components."""

import math

DAYS_PER_MONTH = 30.4375


def split_age_months(value, maximum=1452):
    if isinstance(value, bool):
        raise ValueError("Yosh oyda raqam bo'lishi kerak.")
    try:
        months = float(str(value).strip().replace(",", "."))
    except (TypeError, ValueError) as exc:
        raise ValueError("Yosh oyda raqam bo'lishi kerak.") from exc
    if not math.isfinite(months) or not 0 <= months < maximum:
        raise ValueError(f"Yosh 0 dan {maximum} oygacha bo'lishi kerak.")
    whole = math.floor(months)
    return (
        months,
        whole // 12,
        whole % 12,
        math.floor((months - whole) * DAYS_PER_MONTH + 1e-9),
    )


def total_age_months(record):
    explicit = getattr(record, "age_total_months", None)
    if explicit is not None:
        return float(explicit)
    return (
        (record.age or 0) * 12
        + (getattr(record, "age_months", 0) or 0)
        + (getattr(record, "age_days", 0) or 0) / DAYS_PER_MONTH
    )
