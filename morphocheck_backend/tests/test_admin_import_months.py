from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from openpyxl import Workbook

from models.schemas import PatientData
from routers.admin_router import (
    build_admin_import_template_workbook,
    parse_import_header_field,
)
from services.admin_import_layout import resolve_admin_import_sheet
from services.age_service import split_age_months, total_age_months


def resolve(workbook, privacy=False):
    return resolve_admin_import_sheet(
        workbook, parse_import_header_field, lambda _: True, privacy
    )


def test_unknown_workbook_never_falls_back_to_positional_columns():
    workbook = Workbook()
    workbook.active.append(["ID", "HAZ", "WAZ", "WHO"])
    workbook.active.append([1, -0.2, 0.4, "WHO2006"])
    with pytest.raises(HTTPException) as error:
        resolve(workbook)
    assert error.value.status_code == 400
    assert "taxminiy import qilinmadi" in error.value.detail


def test_main_study_sheet_has_explicit_month_mapping_and_clear_missing_fields():
    workbook = Workbook()
    workbook.active.title = "02_WHO_2038_ҚИЁС"
    workbook.active.append(["ID", "Ёш (ой)", "Жинс", "Қўлланилган WHO", "HAZ асосий"])
    main = workbook.create_sheet("01_2038_АСОСИЙ")
    main.append(
        [
            "ID",
            "Ҳудуд",
            "Жинс",
            "Ёш (ой)",
            "Ёш гуруҳи",
            "Бўй (см)",
            "Вазн (кг)",
            "BMI",
            "FFM (кг)",
            "FM (кг)",
            "PBF (%)",
            "Сон айл.",
            "Болдир айл.",
            "Елка айл.",
        ]
    )
    with pytest.raises(HTTPException) as error:
        resolve(workbook)
    assert main.title in error.value.detail
    assert all(
        label in error.value.detail
        for label in ("F.I.Sh.", "Ko‘krak aylanasi", "Bel aylanasi", "Bosh aylanasi")
    )
    assert parse_import_header_field("Ёш (ой)") == "age_total_months"
    assert parse_import_header_field("Ёши *") == "age"
    assert parse_import_header_field("Ёши ойларда") == "age_months"


def test_wrong_active_sheet_is_replaced_by_unique_compatible_data_sheet():
    workbook = Workbook()
    workbook.active.append(["WHO comparison", "HAZ"])
    main = workbook.create_sheet("Main")
    main.append(
        [
            "name",
            "gender",
            "region",
            "age_total_months",
            "height",
            "weight",
            "chest",
            "waist",
            "head",
        ]
    )
    sheet, mapping = resolve(workbook)
    assert sheet == main
    assert mapping[3] == "age_total_months"


def test_template_never_imports_example_sheet_when_it_was_left_active():
    workbook = build_admin_import_template_workbook({})
    workbook.active = workbook.sheetnames.index("Намуна")
    assert resolve(workbook)[0].title == "Маълумотлар"


def test_duplicate_headers_are_rejected_instead_of_overwriting_values():
    workbook = build_admin_import_template_workbook({})
    workbook.remove(workbook["Намуна"])
    workbook.active.cell(1, workbook.active.max_column + 1, "height")
    with pytest.raises(HTTPException) as error:
        resolve(workbook)
    assert "Takrorlangan ustunlar: height" in error.value.detail


def test_exact_months_survive_patient_validation_and_legacy_conversion():
    patient = PatientData(
        ageTotalMonths=47.788501,
        firstName="Test",
        lastName="Subject",
        region="Toshkent",
        gender="erkak",
        height=101.12,
        weight=13.48,
        chest=52,
        head=49,
        examinationDate="2026-01-01",
        consentConfirmed=True,
        consentGuardianName="Guardian",
    )
    assert patient.age == 3
    assert patient.age_months == 11
    assert total_age_months(patient) == 47.788501
    legacy = SimpleNamespace(age=3, age_months=11, age_days=24)
    assert total_age_months(legacy) == 47 + 24 / 30.4375


