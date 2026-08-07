from services.indices_service import calculate_detailed_indices


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


def test_v54_indices_stay_in_required_ranges():
    result = _base_result()

    assert 0 <= result["hmai"] <= 100
    assert 0 <= result["mii"] <= 100
    assert 0 <= result["adi"] <= 8
    assert 0 <= result["mcri"] <= 100
    assert result["range_check_passed"] is True
    assert result["reference_model_version"] == "UZ_FALLBACK_V5_4"


def test_hmai_extreme_z_limits_final_category_to_borderline():
    result = _base_result(height=155.0, bmi=15.8)

    assert result["extreme_z_flag"] is True
    assert result["hmai_category"] not in {"high", "satisfactory"}


def test_mii_severe_component_limits_final_category_to_borderline():
    manual_data = {
        "chest": 64.0,
        "shoulder_breadth": 28.0,
        "thigh_circumference": 38.0,
        "calf_circumference": 25.0,
        "fat_percent": 25.0,
        "fat_mass": 6.375,
        "muscle_mass": 15.0,
        "total_body_water": 15.6375,
    }
    result = _base_result(manual_data=manual_data)

    assert result["severe_component_flag"] is True
    assert result["raw_category"]["mii"] in {"high", "satisfactory"}
    assert result["mii_category"] == "borderline"


def test_mq_hard_qc_blocks_mii_and_mcri():
    manual_data = {
        "chest": 64.0,
        "shoulder_breadth": 28.0,
        "thigh_circumference": 38.0,
        "calf_circumference": 25.0,
        "fat_mass": 25.5,
        "muscle_mass": 1.0,
    }
    result = _base_result(manual_data=manual_data)

    assert result["qc_status"] == "error"
    assert result["mii"] is None
    assert result["mcri"] is None
    assert "hard_qc:fat_mass_out_of_range" in result["component_flags"]
