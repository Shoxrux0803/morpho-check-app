from models.userdata import ResearchRecord
from routers.research_router import (
    RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS,
    RESEARCH_TEMPLATE_EXCLUDED_FIELDS,
    build_research_import_template_workbook,
    build_research_index_export_values,
    format_research_child_age,
    get_research_bioimpedance_export_headers,
    get_research_import_fields,
    get_research_import_headers,
    map_import_headers,
    research_record_to_dict,
)


def test_import_template_uses_report_cyrillic_headers_without_internal_names():
    fields = get_research_import_fields()
    headers = get_research_import_headers()

    assert len(headers) == len(fields)
    assert all(header != field for header, field in zip(headers, fields))
    assert all("_" not in header for header in headers)
    assert headers[fields.index("full_name")] == "\u0424.\u0418.\u0428."
    assert headers[fields.index("weight")] == "\u0412\u0430\u0437\u043d (\u043a\u0433)"
    assert RESEARCH_TEMPLATE_EXCLUDED_FIELDS.isdisjoint(fields)


def test_generated_template_is_blank_and_maps_back_to_import_fields():
    wb = build_research_import_template_workbook()
    ws = wb["\u041c\u0430\u044a\u043b\u0443\u043c\u043e\u0442\u043b\u0430\u0440"]
    fields = get_research_import_fields()
    headers = [cell.value for cell in ws[1]]
    mapped = map_import_headers(headers)

    assert wb.sheetnames == [
        "\u041c\u0430\u044a\u043b\u0443\u043c\u043e\u0442\u043b\u0430\u0440",
        "\u041d\u0430\u043c\u0443\u043d\u0430",
        "\u049a\u045e\u043b\u043b\u0430\u043d\u043c\u0430",
    ]
    assert all(cell.value is None for cell in ws[2])
    assert [mapped[index] for index in range(len(fields))] == fields
    assert len(headers) == len(fields)
    assert not any(
        header in headers
        for header, _ in get_research_bioimpedance_export_headers("uz")
    )


def test_blank_import_template_keeps_identity_columns_when_privacy_is_enabled():
    hidden_fields = get_research_import_fields(privacy_enabled=True)
    visible_fields = get_research_import_fields(privacy_enabled=False)
    hidden_wb = build_research_import_template_workbook(privacy_enabled=True)
    visible_wb = build_research_import_template_workbook(privacy_enabled=False)
    hidden_headers = [
        cell.value for cell in hidden_wb["\u041c\u0430\u044a\u043b\u0443\u043c\u043e\u0442\u043b\u0430\u0440"][1]
    ]
    visible_headers = [
        cell.value for cell in visible_wb["\u041c\u0430\u044a\u043b\u0443\u043c\u043e\u0442\u043b\u0430\u0440"][1]
    ]

    assert hidden_fields == visible_fields
    assert "full_name" in hidden_fields
    assert "school_name" in hidden_fields
    assert "birth_place" in hidden_fields
    assert "full_name" in visible_fields
    assert "birth_date" in hidden_fields
    assert "birth_date" in visible_fields
    assert hidden_headers == visible_headers
    assert "\u0424.\u0418.\u0428." in hidden_headers
    assert "\u0424.\u0418.\u0428." in visible_headers


def test_privacy_import_keeps_identity_and_calculation_fields():
    headers = [
        "\u0424.\u0418.\u0428.",
        "\u0422\u0443\u0493\u0438\u043b\u0433\u0430\u043d \u0441\u0430\u043d\u0430\u0441\u0438",
        "\u0422\u0435\u043a\u0448\u0438\u0440\u0443\u0432 \u0441\u0430\u043d\u0430\u0441\u0438",
        "\u0411\u045e\u0439\u0438 (\u0442\u0438\u043a) (\u0441\u043c)",
        "\u0412\u0430\u0437\u043d (\u043a\u0433)",
    ]

    mapped = map_import_headers(headers, privacy_enabled=True)

    assert mapped[0] == "full_name"
    assert mapped[1] == "birth_date"
    assert mapped[2] == "examination_date"
    assert mapped[3] == "chest_standing_height"
    assert mapped[4] == "weight"


def test_personal_fields_are_optional_and_cyrillic_gender_calculates_as_male():
    record = ResearchRecord(
        full_name=None,
        school_name=None,
        settlement=None,
        birth_place=None,
        birth_date="2014-01-01",
        examination_date="2026-01-01",
        gender="\u040e\u0493\u0438\u043b \u0431\u043e\u043b\u0430",
        chest_standing_height=150.0,
        weight=45.0,
    )

    values = build_research_index_export_values(record, "uz")

    assert record.full_name is None
    assert record.settlement is None
    assert values["tbw_percent"] == 61.4
    assert all(values[field] is not None for field in RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS)


def test_research_age_at_examination_uses_exact_calendar_date():
    record = ResearchRecord(
        birth_date="2024-04-17",
        examination_date="2026-04-17",
    )

    payload = research_record_to_dict(record)

    assert format_research_child_age(record, "uz") == "2 \u0451\u0448 0 \u043e\u0439 0 \u043a\u0443\u043d"
    assert payload["age_at_examination"] == "2 \u0451\u0448 0 \u043e\u0439 0 \u043a\u0443\u043d"
    assert payload["age_at_examination_years"] == 2
    assert payload["age_at_examination_months"] == 0
    assert payload["age_at_examination_days"] == 0