@pytest.mark.parametrize("value", ["WHO2006", -1, float("inf"), float("nan"), True])
def test_invalid_month_values_are_rejected(value):
    with pytest.raises(ValueError):
        split_age_months(value)


def test_total_months_migration_preserves_existing_years_and_is_repeatable():
    import importlib.util
    from pathlib import Path

    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    from sqlalchemy import create_engine, text

    path = (
        Path(__file__).resolve().parents[1]
        / "alembic/versions/20261031_1500_e72e10b2c5d1_patient_total_age_months.py"
    )
    spec = importlib.util.spec_from_file_location("total_months_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    with create_engine("sqlite:///:memory:").begin() as connection:
        connection.execute(
            text("CREATE TABLE patient_analysis (id INTEGER PRIMARY KEY, age INTEGER)")
        )
        connection.execute(text("INSERT INTO patient_analysis VALUES (1, 3)"))
        module.op = Operations(MigrationContext.configure(connection))
        module.upgrade()
        module.upgrade()
        assert connection.execute(
            text("SELECT age, age_total_months FROM patient_analysis")
        ).one() == (3, None)


@pytest.mark.asyncio
async def test_months_import_roundtrips_through_database_without_changing_unit(
    monkeypatch,
):
    from io import BytesIO

    from fastapi import UploadFile
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    from models.base import Base
    from models.user import User
    from models.userdata import PatientAnalysis
    from routers import admin_router

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    monkeypatch.setattr(admin_router, "get_child_privacy_enabled", lambda *args: False)
    monkeypatch.setattr(
        admin_router, "get_effective_admin_permissions", lambda *args: {}
    )
    monkeypatch.setattr(admin_router, "invalidate_admin_stats_cache", lambda: None)
    monkeypatch.setattr(
        admin_router.clinical_service, "get_all_settings", lambda *args: {}
    )
    workbook = Workbook()
    workbook.active.title = "WHO comparison"
    workbook.active.append(["WHO", "HAZ"])
    main = workbook.create_sheet("Main")
    main.append(
        [
            "name",
            "gender",
            "region",
            "age_total_months",
            "height",
            "weight",
            "chest",
            "waist",
            "head",
            "ffm_measured_kg",
        ]
    )
    main.append(
        ["Test Subject", "male", "Toshkent", 47.788501, 101.12, 13.48, 52, 50, 49, 12.1]
    )
    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    with Session(engine) as db:
        admin = User(name="Admin", email="months@example.com", role="admin")
        db.add(admin)
        db.flush()
        result = await admin_router.import_analyses_xlsx(
            file=UploadFile(filename="months.xlsx", file=buffer),
            db=db,
            current_user=admin,
        )
        assert result["errors"] == []
        assert result["source_sheet"] == "Main"
        assert result["imported"] == 1
        stored = db.query(PatientAnalysis).one()
        assert stored.age == 3
        assert stored.age_months == 11
        assert stored.age_total_months == 47.788501
        assert stored.body_composition_raw["ffm_measured_kg"] == 12.1
        assert (
            admin_router.build_patient_data_from_analysis(stored).age_total_months
            == 47.788501
        )
        import inspect

        from openpyxl import load_workbook

        filters = {
            name: None
            for name in inspect.signature(admin_router.export_analyses_xlsx).parameters
            if name not in {"db", "current_user", "lang"}
        }
        response = admin_router.export_analyses_xlsx(
            db=db, current_user=admin, lang="en", **filters
        )
        contents = b"".join([chunk async for chunk in response.body_iterator])
        exported = load_workbook(BytesIO(contents), data_only=True)
        sheet = exported.worksheets[0]
        age_column = [cell.value for cell in sheet[1]].index("Age (months)") + 1
        assert sheet.cell(2, age_column).value == 47.788501
        assert sheet.cell(2, age_column).data_type == "n"
