from services.ml_service import get_ml_predictions


def test_predictions_are_deterministic_for_screen_and_report_consistency():
    payload = {
        "age": 12,
        "gender": "erkak",
        "height": 150,
        "bmi": 24,
        "z_score": 2.4,
        "somatotype": "endomorf",
    }
    assert get_ml_predictions(payload) == get_ml_predictions(payload)
