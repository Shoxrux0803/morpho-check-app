import re
from types import SimpleNamespace

from routers.admin_router import (
    ADMIN_XLSX_REPORT_COLUMN_KEYS,
    IMPORT_TEMPLATE_COLUMNS,
    apply_admin_import_location_fields,
    build_admin_import_template_workbook,
    import_field_enabled,
    parse_import_header_field,
)


def test_admin_import_template_is_cyrillic_without_english_words():
    wb = build_admin_import_template_workbook({})
    assert wb.sheetnames == ["Маълумотлар", "Намуна", "Қўлланма"]

    latin_letters = re.compile(r"[A-Za-z]")
    visible_text = []
    for sheet in wb.worksheets:
        assert not latin_letters.search(sheet.title)
        visible_text.append(sheet.title)
        for row in sheet.iter_rows():
            for cell in row:
                if isinstance(cell.value, str):
                    visible_text.append(cell.value)
                    assert not latin_letters.search(cell.value)
    assert "Ота-она телефони" not in "\n".join(visible_text)


def test_admin_import_template_headers_map_back_to_import_fields():
    wb = build_admin_import_template_workbook({})
    headers = [cell.value for cell in wb["Маълумотлар"][1]]
    fields = [field for field, _header, _sample in IMPORT_TEMPLATE_COLUMNS]

    assert all(header != field for header, field in zip(headers, fields))
    assert all("_" not in header for header in headers)
    assert "parents_phone" not in fields
    assert [parse_import_header_field(header) for header in headers] == fields
    assert parse_import_header_field("first_name (Ism) *") == "first_name"


def test_admin_import_template_matches_report_source_column_order():
    fields = ["age" if field == "age_total_months" else field for field, _header, _sample in IMPORT_TEMPLATE_COLUMNS]
    report_source_fields = [
        field
        for field in ADMIN_XLSX_REPORT_COLUMN_KEYS
        if field in fields
    ]
    template_report_fields = [
        field
        for field in fields
        if field not in {"age_months", "age_days"}
    ]

    assert template_report_fields == report_source_fields
    raw_fields = [field for field, _header, _sample in IMPORT_TEMPLATE_COLUMNS]
    assert "age_total_months" in raw_fields
    assert {"age", "age_months", "age_days"}.isdisjoint(raw_fields)


def test_admin_import_template_omits_automatically_derived_report_values():
    fields = {field for field, _header, _sample in IMPORT_TEMPLATE_COLUMNS}
    automatically_derived = {
        "created_at",
        "age_group",
        "shoulder_ratio",
        "thigh_ratio",
        "bmi",
        "bmi_category",
        "somatotype",
        "ideal_weight",
        "weight_diff",
        "weight_range",
        "fat_percent",
        "fat_mass",
        "ffm",
        "muscle_mass",
        "phase_angle",
        "segmental_lean_mass",
        "segmental_fat_mass",
        "bmr",
        "bone_mass",
        "visceral_fat",
        "hmai",
        "mii",
        "adi",
        "mcri",
    }

    assert fields.isdisjoint(automatically_derived)
    assert fields.isdisjoint({"total_body_water", "acm"})


def test_admin_import_template_has_excel_level_bmi_and_measurement_validation():
    wb = build_admin_import_template_workbook({})
    ws = wb[wb.sheetnames[0]]
    validations = list(ws.data_validations.dataValidation)

    assert len(validations) >= 4
    custom_formulas = [
        validation.formula1
        for validation in validations
        if validation.type == "custom"
    ]
    assert any(
        formula and ">=10" in formula and "<=30" in formula
        for formula in custom_formulas
    )


def test_admin_import_keeps_previous_template_headers_compatible():
    assert parse_import_header_field("Танадаги умумий сув") == "total_body_water"
    assert parse_import_header_field("Ёғ массаси") == "fat_mass"
    assert parse_import_header_field("Фаол ҳужайра массаси") == "acm"


def test_admin_import_persists_address_when_child_privacy_is_enabled():
    rec = SimpleNamespace(address=None, mahalla="old value")

    assert parse_import_header_field("Манзил") == "address"
    assert import_field_enabled("address", {}, privacy_enabled=True) is True

    apply_admin_import_location_fields(
        rec,
        {"address": "  Тошкент, Амир Темур кўчаси  ", "mahalla": "Янги"},
        privacy_enabled=True,
    )

    assert rec.address == "Тошкент, Амир Темур кўчаси"
    assert rec.mahalla == "old value"


def test_admin_import_recognizes_address_header_aliases():
    for header in ("Манзил", "Манзили", "Манзил *", "Адрес", "Address"):
        assert parse_import_header_field(header) == "address"


def test_admin_import_does_not_clear_address_when_column_is_absent():
    rec = SimpleNamespace(address="Existing address", mahalla="Existing mahalla")

    apply_admin_import_location_fields(rec, {}, privacy_enabled=True)

    assert rec.address == "Existing address"
    assert rec.mahalla == "Existing mahalla"
