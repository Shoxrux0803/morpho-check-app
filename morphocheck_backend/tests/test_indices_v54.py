from services.indices_service import (
    calculate_age_independent_indices,
    calculate_detailed_indices,
)


def _base_result(**overrides):
    data = {
        "age": 8,
        "gender": "erkak",
        "height": 127.0,
        "weight": 25.5,
        "bmi": 15.8,
        "manual_data": {
            "chest": 64.0,
            "shoulder_breadth": 28.0,
            "thigh_circumference": 38.0,
            "calf_circumference": 25.0,
            "fat_percent": 17.0,
            "fat_mass": 4.3,
            "muscle_mass": 17.0,
            "total_body_water": 16.5,
        },
        "lang": "uz",
    }
    data.update(overrides)
    return calculate_detailed_indices(**data)


# v5.4 index expectations are replaced by golden cases in test_indices_v6.py.
# Retain the existing composition regression coverage.
def test_out_of_scope_indices_are_unavailable():
    result = _base_result()
    assert result["range_check_passed"] is True
    assert all(result[k] is None for k in ("hmai", "mii", "adi", "mcri"))
    assert result["reference_model_version"] == "DSC_2038_HMAI_MII_ADI_MCRI_v6"


def test_automatic_composition_always_reconciles_to_total_weight():
    for gender, height, weight in (
        ("erkak", 84.98, 8.46),
        ("ayol", 90.0, 9.0),
        ("boy", 140.0, 35.0),
        ("girl", 165.0, 65.0),
    ):
        bmi = weight / ((height / 100) ** 2)
        result = calculate_age_independent_indices(
            gender=gender,
            height=height,
            weight=weight,
            bmi=bmi,
            manual_data={},
        )

        assert result["ffm"] + result["fm"] == weight
        assert 0 < result["ffm"] < weight
        assert 2 <= result["fm_percent"] <= 45


def test_pbf_and_fat_mass_inputs_cannot_create_two_conflicting_compositions():
    result_from_pbf = calculate_age_independent_indices(
        gender="erkak",
        height=140,
        weight=40,
        bmi=20.4,
        manual_data={"fat_percent": 25},
    )
    result_from_mass = calculate_age_independent_indices(
        gender="erkak",
        height=140,
        weight=40,
        bmi=20.4,
        manual_data={"fat_mass": 10, "fat_percent": 10},
    )

    assert result_from_pbf["fm"] == 10
    assert result_from_pbf["ffm"] == 30
    assert result_from_mass["fm_percent"] == 25
    assert "warning:fat_mass_pbf_mismatch" in result_from_mass["component_flags"]
