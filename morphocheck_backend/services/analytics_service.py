# services/analytics_service.py
"""
Analytics Service — Ikki manbadan ma'lumot to'plash:
1. ClickHouse (mavjud bo'lsa) — tezkor OLAP so'rovlar
2. PostgreSQL / TimescaleDB (fallback) — har doim ishlaydi

Dashboard uchun statistika, tendensiyalar va somatotip taqsimoti.
"""
import logging
from datetime import datetime, date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, text, cast, Date

from models.userdata import PatientAnalysis, ResearchRecord
from models.user import User

logger = logging.getLogger(__name__)


def _try_clickhouse():
    """ClickHouse mavjudligini tekshiradi."""
    try:
        from utils.clickhouse import clickhouse_available, query_clickhouse
        if clickhouse_available():
            return query_clickhouse
        return None
    except Exception:
        return None


# ─── Dashboard Overview ──────────────────────────────────────────────────────

def get_dashboard_overview(db: Session, user: Optional[User] = None) -> dict:
    """
    Asosiy dashboard statistikasi.
    SuperAdmin — barcha ma'lumotlar.
    Admin — faqat o'zinikini.
    """
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    if user and user.role not in ("superadmin",):
        base = base.filter(PatientAnalysis.created_by_id == user.id)

    total = base.count()

    # Ushbu oy
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = base.filter(PatientAnalysis.created_at >= month_start).count()

    # O'tgan oy
    prev_month_end = month_start - timedelta(seconds=1)
    prev_month_start = prev_month_end.replace(day=1, hour=0, minute=0, second=0)
    last_month = base.filter(
        PatientAnalysis.created_at >= prev_month_start,
        PatientAnalysis.created_at <= prev_month_end
    ).count()

    # O'rtacha ko'rsatkichlar
    avgs = base.with_entities(
        func.avg(PatientAnalysis.bmi).label("avg_bmi"),
        func.avg(PatientAnalysis.age).label("avg_age"),
        func.avg(PatientAnalysis.height).label("avg_height"),
        func.avg(PatientAnalysis.weight).label("avg_weight"),
        func.avg(PatientAnalysis.z_score).label("avg_z_score"),
    ).first()

    # Jins taqsimoti
    gender_stats = base.with_entities(
        PatientAnalysis.gender,
        func.count(PatientAnalysis.id).label("count"),
    ).group_by(PatientAnalysis.gender).all()

    # Tadqiqot yozuvlari
    research_base = db.query(ResearchRecord).filter(ResearchRecord.is_deleted == 0)
    if user and user.role not in ("superadmin",):
        research_base = research_base.filter(ResearchRecord.created_by_id == user.id)
    total_research = research_base.count()

    # Foydalanuvchilar (faqat superadmin uchun)
    total_users = 0
    active_users = 0
    if not user or user.role == "superadmin":
        total_users = db.query(User).filter(User.is_deleted == 0).count()
        # 30 kun ichida faol
        since_30d = now - timedelta(days=30)
        active_users = db.query(User).filter(
            User.is_deleted == 0,
            User.last_active_at >= since_30d
        ).count()

    return {
        "total_analyses": total,
        "this_month": this_month,
        "last_month": last_month,
        "growth_percent": _growth(this_month, last_month),
        "total_research": total_research,
        "total_users": total_users,
        "active_users_30d": active_users,
        "averages": {
            "bmi": _round(avgs.avg_bmi),
            "age": _round(avgs.avg_age),
            "height": _round(avgs.avg_height),
            "weight": _round(avgs.avg_weight),
            "z_score": _round(avgs.avg_z_score),
        },
        "gender_distribution": {
            row.gender or "nomalum": row.count for row in gender_stats
        },
    }


# ─── BMI Taqsimoti ───────────────────────────────────────────────────────────

def get_bmi_distribution(
    db: Session,
    user: Optional[User] = None,
    gender: Optional[str] = None,
    region: Optional[str] = None,
) -> dict:
    """BMI kategoriyalar bo'yicha taqsimot."""
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    if user and user.role not in ("superadmin",):
        base = base.filter(PatientAnalysis.created_by_id == user.id)
    if gender:
        base = base.filter(func.lower(PatientAnalysis.gender) == gender.lower())
    if region:
        base = base.filter(PatientAnalysis.region == region)

    rows = base.with_entities(PatientAnalysis.bmi, PatientAnalysis.age).all()

    categories = {"ozgin": 0, "normal": 0, "ortiqcha": 0, "semizlik": 0, "nomalum": 0}
    for bmi, age in rows:
        if bmi is None:
            categories["nomalum"] += 1
        elif bmi < 18.5:
            categories["ozgin"] += 1
        elif bmi < 25:
            categories["normal"] += 1
        elif bmi < 30:
            categories["ortiqcha"] += 1
        else:
            categories["semizlik"] += 1

    total = sum(categories.values())
    return {
        "counts": categories,
        "percentages": {k: _pct(v, total) for k, v in categories.items()},
        "total": total,
    }


# ─── Vaqt Tendensiyasi ───────────────────────────────────────────────────────

def get_trend_data(
    db: Session,
    user: Optional[User] = None,
    period: str = "month",  # "week" | "month" | "year"
    metric: str = "count",  # "count" | "bmi" | "age"
) -> list[dict]:
    """
    Vaqt bo'yicha tendensiya.
    ClickHouse mavjud bo'lsa — undan foydalanadi.
    Fallback — PostgreSQL.
    """
    # ClickHouse urinish
    ch = _try_clickhouse()
    if ch is not None:
        return _trend_from_clickhouse(ch, period, metric)

    # PostgreSQL fallback
    return _trend_from_postgres(db, user, period, metric)


