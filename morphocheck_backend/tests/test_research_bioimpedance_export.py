from types import SimpleNamespace

from routers.research_router import (
    RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS,
    build_research_index_export_values,
    get_research_bioimpedance_export_headers,
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

    assert list(values.keys())[-7:] == RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS
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
    assert uz_labels["bone_mass"] == "\u0421\u0443\u044f\u043a (\u043a\u0433)"
    assert uz_labels["visceral_fat"] == "\u0412\u0438\u0441\u0446\u0435\u0440\u0430\u043b \u0451\u0493"
