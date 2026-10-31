import math

import pytest
from docx import Document

from models.schemas import BodyCompositionInput
from services.body_composition_service import (
    calculate_body_composition,
    estimate_phase_angle_from_anthropometry,
    estimate_segmental_composition,
)
from services.docx_services import generate_docx_file
from utils.admin_permissions import filter_payload_by_permissions


def bia(weight=30, **raw):
    return calculate_body_composition(weight_kg=weight, raw=raw, sex="erkak", age_months=120)


def test_valid_record_keeps_raw_and_derived_separate():
    result = bia(tbw_percent=60, pbf_percent=20, fat_mass_measured_kg=6, ffm_measured_kg=24, smm_kg=10)
    assert result["qc_status"] == "ok"
    assert result["raw_measurement"]["fat_mass_measured_kg"] == 6
    assert result["ffm_kg"]["calculated"] == 24


def test_fat_mass_greater_than_weight_is_error_and_ffm_is_not_derived():
    result = bia(weight=20, fat_mass_measured_kg=21)
    assert result["qc_status"] == "error"
    assert result["ffm_kg"]["calculated"] is None


def test_non_positive_measured_ffm_is_error():
    result = bia(ffm_measured_kg=0)
    assert "bia_qc_error:ffm_not_positive" in result["flags"]


def test_zero_fat_values_are_not_accepted_as_physiological_measurements():
    result = bia(pbf_percent=0, fat_mass_measured_kg=0)

    assert result["qc_status"] == "error"
    assert result["pbf_percent"]["status"] == "invalid"
    assert result["fat_mass_kg"]["status"] == "invalid"
    assert result["ffm_kg"]["used_value"] is None


def test_measured_ffm_cannot_equal_or_exceed_total_weight():
    result = bia(weight=30, ffm_measured_kg=31)

    assert result["ffm_kg"]["status"] == "invalid"
    assert result["qc_status"] == "error"


def test_smm_greater_than_ffm_is_invalid():
    result = bia(fat_mass_measured_kg=10, smm_kg=25)
    assert result["smm_kg"]["status"] == "invalid"
    assert "invalid_smm_ffm_relation" in result["flags"]


@pytest.mark.parametrize("field", ["pbf_percent", "tbw_percent"])
def test_percent_over_100_is_error(field):
    result = bia(**{field: 101})
    assert result[field]["status"] == "invalid"


def test_fat_mass_is_calculated_from_pbf_without_overwriting_raw():
    result = bia(weight=40, pbf_percent=25)
    assert result["fat_mass_kg"]["measured"] is None
    assert result["fat_mass_kg"]["calculated"] == 10
    assert result["fat_mass_kg"]["source"] == "calculated_from_pbf"


def test_ffm_is_calculated_from_weight_and_fat_mass():
    result = bia(weight=40, fat_mass_measured_kg=8)
    assert result["ffm_kg"]["calculated"] == 32


def test_measured_and_pbf_fat_mass_mismatch_warns_without_correction():
    result = bia(weight=40, pbf_percent=10, fat_mass_measured_kg=12)
    assert "fat_mass_consistency_warning" in result["flags"]
    assert result["fat_mass_kg"]["used_value"] == 12


def test_phase_angle_has_no_fabricated_who_interpretation():
    result = bia(phase_angle_deg=5.7)
    assert result["phase_angle_deg"]["value"] == 5.7
    assert result["phase_angle_deg"]["reference_source"] == "NONE"
    assert result["phase_angle_deg"]["status"] == "reference_not_available"


def test_invalid_reference_sd_does_not_calculate_z_score():
    result = calculate_body_composition(
        weight_kg=30,
        raw={"phase_angle_deg": 5.7},
        sex="erkak",
        age_months=120,
        references=[{
            "parameter": "phase_angle_deg", "sex": "erkak", "age_min_months": 100,
            "age_max_months": 140, "mean": 5.5, "sd": 0, "device_method": None,
            "source": "VALIDATED_EXTERNAL", "version": "v1",
        }],
    )
    assert result["phase_angle_deg"]["z_score"] is None
    assert "reference_model_error:phase_angle_deg" in result["flags"]


def test_missing_values_remain_none_not_zero():
    result = bia()
    assert result["phase_angle_deg"]["value"] is None
    assert result["fat_mass_kg"]["used_value"] is None


def test_segmental_asymmetry_is_descriptive_only():
    result = bia(segmental_lean_mass={"right_arm": 2.0, "left_arm": 1.8, "unit": "kg"})
    arms = result["segmental_lean_mass"]["asymmetry"]["arms"]
    assert arms["absolute_difference"] == pytest.approx(0.2)
    assert arms["interpretation"] == "asymmetry_measured"
    assert "pathological" not in str(arms).lower()


