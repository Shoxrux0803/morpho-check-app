from services.data_quality_service import (
    bmi_screening_issue,
    calculate_source_bmi,
    summarize_anthropometry_quality,
)


def test_bmi_screening_uses_source_height_and_weight():
    assert round(calculate_source_bmi(117.26, 13.6), 1) == 9.9
    assert bmi_screening_issue(117.26, 13.6) is not None
    assert bmi_screening_issue(110.86, 12.27) is None
    assert bmi_screening_issue(140.5, 35.2) is None


def test_quality_summary_flags_strict_thigh_height_proportionality():
    rows = [
        {
            "id": index,
            "id_code": f"MC-{index:04d}",
            "height": 100 + index,
            "weight": 18 + index * 0.2,
            "thigh_circumference": (100 + index) * 0.326,
        }
        for index in range(1, 41)
    ]

    summary = summarize_anthropometry_quality(rows)

    assert summary["thigh_height_correlation"] == 1.0
    assert summary["thigh_height_ratio_sd"] == 0.0
    assert summary["thigh_height_proportionality_review"] is True
    assert "THIGH_HEIGHT_PROPORTIONALITY_REVIEW" in summary["flags"]


def test_quality_summary_does_not_flag_small_dataset_correlation():
    rows = [
        {
            "height": 100 + index,
            "weight": 18,
            "thigh_circumference": (100 + index) * 0.326,
        }
        for index in range(5)
    ]

    summary = summarize_anthropometry_quality(rows)

    assert summary["thigh_height_proportionality_review"] is False
