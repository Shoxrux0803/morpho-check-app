from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models.base import Base
from models.user import User
from models.userdata import ResearchRecord
from routers import research_router


def _list_records(db, user, *, paginated):
    return research_router.list_research_records(
        search=None,
        full_name=None,
        school_name=None,
        settlement=None,
        feeding_type=None,
        parents_marriage=None,
        weight_min=None,
        weight_max=None,
        height_min=None,
        height_max=None,
        researcher_id=None,
        date_from=None,
        date_to=None,
        gender=None,
        age_min=None,
        age_max=None,
        page=1,
        page_size=20,
        paginated=paginated,
        all_ids=False,
        include_export_values=False,
        lang="uz",
        db=db,
        current_user=user,
    )


def test_unpaginated_research_list_returns_complete_dataset(monkeypatch):
    monkeypatch.setattr(
        research_router,
        "get_child_privacy_enabled",
        lambda *_args, **_kwargs: False,
    )
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(
        engine,
        tables=[User.__table__, ResearchRecord.__table__],
    )

    with Session(engine) as db:
        researcher = User(
            name="Researcher",
            email="researcher@example.com",
            role="researcher",
        )
        db.add(researcher)
        db.flush()
        db.add_all(
            ResearchRecord(
                id_code=f"MC-TST-{index:04d}",
                full_name=f"Participant {index}",
                gender="erkak" if index % 2 else "ayol",
                chest_standing_height=120 + index,
                weight=20 + index,
                created_by_id=researcher.id,
                is_deleted=0,
            )
            for index in range(1, 26)
        )
        db.commit()

        complete = _list_records(db, researcher, paginated=False)
        first_page = _list_records(db, researcher, paginated=True)

        assert len(complete) == 25
        assert first_page["total"] == 25
        assert len(first_page["items"]) == 20