@pytest.mark.parametrize(
    ("sex", "age_years", "weight", "expected"),
    [
        ("erkak", 12, 60, round(17.686 * 60 + 658.2)),
        ("ayol", 12, 60, round(13.384 * 60 + 692.6)),
        ("erkak", 45, 60, round(11.472 * 60 + 873.1)),
        ("ayol", 45, 60, round(8.126 * 60 + 845.6)),
        ("erkak", 65, 60, round(11.711 * 60 + 587.7)),
        ("ayol", 65, 60, round(9.082 * 60 + 658.5)),
    ],
)
def test_bmr_uses_fao_who_schofield_age_and_sex_band(
    sex, age_years, weight, expected
):
    result = calculate_body_composition(
        weight_kg=weight,
        raw={},
        sex=sex,
        age_months=age_years * 12,
    )
    assert result["bmr_kcal_day"]["value"] == expected
    assert result["bmr_kcal_day"]["equation"] == "schofield_weight"
    assert result["bmr_kcal_day"]["source"] == "calculated"


def test_measured_bmr_is_preserved_instead_of_recalculated():
    result = calculate_body_composition(
        weight_kg=60,
        raw={"bmr_kcal_day": 1350, "bmr_source": "device"},
        sex="ayol",
        age_months=45 * 12,
    )
    assert result["bmr_kcal_day"]["value"] == 1350
    assert result["bmr_kcal_day"]["source"] == "device"


def test_anthropometric_phase_estimate_is_bounded_and_reproducible():
    value = estimate_phase_angle_from_anthropometry(
        age_months=5 * 12,
        sex="erkak",
        bmi=18.3 / (1.10**2),
    )
    assert value == 5.2
    assert 4.0 <= value <= 8.0


def test_gender_aliases_use_the_same_phase_and_bmr_branch():
    male_phase = estimate_phase_angle_from_anthropometry(
        age_months=12 * 12, sex="erkak", bmi=18
    )
    boy_phase = estimate_phase_angle_from_anthropometry(
        age_months=12 * 12, sex="boy", bmi=18
    )
    assert boy_phase == male_phase

    male_bmr = calculate_body_composition(
        weight_kg=40, raw={}, sex="erkak", age_months=12 * 12
    )["bmr_kcal_day"]["value"]
    boy_bmr = calculate_body_composition(
        weight_kg=40, raw={}, sex="boy", age_months=12 * 12
    )["bmr_kcal_day"]["value"]
    assert boy_bmr == male_bmr


def test_segmental_estimate_requires_age_and_recognized_sex():
    no_age = estimate_segmental_composition(
        ffm_kg=20, fat_mass_kg=5, age_months=None, sex="erkak"
    )
    unknown_sex = estimate_segmental_composition(
        ffm_kg=20, fat_mass_kg=5, age_months=120, sex="unknown"
    )

    assert no_age["segmental_lean_mass"] is None
    assert unknown_sex["segmental_fat_mass"] is None


def test_phase_angle_outside_physical_bia_angle_is_invalid():
    result = bia(phase_angle_deg=90)

    assert result["phase_angle_deg"]["status"] == "invalid"


def test_segmental_estimate_matches_whole_body_fallback_proportions():
    result = estimate_segmental_composition(
        ffm_kg=15,
        fat_mass_kg=3.3,
        age_months=5 * 12,
        sex="erkak",
    )
    lean = result["segmental_lean_mass"]
    fat = result["segmental_fat_mass"]
    assert lean["right_arm"] == 0.8
    assert lean["trunk"] == 6.4
    assert lean["right_leg"] == 2.6
    assert fat["right_arm"] == 0.2
    assert fat["trunk"] == 1.5
    assert fat["right_leg"] == 0.7
    assert lean["estimated"] is True
    assert fat["estimated"] is True


def test_segmental_estimate_does_not_invent_values_without_whole_body_mass():
    result = estimate_segmental_composition(
        ffm_kg=None,
        fat_mass_kg=None,
        age_months=5 * 12,
        sex="erkak",
    )
    assert result["segmental_lean_mass"] is None
    assert result["segmental_fat_mass"] is None


def test_non_finite_input_is_not_treated_as_a_measurement():
    result = bia(phase_angle_deg=math.inf)
    assert result["phase_angle_deg"]["value"] is None


