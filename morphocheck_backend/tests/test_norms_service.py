from services.norms_service import get_typical_params


def test_prediction_uses_months_instead_of_whole_year_only():
    at_ten = get_typical_params(10, "erkak")
    at_ten_and_half = get_typical_params(10, "erkak", age_months=6)
    at_eleven = get_typical_params(11, "erkak")

    assert at_ten["height"] < at_ten_and_half["height"] < at_eleven["height"]
    assert at_ten["weight"] < at_ten_and_half["weight"] < at_eleven["weight"]


def test_predictions_are_gender_specific_and_anatomically_consistent():
    male = get_typical_params(14, "erkak", age_months=3)
    female = get_typical_params(14, "ayol", age_months=3)

    assert male["height"] != female["height"]
    for result in (male, female):
        assert result["height"] > result["chest"] > result["head"]
        assert result["fatMass"] == round(
            result["weight"] * result["fatPercent"] / 100, 1
        )
