from models.userdata import ResearchRecord
from routers.research_router import (
    RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS,
    build_research_import_template_workbook,
    build_research_index_export_values,
    get_research_import_fields,
    get_research_import_headers,
    map_import_headers,
)


def test_import_template_uses_report_cyrillic_headers_without_internal_names():
    fields = get_research_import_fields()
    headers = get_research_import_headers()

    assert len(headers) == len(fields)
    assert all(header != field for header, field in zip(headers, fields))
    assert all("_" not in header for header in headers)
    assert headers[fields.index("full_name")] == "\u0424.\u0418.\u0428."
    assert headers[fields.index("weight")] == "\u0412\u0430\u0437\u043d (\u043a\u0433)"


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
    assert len(headers) == len(fields) + len(RESEARCH_BIOIMPEDANCE_EXPORT_FIELDS)


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