def test_api_input_accepts_aliases_and_rejects_non_finite_numbers():
    value = BodyCompositionInput.model_validate({"tbwPercent": 60, "phaseAngleDeg": 5.5})
    assert value.tbw_percent == 60
    with pytest.raises(ValueError):
        BodyCompositionInput.model_validate({"phaseAngleDeg": math.nan})


def test_docx_uses_canonical_value_without_fabricated_who_label():
    canonical = bia(weight=40, pbf_percent=25, phase_angle_deg=5.7, source="device")
    report = generate_docx_file(
        {
            "age": 10,
            "gender": "erkak",
            "height": 140,
            "weight": 40,
            "chest": 70,
            "head": 52,
            "analysis": {"indices": {}},
            "body_composition": canonical,
        },
        "en",
    )
    document = Document(report)
    text = "\n".join(
        cell.text
        for table in document.tables
        for row in table.rows
        for cell in row.cells
    )
    assert "Phase Angle" in text and "5.70" in text
    assert "WHO" not in text


def test_docx_canonical_bia_section_contains_requested_compact_metrics():
    canonical = bia(
        weight=40,
        pbf_percent=25,
        smm_kg=18,
        visceral_fat_value=4,
        phase_angle_deg=5.7,
        segmental_lean_mass={
            "right_arm": 2.0,
            "left_arm": 1.9,
            "trunk": 15.0,
            "right_leg": 6.0,
            "left_leg": 5.9,
            "unit": "kg",
        },
        segmental_fat_mass={
            "right_arm": 0.5,
            "left_arm": 0.4,
            "trunk": 4.0,
            "right_leg": 1.2,
            "left_leg": 1.1,
            "unit": "kg",
        },
        mineral_bone_mass_kg=2.3,
    )
    report = generate_docx_file(
        {
            "age": 10,
            "gender": "erkak",
            "height": 140,
            "weight": 40,
            "chest": 70,
            "head": 52,
            "analysis": {"indices": {}},
            "body_composition": canonical,
        },
        "uz",
    )
    document = Document(report)
    text = "\n".join(
        cell.text
        for table in document.tables
        for row in table.rows
        for cell in row.cells
    )
    for label in (
        "PBF / Ёғ (%)",
        "Fat mass / Ёғ (кг)",
        "FFM / Ёғсиз масса (кг)",
        "SMM / Скелет мушак массаси (кг)",
        "Visceral Fat / Висцерал ёғ",
        "Phase Angle / Фаза бурчаги (°)",
        "Segmental Lean Mass / Сегментал ёғсиз масса",
        "Segmental Fat Mass / Сегментал ёғ массаси",
        "BMR (ккал/кун)",
        "Mineral/Bone mass / Суяк массаси (кг)",
    ):
        assert label in text

    bia_table = document.tables[3]
    assert len(bia_table.rows) == 5
    assert len(bia_table.columns) == 6
    segment_table = document.tables[4]
    assert len(segment_table.rows) == 3
    assert len(segment_table.columns) == 7
    assert "2 кг" in segment_table.cell(1, 2).text
    assert "15 кг" in segment_table.cell(1, 4).text


def test_docx_estimates_missing_phase_and_segmental_values_like_admin_xlsx():
    canonical = bia(weight=40, pbf_percent=18.4)
    report = generate_docx_file(
        {
            "age": 10,
            "age_months": 5,
            "gender": "erkak",
            "height": 140,
            "weight": 40,
            "chest": 70,
            "head": 52,
            "analysis": {"bmi": 20.4, "indices": {}},
            "body_composition": canonical,
        },
        "uz",
    )
    document = Document(report)
    bia_text = "\n".join(cell.text for row in document.tables[3].rows for cell in row.cells)
    segment_text = "\n".join(cell.text for row in document.tables[4].rows for cell in row.cells)
    assert "Phase Angle / Фаза бурчаги (°)" in bia_text
    assert "~" in bia_text
    assert "~" in segment_text
    assert "—" not in segment_text


def test_bioimpedance_permission_removes_canonical_docx_payload():
    payload = {
        "body_composition": {"pbf_percent": {"value": 20}},
        "bodyComposition": {"pbf_percent": {"value": 20}},
        "body_composition_raw": {"pbf_percent": 20},
        "body_composition_result": {"pbf_percent": {"value": 20}},
        "analysis": {"indices": {"fm_percent": 20}},
    }
    filtered = filter_payload_by_permissions(payload, {"bioimpedance": False})
    assert "body_composition" not in filtered
    assert "bodyComposition" not in filtered
    assert "body_composition_raw" not in filtered
    assert "body_composition_result" not in filtered
    assert "fm_percent" not in filtered["analysis"]["indices"]
