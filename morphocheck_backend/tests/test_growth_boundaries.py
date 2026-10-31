from types import SimpleNamespace

from services.analyze_service import build_growth_standards


def _patient(age, age_months=0):
    return SimpleNamespace(
        age=age,
        age_months=age_months,
        height=176,
        weight=70,
        chest=90,
        head=56,
    )


def test_indicator_specific_age_boundaries_do_not_extrapolate():
    analysis = {
        "bmi": 22.6,
        "indices": {"z_h": 0.1, "z_w": 0.2, "z_bmi": 0.3},
    }
    result = build_growth_standards(_patient(15), analysis)["metrics"]

    assert result["height"]["z_score"] == 0.1
    assert result["weight"]["z_score"] is None
    assert result["weight"]["applicable"] is False
    assert result["weight"]["risk"]["level"] == "unknown"
    assert result["weight"]["not_applicable_reason"] == "Ushbu yosh uchun qo'llanmaydi"


def test_all_growth_metrics_are_unavailable_outside_reference_age():
    analysis = {
        "bmi": 25,
        "indices": {"z_h": 0, "z_w": 0, "z_bmi": 0},
    }
    metrics = build_growth_standards(_patient(25), analysis)["metrics"]
    assert all(metric["z_score"] is None for metric in metrics.values())
    assert all(metric["risk"]["level"] == "unknown" for metric in metrics.values())
