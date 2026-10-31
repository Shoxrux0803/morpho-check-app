import json
import math
from pathlib import Path

import pytest

from services.index_model_v6 import MODEL, MODEL_VERSION, calculate_v6, d, risk, who_z
from services.indices_service import calculate_detailed_indices


@pytest.mark.parametrize(
    "key,cutoffs,codes",
    [
        ("hmai", [40, 60, 80], ["low", "borderline", "satisfactory", "high"]),
        ("mii", [40, 60, 80], ["low", "borderline", "satisfactory", "high"]),
        ("adi", [37.5, 75], ["harmonic", "disharmonic", "severe"]),
        (
            "mcri",
            [30, 50, 70],
            ["low_risk", "moderate_risk", "high_risk", "very_high_risk"],
        ),
    ],
)
def test_category_cutoffs_are_inclusive_without_legacy_caps(key, cutoffs, codes):
    from services.index_model_v6 import category_for_score

    for position, cutoff in enumerate(cutoffs):
        assert category_for_score(key, cutoff - 1e-8) == codes[position]
        assert category_for_score(key, cutoff) == codes[position + 1]
        assert category_for_score(key, cutoff + 1e-8) == codes[position + 1]
    assert category_for_score(key, None) == "not_calculated"


def test_ffm_migration_is_additive_and_can_follow_startup_schema_update():
    import importlib.util

    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    from sqlalchemy import create_engine, inspect, text

    migration = (
        Path(__file__).resolve().parents[1]
        / "alembic/versions/20261031_1200_d62d09a1b4c0_research_measured_ffm.py"
    )
    spec = importlib.util.spec_from_file_location("ffm_migration", migration)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE research_records (id INTEGER PRIMARY KEY, weight FLOAT)")
        )
        connection.execute(
            text("INSERT INTO research_records (id, weight) VALUES (1, 17)")
        )
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        module.upgrade()
        assert "ffm_measured_kg" in {
            col["name"] for col in inspect(connection).get_columns("research_records")
        }
        assert connection.execute(
            text("SELECT weight, ffm_measured_kg FROM research_records")
        ).one() == (17, None)


WORKBOOK = json.loads(
    (Path(__file__).parent / "fixtures/index_v6_workbook.json").read_text(
        encoding="utf-8"
    )
)


def cell(row, column):
    value = next(
        c["value"] for key, c in row.items() if key.rstrip("0123456789") == column
    )
    try:
        return float(value)
    except (TypeError, ValueError):
        return value


def inputs(row):
    return dict(
        zip(
            (
                "age_months",
                "sex",
                "height_cm",
                "weight_kg",
                "ffm_kg",
                "thigh_circ_cm",
                "calf_circ_cm",
                "upper_arm_circ_cm",
            ),
            (cell(row, c) for c in "BCDEFGHI"),
        )
    )


