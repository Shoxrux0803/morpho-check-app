import re

from routers.admin_router import (
    IMPORT_TEMPLATE_COLUMNS,
    build_admin_import_template_workbook,
    parse_import_header_field,
)


def test_admin_import_template_is_cyrillic_without_english_words():
    wb = build_admin_import_template_workbook({})
    assert wb.sheetnames == ["Маълумотлар", "Намуна", "Қўлланма"]

    latin_letters = re.compile(r"[A-Za-z]")
    visible_text = []
    for sheet in wb.worksheets:
        assert not latin_letters.search(sheet.title)
        visible_text.append(sheet.title)
        for row in sheet.iter_rows():
            for cell in row:
                if isinstance(cell.value, str):
                    visible_text.append(cell.value)
                    assert not latin_letters.search(cell.value)
    assert "Ота-она телефони" not in "\n".join(visible_text)


def test_admin_import_template_headers_map_back_to_import_fields():
    wb = build_admin_import_template_workbook({})
    headers = [cell.value for cell in wb["Маълумотлар"][1]]
    fields = [field for field, _header, _sample in IMPORT_TEMPLATE_COLUMNS]

    assert all(header != field for header, field in zip(headers, fields))
    assert all("_" not in header for header in headers)
    assert "parents_phone" not in fields
    assert [parse_import_header_field(header) for header in headers] == fields
    assert parse_import_header_field("first_name (Ism) *") == "first_name"
