"""Resolve tabular input by headers, never by the positions of unknown columns."""

import math

from fastapi import HTTPException


def ffm_import_errors(data):
    raw = data.get("ffm_measured_kg")
    if raw is None or raw == "":
        return []
    try:
        ffm = float(str(raw).replace(",", "."))
        weight = float(str(data.get("weight")).replace(",", "."))
    except (TypeError, ValueError):
        return []  # The shared numeric validator reports malformed numbers.
    if not math.isfinite(ffm) or not 0 < ffm <= weight:
        return [
            (
                "ffm_measured_kg",
                "FFM musbat va tana vaznidan katta bo‘lmasligi kerak.",
                raw,
            )
        ]
    return []


def apply_import_measured_ffm(record, data):
    if data.get("ffm_measured_kg") in (None, ""):
        return
    record.body_composition_raw = {
        **(record.body_composition_raw or {}),
        "ffm_measured_kg": float(str(data["ffm_measured_kg"]).replace(",", ".")),
        "source": "imported",
    }
    if data.get("fat_mass") not in (None, ""):
        record.body_composition_raw["fat_mass_measured_kg"] = float(
            str(data["fat_mass"]).replace(",", ".")
        )


def resolve_admin_import_sheet(workbook, parse_header, field_enabled, privacy_enabled):
    required = {"gender", "region", "height", "weight", "chest", "waist", "head"}
    candidates = []
    for sheet in workbook.worksheets:
        mapped = {}
        duplicates = set()
        for index, header in enumerate(
            next(sheet.iter_rows(min_row=1, max_row=1, values_only=True), ())
        ):
            field = parse_header(header)
            if field and field_enabled(field):
                if field in mapped.values():
                    duplicates.add(field)
                mapped[index] = field
        fields = set(mapped.values())
        missing = required - fields
        if not fields.intersection({"age", "age_total_months"}):
            missing.add("age_total_months")
        if not privacy_enabled and not fields.intersection(
            {"name", "first_name", "last_name"}
        ):
            missing.add("name")
        candidates.append((sheet, mapped, missing, duplicates))
    valid = [item for item in candidates if not item[2] and not item[3]]
    template = next((item for item in valid if item[0].title == "Маълумотлар"), None)
    if template:
        return template[:2]
    active = next((item for item in valid if item[0] == workbook.active), None)
    if active:
        return active[:2]
    if len(valid) == 1:
        return valid[0][:2]
    if len(valid) > 1:
        raise HTTPException(
            400,
            "Bir nechta import jadvali topildi. Kerakli varaqni Excelda faol qilib saqlang: "
            + ", ".join(item[0].title for item in valid),
        )
    best = max(candidates, key=lambda item: len(item[1]))
    labels = {
        "name": "F.I.Sh.",
        "gender": "Jins",
        "age_total_months": "Yosh (oy)",
        "region": "Hudud",
        "height": "Bo‘y",
        "weight": "Vazn",
        "chest": "Ko‘krak aylanasi",
        "waist": "Bel aylanasi",
        "head": "Bosh aylanasi",
    }
    detail = f'"{best[0].title}" varag‘i admin import shabloniga to‘liq mos emas.'
    if best[2]:
        detail += (
            " Yetishmagan ustunlar: "
            + ", ".join(labels.get(field, field) for field in sorted(best[2]))
            + "."
        )
    if best[3]:
        detail += " Takrorlangan ustunlar: " + ", ".join(sorted(best[3])) + "."
    detail += " Ustunlar joylashuvi bo‘yicha taxminiy import qilinmadi. Shablonni yuklab, mavjud o‘lchovlarni nomiga mos joylashtiring."
    raise HTTPException(400, detail)