@pytest.mark.parametrize("row", WORKBOOK[5][2:], ids=lambda row: cell(row, "A"))
def test_all_workbook_intermediates_and_final_scores(row):
    args = inputs(row)
    result = calculate_v6(**args)
    for key, col in zip(
        (
            "haz",
            "waz",
            "baz",
            "z_fmi",
            "z_ffmi",
            "z_ln_th",
            "z_ln_ca",
            "z_ln_ar",
            "am",
            "gm",
            "hmai",
            "mii",
            "adi",
            "mcri",
        ),
        "JKLMNOPQRSTUVW",
    ):
        assert result[key] == pytest.approx(cell(row, col), abs=1e-8)
    for key, col in zip(("hmai", "mii", "adi", "mcri"), ("X", "Y", "Z", "AA")):
        assert result[key] == pytest.approx(cell(row, col), abs=1e-8)
    # Exercise the public application engine too, including unrounded BMI.
    integrated = calculate_detailed_indices(
        int(args["age_months"] // 12),
        args["sex"],
        args["height_cm"],
        args["weight_kg"],
        round(args["weight_kg"] / (args["height_cm"] / 100) ** 2, 1),
        {
            "ffm_kg": args["ffm_kg"],
            "thigh_circumference": args["thigh_circ_cm"],
            "calf_circumference": args["calf_circ_cm"],
            "shoulder_circumference": args["upper_arm_circ_cm"],
        },
        age_months=args["age_months"],
    )
    for key in ("hmai", "mii", "adi", "mcri"):
        assert integrated[key] == pytest.approx(result[key], abs=1e-10)
    assert integrated["z_bmi"] == result["baz"]
    assert integrated["reference_model_version"] == MODEL_VERSION


def test_json_and_excel_all_reference_rows_and_constants_agree():
    rows = WORKBOOK[4][2:]
    assert len(rows) == len(MODEL["who_lms_source_rows"]) == 366
    for excel, source in zip(rows, MODEL["who_lms_source_rows"]):
        for key, col in zip(
            ("indicator", "sex", "month", "L", "M", "S", "reference"), "ABCDEFG"
        ):
            assert source[key] == cell(excel, col)
        assert who_z(
            source["indicator"], source["M"], source["sex"], source["month"]
        ) == pytest.approx(0, abs=1e-12)
    for excel, source in zip(WORKBOOK[3][2:], MODEL["internal_reference"]["rows"]):
        assert source["variable"] == cell(excel, "A")
        for key, col in zip(("b0", "b1", "b2", "residual_sd"), "CDEF"):
            assert source[key] == cell(excel, col)
    params = {int(next(iter(row))[1:]): row for row in WORKBOOK[2][2:]}
    assert MODEL["constants"]["K"] == cell(params[5], "B")
    for row_number, value in zip(
        range(6, 11), MODEL["constants"]["MCRI_weights"].values()
    ):
        assert value == cell(params[row_number], "B")
    assert sum(MODEL["constants"]["MCRI_weights"].values()) == pytest.approx(1)
    assert MODEL["constants"]["age_center_months"] == cell(params[12], "B")
    assert MODEL["constants"]["months_per_year"] == cell(params[13], "B")


def test_frontend_reference_copy_matches_all_366_source_rows():
    frontend = Path(__file__).resolve().parents[2] / "src/data/whoLmsV6.json"
    assert (
        json.loads(frontend.read_text(encoding="utf-8")) == MODEL["who_lms_source_rows"]
    )


@pytest.mark.parametrize("age", [29.999, 90.001, None, float("nan")])
def test_outside_scope_never_extrapolates(age):
    args = inputs(WORKBOOK[5][2])
    args["age_months"] = age
    result = calculate_v6(**args)
    assert all(result[k] is None for k in ("hmai", "mii", "adi", "mcri"))


@pytest.mark.parametrize("age", [30, 60, 60.5, 61, 90])
@pytest.mark.parametrize("sex", ["male", "female"])
def test_age_boundaries_transition_and_sexes(age, sex):
    args = inputs(WORKBOOK[5][2])
    args.update(age_months=age, sex=sex)
    result = calculate_v6(**args)
    assert all(
        math.isfinite(result[k]) and 0 <= result[k] <= 100
        for k in ("hmai", "mii", "adi", "mcri")
    )


@pytest.mark.parametrize(
    "key", ["ffm_kg", "thigh_circ_cm", "calf_circ_cm", "upper_arm_circ_cm"]
)
def test_missing_measurements_are_not_imputed(key):
    args = inputs(WORKBOOK[5][2])
    args[key] = None
    result = calculate_v6(**args)
    assert result["hmai"] is not None
    assert result["mcri"] is None
    assert result["mii" if key == "ffm_kg" else "adi"] is None


def test_estimated_composition_cannot_enter_v6_indices():
    result = calculate_detailed_indices(4, "erkak", 105, 17, 15.4, {"fat_percent": 20})
    assert result["ffm"] is not None  # Separate, legacy estimate for display.
    assert result["mii"] is None
    assert result["mcri"] is None
    assert "missing:ffm_kg" in result["component_flags"]


def test_independent_fm_only_flags_disagreement_and_does_not_replace_ffm():
    args = inputs(WORKBOOK[5][2])
    baseline = calculate_v6(**args)
    changed = calculate_v6(**args, fm_kg=8)
    assert "warning:independent_fm_disagreement" in changed["component_flags"]
    assert all(baseline[k] == changed[k] for k in ("fmi", "ffmi", "mii", "mcri"))


def test_qc_thresholds_and_no_raw_mutation():
    args = inputs(WORKBOOK[5][2])
    args["height_cm"] = 94.99
    snapshot = args.copy()
    result = calculate_v6(**args, baz=5.01)
    assert args == snapshot
    assert "warning:bia_height_under_95cm" in result["component_flags"]
    assert "warning:abs_baz_over_5" in result["component_flags"]
    args["height_cm"] = 95
    boundary = calculate_v6(**args, baz=5)
    assert "warning:bia_height_under_95cm" not in boundary["component_flags"]
    assert "warning:abs_baz_over_5" not in boundary["component_flags"]


@pytest.mark.parametrize("value", [-1, 0, float("inf"), True, "bad"])
def test_invalid_ffm_blocks_composition_indices(value):
    args = inputs(WORKBOOK[5][2])
    args["ffm_kg"] = value
    result = calculate_v6(**args)
    assert result["mii"] is None and result["mcri"] is None


def test_negative_deviations_do_not_add_positive_mcri_risk():
    assert risk(-4) == risk(0) == 0
    assert risk(1.5) == 50
    assert risk(3) == risk(9) == 100
    assert d(-3) == d(3) == d(9) == 1


@pytest.mark.parametrize("alias,sex", list(MODEL["sex_map"].items()))
def test_supplied_sex_aliases_accept_case_and_whitespace(alias, sex):
    args = inputs(WORKBOOK[5][2])
    args["sex"] = " " + alias.lower() + " "
    result = calculate_v6(**args)
    args["sex"] = sex
    assert result["hmai"] == calculate_v6(**args)["hmai"]


def test_l_zero_uses_logarithm(monkeypatch):
    from services import index_model_v6

    monkeypatch.setitem(
        index_model_v6._LMS, ("HFA", "male", 60), {"L": 0, "M": 100, "S": 0.1}
    )
    assert who_z("HFA", 100 * math.exp(0.2), "male", 60) == pytest.approx(2)


@pytest.mark.parametrize("indicator", ["WFA", "BFA"])
@pytest.mark.parametrize("sign", [-1, 1])
def test_restricted_who_extrapolation_in_measurement_units(indicator, sign):
    row = next(
        r
        for r in MODEL["who_lms_source_rows"]
        if r["indicator"] == indicator and r["sex"] == "female" and r["month"] == 60
    )

    def y(z):
        return row["M"] * (1 + row["L"] * row["S"] * z) ** (1 / row["L"])

    at_three, at_two = y(sign * 3), y(sign * 2)
    value = at_three + (at_three - at_two)
    assert who_z(indicator, value, "female", 60) == pytest.approx(sign * 4, abs=1e-10)


def test_patient_pipeline_passes_measured_ffm_circumference_and_fractional_age():
    from types import SimpleNamespace

    from models.schemas import BodyCompositionInput
    from services.analyze_service import build_growth_standards, calculate_bmi

    fields = dict.fromkeys(
        (
            "total_body_water",
            "fat_percent",
            "fat_mass",
            "muscle_mass",
            "bone_mass",
            "acm",
            "visceral_fat",
            "body_length",
            "region",
            "district",
            "mahalla",
            "address",
            "shoulder_breadth",
        )
    )
    fields.update(
        age=3,
        age_months=11,
        age_days=24,
        gender="erkak",
        height=101.12,
        weight=13.48,
        chest=52,
        head=49,
        thigh_circumference=32.25,
        calf_circumference=17.17,
        shoulder_circumference=21.05,
        body_composition=BodyCompositionInput(ffmMeasuredKg=12.1, fatMassMeasuredKg=8),
    )
    patient = SimpleNamespace(**fields)
    analysis = calculate_bmi(patient, {}, lang="en")
    expected = calculate_v6(
        age_months=47 + 24 / 30.4375,
        sex="male",
        height_cm=101.12,
        weight_kg=13.48,
        ffm_kg=12.1,
        fm_kg=8,
        thigh_circ_cm=32.25,
        calf_circ_cm=17.17,
        upper_arm_circ_cm=21.05,
    )
    assert (
        "warning:independent_fm_disagreement" in analysis["indices"]["component_flags"]
    )
    for key in ("hmai", "mii", "adi", "mcri"):
        assert analysis["indices"][key] == pytest.approx(expected[key], abs=1e-10)
    assert analysis["indices"]["ffm"] == 12.1
    growth = build_growth_standards(patient, analysis)
    assert growth["metrics"]["height"]["z_score"] == expected["haz"]
    assert growth["metrics"]["height"]["age_range_months"] == {"min": 30, "max": 90}


def test_research_export_has_a_measured_ffm_path():
    from types import SimpleNamespace

    from routers.research_router import build_research_index_export_values

    record = SimpleNamespace(
        birth_date="2022-01-01",
        examination_date="2026-01-01",
        chest_standing_height=105,
        weight=17,
        ffm_measured_kg=13,
        torso_length=None,
        trunk_length=None,
        chest_circumference_pause=52,
        thigh_circumference=34,
        calf_circumference=23,
        arm_circumference_total=16,
        settlement=None,
        birth_place=None,
        gender="boy",
    )
    result = build_research_index_export_values(record, "en")
    expected = calculate_v6(
        age_months=48,
        sex="male",
        height_cm=105,
        weight_kg=17,
        ffm_kg=13,
        thigh_circ_cm=34,
        calf_circ_cm=23,
        upper_arm_circ_cm=16,
    )
    for key in ("hmai", "mii", "adi", "mcri"):
        assert result[key] == pytest.approx(expected[key], abs=1e-10)