def _trend_from_postgres(
    db: Session,
    user: Optional[User],
    period: str,
    metric: str,
) -> list[dict]:
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    if user and user.role not in ("superadmin",):
        base = base.filter(PatientAnalysis.created_by_id == user.id)

    now = datetime.utcnow()
    if period == "week":
        since = now - timedelta(days=7)
        trunc = "day"
    elif period == "year":
        since = now - timedelta(days=365)
        trunc = "month"
    else:  # month
        since = now - timedelta(days=30)
        trunc = "day"

    base = base.filter(PatientAnalysis.created_at >= since)

    rows = base.with_entities(
        func.date_trunc(trunc, PatientAnalysis.created_at).label("bucket"),
        func.count(PatientAnalysis.id).label("count"),
        func.avg(PatientAnalysis.bmi).label("avg_bmi"),
        func.avg(PatientAnalysis.age).label("avg_age"),
    ).group_by("bucket").order_by("bucket").all()

    return [
        {
            "date": str(r.bucket)[:10] if r.bucket else None,
            "count": int(r.count or 0),
            "avg_bmi": _round(r.avg_bmi),
            "avg_age": _round(r.avg_age),
        }
        for r in rows
    ]


def _trend_from_clickhouse(ch_query, period: str, metric: str) -> list[dict]:
    """ClickHouse dan tendensiya ma'lumotlari."""
    if period == "week":
        interval = "toDate(created_at)"
        since = "now() - INTERVAL 7 DAY"
    elif period == "year":
        interval = "toStartOfMonth(created_at)"
        since = "now() - INTERVAL 365 DAY"
    else:
        interval = "toDate(created_at)"
        since = "now() - INTERVAL 30 DAY"

    rows = ch_query(f"""
        SELECT
            {interval} AS bucket,
            count() AS count,
            avg(bmi) AS avg_bmi,
            avg(age) AS avg_age
        FROM morphocheck_analytics.patient_analysis_events
        WHERE is_deleted = 0
          AND created_at >= {since}
        GROUP BY bucket
        ORDER BY bucket ASC
    """)
    return [
        {
            "date": str(r.get("bucket", ""))[:10],
            "count": int(r.get("count", 0)),
            "avg_bmi": _round(r.get("avg_bmi")),
            "avg_age": _round(r.get("avg_age")),
        }
        for r in rows
    ]


# ─── Viloyat Statistikasi ─────────────────────────────────────────────────────

def get_region_stats(db: Session, user: Optional[User] = None) -> list[dict]:
    """Viloyatlar bo'yicha statistika (xarita uchun)."""
    base = db.query(PatientAnalysis).filter(
        PatientAnalysis.is_deleted == 0,
        PatientAnalysis.region.isnot(None),
    )
    if user and user.role not in ("superadmin",):
        base = base.filter(PatientAnalysis.created_by_id == user.id)

    rows = base.with_entities(
        PatientAnalysis.region,
        func.count(PatientAnalysis.id).label("count"),
        func.avg(PatientAnalysis.bmi).label("avg_bmi"),
        func.avg(PatientAnalysis.z_score).label("avg_z_score"),
    ).group_by(PatientAnalysis.region).order_by(func.count(PatientAnalysis.id).desc()).all()

    return [
        {
            "region": r.region,
            "count": int(r.count or 0),
            "avg_bmi": _round(r.avg_bmi),
            "avg_z_score": _round(r.avg_z_score),
        }
        for r in rows
    ]


# ─── Somatotip Taqsimoti ─────────────────────────────────────────────────────

def get_somatotype_distribution(
    db: Session,
    user: Optional[User] = None,
) -> list[dict]:
    """Somatotip va jins bo'yicha taqsimot."""
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    if user and user.role not in ("superadmin",):
        base = base.filter(PatientAnalysis.created_by_id == user.id)

    rows = base.with_entities(
        PatientAnalysis.somatotype,
        PatientAnalysis.gender,
        func.count(PatientAnalysis.id).label("count"),
    ).group_by(PatientAnalysis.somatotype, PatientAnalysis.gender).all()

    return [
        {"somatotype": r.somatotype, "gender": r.gender, "count": int(r.count or 0)}
        for r in rows
        if r.somatotype
    ]


# ─── Age Distribution ─────────────────────────────────────────────────────────

def get_age_distribution(db: Session, user: Optional[User] = None) -> list[dict]:
    """Yosh guruhlari bo'yicha taqsimot."""
    base = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    if user and user.role not in ("superadmin",):
        base = base.filter(PatientAnalysis.created_by_id == user.id)

    rows = base.with_entities(PatientAnalysis.age, func.count().label("count")).group_by(
        PatientAnalysis.age
    ).order_by(PatientAnalysis.age).all()

    # Guruhlar: 0-3, 4-6, 7-10, 11-14, 15-17, 18+
    groups = {
        "0-3": 0, "4-6": 0, "7-10": 0, "11-14": 0, "15-17": 0, "18+": 0
    }
    for age, count in rows:
        if age is None:
            continue
        age = int(age)
        if age <= 3:
            groups["0-3"] += count
        elif age <= 6:
            groups["4-6"] += count
        elif age <= 10:
            groups["7-10"] += count
        elif age <= 14:
            groups["11-14"] += count
        elif age <= 17:
            groups["15-17"] += count
        else:
            groups["18+"] += count

    return [{"group": k, "count": v} for k, v in groups.items()]


# ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

def _round(value, ndigits: int = 2) -> Optional[float]:
    if value is None:
        return None
    try:
        return round(float(value), ndigits)
    except (TypeError, ValueError):
        return None


def _pct(part: int, total: int) -> float:
    if not total:
        return 0.0
    return round(part / total * 100, 1)


def _growth(current: int, previous: int) -> float:
    if not previous:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)
