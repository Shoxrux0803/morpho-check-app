from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models.base import Base
from models.payment import Payment
from models.user import User
from models.userdata import PatientAnalysis
from routers.admin_router import stats


def _analysis(owner_id, index, bmi, created_at):
    return PatientAnalysis(
        id_code=f"MC-TST-{index:04d}",
        name=f"Patient {index}",
        region="Toshkent",
        district="Yunusobod",
        gender="erkak" if index % 2 else "ayol",
        age=5 + index,
        height=120 + index,
        weight=25 + index,
        chest=60,
        waist=55,
        hip=60,
        head=50,
        bmi=bmi,
        z_score=0,
        somatotype=(
            "Endomorph" if index % 3 == 0 else "Ectomorph" if index % 3 == 1 else "Mesomorph"
        ),
        recommendations="Test",
        created_by_id=owner_id,
        created_at=created_at,
        is_deleted=0,
    )


def _stats(db, user, dashboard_mode="all"):
    return stats(
        db=db,
        current_user=user,
        q=None,
        gender=None,
        age_min=None,
        age_max=None,
        bmi_min=None,
        bmi_max=None,
        region=None,
        date_from=None,
        date_to=None,
        somatotype=None,
        dashboard_mode=dashboard_mode,
    )


def test_dashboard_stats_use_all_records_and_support_complete_modes():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(
        engine,
        tables=[User.__table__, Payment.__table__, PatientAnalysis.__table__],
    )

    with Session(engine) as db:
        admin = User(name="Admin", email="admin@example.com", role="admin")
        db.add(admin)
        db.flush()

        bmi_values = [20] * 8 + [17, 18, 27, 32]
        today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        for index, bmi in enumerate(bmi_values, start=1):
            db.add(
                _analysis(
                    admin.id,
                    index,
                    bmi,
                    today - timedelta(days=index % 3),
                )
            )
        db.commit()

        all_stats = _stats(db, admin)
        assert all_stats["total_analyses"] == 12
        assert sum(all_stats["dashboard_bmi_distribution"].values()) == 12
        assert sum(item["value"] for item in all_stats["dashboard_age_groups"]) == 12
        assert sum(all_stats["dashboard_somatotypes"].values()) == 12
        assert all_stats["avg_age"] > 0
        assert all_stats["daily_trend"]

        normal_stats = _stats(db, admin, dashboard_mode="normal")
        risk_stats = _stats(db, admin, dashboard_mode="risk")
        assert normal_stats["total_analyses"] == 8
        assert risk_stats["total_analyses"] == 4

