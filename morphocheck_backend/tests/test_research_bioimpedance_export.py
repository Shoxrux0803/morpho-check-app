from types import SimpleNamespace

from routers.research_router import (
    RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS,
    build_research_index_export_values,
    get_research_bioimpedance_export_headers,
    get_research_xlsx_export_field_order,
)


def _record(**overrides):
    values = {
        "birth_date": "2014-01-01",
        "examination_date": "2026-01-01",
        "chest_standing_height": 150.0,
        "weight": 45.0,
        "torso_length": 68.0,
        "chest_circumference_pause": 72.0,
        "settlement": "Toshkent",
        "birth_place": "Toshkent",
        "gender": "boy",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_research_export_calculates_all_bioimpedance_values():
    values = build_research_index_export_values(_record(), "en")

    assert list(values.keys())[:7] == RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
    assert all(values[field] is not None for field in RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS)
    assert abs(values["fat_mass"] - 45.0 * values["fat_percent"] / 100) < 0.1
    assert 0 < values["tbw_percent"] < 100
    assert 0 < values["acm_percent"] <= 100


def test_research_bioimpedance_headers_are_localized_for_every_export_language():
    expected_languages = {"uz", "ru", "en", "kz", "ky", "tg", "tm", "tr"}

    for lang in expected_languages:
        headers = get_research_bioimpedance_export_headers(lang)
        assert [field for _, field in headers] == RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
        assert all(label and label != field for label, field in headers)

    en_labels = {
        field: label for label, field in get_research_bioimpedance_export_headers("en")
    }
    ru_labels = {
        field: label for label, field in get_research_bioimpedance_export_headers("ru")
    }
    assert en_labels["fat_percent"] == "Fat (%)"
    assert ru_labels["fat_percent"] == "\u0416\u0438\u0440 (%)"

    uz_labels = {
        field: label for label, field in get_research_bioimpedance_export_headers("uz")
    }
    assert uz_labels["fat_percent"] == "\u0401\u0493 (%)"
    assert uz_labels["fat_mass"] == "\u0401\u0493 (\u043a\u0433)"
    assert uz_labels["muscle_mass"] == "\u041c\u0443\u0448\u0430\u043a (\u043a\u0433)"
    assert uz_labels["visceral_fat"] == "\u0412\u0438\u0441\u0446\u0435\u0440\u0430\u043b \u0451\u0493"


def test_research_export_varies_acm_and_visceral_fat_across_records():
    record_1 = _record(
        birth_date="2018-01-01", weight=22.0, chest_standing_height=120.0, gender="boy"
    )
    record_2 = _record(
        birth_date="2010-01-01", weight=65.0, chest_standing_height=165.0, gender="girl"
    )

    values_1 = build_research_index_export_values(record_1, "uz")
    values_2 = build_research_index_export_values(record_2, "uz")

    assert values_1["acm_percent"] != values_2["acm_percent"]
    assert values_1["visceral_fat"] != values_2["visceral_fat"]
    assert 45.0 <= values_1["acm_percent"] <= 65.0
    assert 45.0 <= values_2["acm_percent"] <= 65.0
    assert 1.0 <= values_1["visceral_fat"] <= 15.0
    assert 1.0 <= values_2["visceral_fat"] <= 15.0


def test_research_xlsx_field_order_places_bioimpedance_between_popliteal_fat_and_tvi():
    fields = get_research_xlsx_export_field_order()

    pop_index = fields.index("fat_popliteal")
    tvi_index = fields.index("tvi")

    assert pop_index + 1 == fields.index("tbw_percent")
    assert fields[pop_index + 1 : tvi_index] == RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
    assert fields[tvi_index - 1] == "visceral_fat"
    assert fields[tvi_index] == "tvi"


def test_research_xlsx_export_calculations_and_attributes_are_complete_and_valid():
    record = _record(
        birth_date="2016-05-10",
        examination_date="2026-05-10",
        chest_standing_height=140.0,
        weight=35.0,
        torso_length=64.0,
        chest_circumference_pause=68.0,
        gender="girl",
    )
    index_values = build_research_index_export_values(record, "uz")
    fields = get_research_xlsx_export_field_order()

    for field_name in fields:
        if field_name in {"created_by_name", "created_by_email"}:
            val = None
        elif field_name == "child_age":
            val = "10 sol 0 moh 0 ruz"
        elif field_name == "age_group":
            val = "10"
        elif field_name in index_values:
            val = index_values[field_name]
            assert val is not None, f"Index calculation missing for {field_name}"
        else:
            val = getattr(record, field_name, None)

    # Validate mathematical correctness of exported indices
    assert 10.0 <= index_values["tvi"] <= 35.0
    assert -4.0 <= index_values["z_h"] <= 4.0
    assert -4.0 <= index_values["z_w"] <= 4.0
    assert -4.0 <= index_values["z_bmi"] <= 4.0
    assert 0.0 < index_values["fat_percent"] < 80.0
    assert 0.0 < index_values["tbw_percent"] < 90.0
    assert 40.0 <= index_values["acm_percent"] <= 70.0
    assert 1.0 <= index_values["visceral_fat"] <= 15.0
    assert isinstance(index_values["corridor"], str) and len(index_values["corridor"]) > 0
    assert isinstance(index_values["morphological_type"], str) and len(index_values["morphological_type"]) > 0

