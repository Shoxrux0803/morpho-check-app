from types import SimpleNamespace

from openpyxl import Workbook

from routers.admin_router import (
    ADMIN_XLSX_REPORT_COLUMN_KEYS,
    add_admin_data_quality_sheet,
    build_admin_xlsx_body_composition_values,
    calculate_admin_age_group,
    format_admin_age_group,
    get_admin_age_group_export_header,
)
from services.indices_service import calculate_age_independent_indices


def test_admin_xlsx_ffm_falls_back_to_calculated_analysis_index():
    values = build_admin_xlsx_body_composition_values(
        canonical_bia={},
        indices={
            "fm_percent": 18.2,
            "fm": 6.4,
            "ffm": 28.8,
            "muscle_mass": 23.0,
            "bone_mass": 4.3,
            "visceral_fat": 2.1,
        },
    )

    assert values["ffm"] == 28.8


def test_admin_xlsx_prefers_measured_ffm_over_calculated_fallback():
    values = build_admin_xlsx_body_composition_values(
        canonical_bia={"ffm_kg": {"used_value": 30.5}},
        indices={"ffm": 28.8},
    )

    assert values["ffm"] == 30.5


def test_admin_xlsx_calculates_ffm_from_imported_anthropometry():
    height = 140.5
    weight = 35.2
    indices = calculate_age_independent_indices(
        gender="erkak",
        height=height,
        weight=weight,
        bmi=weight / ((height / 100) ** 2),
        manual_data={},
    )

    values = build_admin_xlsx_body_composition_values({}, indices)

    assert values["ffm"] != "-"
    assert values["ffm"] > 0


def test_admin_xlsx_tbw_percent_uses_shared_anthropometry_formula():
    indices = calculate_age_independent_indices(
        gender="erkak",
        height=150.0,
        weight=45.0,
        bmi=20.0,
        manual_data={"region": "Toshkent", "district": "Chirchiq"},
    )
    values = build_admin_xlsx_body_composition_values({}, indices)

    expected_tbw_litres = -21.993 + 0.406 * 45.0 + 0.209 * 150.0
    assert values["tbw_percent"] == round(expected_tbw_litres / 45.0 * 100, 1)
    mcri_index = ADMIN_XLSX_REPORT_COLUMN_KEYS.index("mcri")
    assert ADMIN_XLSX_REPORT_COLUMN_KEYS[mcri_index + 1] == "tbw_percent"


def test_admin_xlsx_tbw_prefers_valid_bia_measurement():
    values = build_admin_xlsx_body_composition_values(
        {"tbw_percent": {"value": 58.7, "status": "reference_not_available"}},
        {"tbw_percent": 61.4},
    )

    assert values["tbw_percent"] == 58.7


def test_admin_xlsx_tbw_rejects_invalid_bia_measurement():
    values = build_admin_xlsx_body_composition_values(
        {"tbw_percent": {"value": 120, "status": "invalid"}},
        {"tbw_percent": 61.4},
    )

    assert values["tbw_percent"] == 61.4
    assert build_admin_xlsx_body_composition_values({}, {})["tbw_percent"] == "-"


def test_admin_xlsx_places_age_group_between_age_and_region():
    age_index = ADMIN_XLSX_REPORT_COLUMN_KEYS.index("age")

    assert ADMIN_XLSX_REPORT_COLUMN_KEYS[age_index + 1] == "age_group"
    assert ADMIN_XLSX_REPORT_COLUMN_KEYS[age_index + 2] == "region"


def test_admin_xlsx_age_group_matches_research_half_year_grouping():
    assert calculate_admin_age_group(3, 4, 0) == 3.5
    assert calculate_admin_age_group(3, 9, 0) == 4.0
    assert format_admin_age_group(3, 4, 0) == "3,5"
    assert format_admin_age_group(3, 9, 0) == "4"


def test_admin_xlsx_age_group_uses_research_report_bounds():
    assert calculate_admin_age_group(0, 0, 0) == 1.0
    assert calculate_admin_age_group(19, 0, 0) == 7.0
    assert calculate_admin_age_group(None, 0, 0) is None


def test_admin_xlsx_age_group_header_is_localized():
    assert get_admin_age_group_export_header("uz") == "Ёш гуруҳи"
    assert get_admin_age_group_export_header("en") == "Age group"


def test_admin_xlsx_adds_non_destructive_data_quality_audit_sheet():
    workbook = Workbook()
    rows = [
        SimpleNamespace(
            id=120,
            id_code="MC-0120",
            height=117.26,
            weight=13.6,
            thigh_circumference=39.07,
        )
    ]

    summary = add_admin_data_quality_sheet(workbook, rows)

    assert "Data Quality" in workbook.sheetnames
    assert summary["bmi_outlier_count"] == 1
    assert workbook["Data Quality"][8][1].value == "MC-0120"
