import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models.base import Base
from models.user import User
from models.userdata import ResearchRecord
from routers.research_router import get_research_timeline
from services.measurement_provenance import input_sources


@pytest.fixture
def timeline_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        owner = User(id=1, name="Owner", email="owner@example.test", hashed_password="unused", role="researcher")
        other = User(id=2, name="Other", email="other@example.test", hashed_password="unused", role="researcher")
        db.add_all([owner, other])
        db.flush()
        db.add_all([
            ResearchRecord(id=1, created_by_id=1, subject_code="MC-001", examination_date="2026-01-01", chest_standing_height=130, weight=30),
            ResearchRecord(id=2, created_by_id=1, subject_code="MC-001", examination_date="2026-03-01", chest_standing_height=132, weight=31),
            ResearchRecord(id=3, created_by_id=2, subject_code="MC-001", examination_date="2026-02-01", chest_standing_height=160, weight=50),
            ResearchRecord(id=4, created_by_id=1, subject_code="MC-001", is_deleted=1),
            ResearchRecord(id=5, created_by_id=1),
        ])
        db.commit()
        yield db, owner, other
    engine.dispose()


def test_timeline_uses_stable_code_and_excludes_other_owners_and_deleted(timeline_db):
    db, owner, _ = timeline_db
    timeline = get_research_timeline(1, db, owner)
    assert timeline["total"] == 2
    assert [visit["id"] for visit in timeline["visits"]] == [1, 2]
    assert timeline["visits"][0]["height"] == 130
    assert len(get_research_timeline(5, db, owner)["visits"]) == 1


def test_timeline_requires_permission_for_anchor_record(timeline_db):
    db, _, other = timeline_db
    with pytest.raises(HTTPException) as error:
        get_research_timeline(1, db, other)
    assert error.value.status_code == 403


def test_provenance_keeps_input_fields_separate_from_identity():
    record = ResearchRecord()
    assert input_sources(record, {"weight": 30, "chest_standing_height": 130, "created_by_id": 1, "full_name": "Child", "waist_circumference": None}, "imported") == {"weight": "imported", "chest_standing_height": "imported"}


@pytest.mark.asyncio
async def test_export_preserves_filters_units_and_value_sources(timeline_db):
    import inspect
    import io
    from openpyxl import load_workbook
    from routers.research_router import export_research_xlsx

    db, owner, _ = timeline_db
    record = db.get(ResearchRecord, 1)
    record.measurement_sources = {"weight": "imported", "chest_standing_height": "measured"}
    db.commit()
    filters = {key: None for key in inspect.signature(export_research_xlsx).parameters if key not in {"db", "current_user", "lang"}}
    response = export_research_xlsx(**filters, lang="en", db=db, current_user=owner)
    content = b"".join([chunk async for chunk in response.body_iterator])
    workbook = load_workbook(io.BytesIO(content), data_only=True)
    metadata = dict(workbook["Metadata"].values)
    assert metadata["Record count"] == 3
    assert metadata["Index reference version"] == "DSC_2038_HMAI_MII_ADI_MCRI_v6"
    assert "cm" in metadata["Raw units"]
    sources = list(workbook["Value sources"].values)
    assert (1, "weight", "imported") in sources
    assert (1, "chest_standing_height", "measured") in sources
