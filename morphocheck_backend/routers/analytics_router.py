# routers/analytics_router.py
"""
Analytics Dashboard API Router
/api/analytics/* — barcha endpoint lar
Faqat admin va superadmin uchun.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from utils.database import get_db
from models.user import User
from routers.auth_router import get_current_admin
from services.analytics_service import (
    get_dashboard_overview,
    get_bmi_distribution,
    get_trend_data,
    get_region_stats,
    get_somatotype_distribution,
    get_age_distribution,
)
from utils.timescale import get_timescale_stats, is_timescaledb_available

router = APIRouter(tags=["Analytics Dashboard"])


@router.get("/overview")
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Dashboard asosiy statistikasi:
    - Jami tahlillar, oy o'sishi
    - O'rtacha BMI, yosh, bo'y, vazn
    - Jins taqsimoti
    - Foydalanuvchilar (superadmin uchun)
    """
    return get_dashboard_overview(db, current_user)


@router.get("/bmi-distribution")
def bmi_distribution(
    gender: Optional[str] = Query(None, description="erkak | ayol"),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """BMI kategoriyalar bo'yicha taqsimot (ozgin, normal, ortiqcha, semizlik)."""
    return get_bmi_distribution(db, current_user, gender=gender, region=region)


@router.get("/trend")
def analysis_trend(
    period: str = Query("month", description="week | month | year"),
    metric: str = Query("count", description="count | bmi | age"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Vaqt bo'yicha tendensiya.
    ClickHouse mavjud bo'lsa — undan, aks holda PostgreSQL/TimescaleDB.
    """
    return {
        "period": period,
        "metric": metric,
        "data": get_trend_data(db, current_user, period=period, metric=metric),
    }


@router.get("/regions")
def region_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Viloyatlar bo'yicha statistika (xarita uchun)."""
    return get_region_stats(db, current_user)


@router.get("/somatotypes")
def somatotype_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Somatotip va jins bo'yicha taqsimot (donut chart uchun)."""
    return get_somatotype_distribution(db, current_user)


@router.get("/age-groups")
def age_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Yosh guruhlari bo'yicha taqsimot (0-3, 4-6, 7-10, 11-14, 15-17, 18+)."""
    return get_age_distribution(db, current_user)


@router.get("/system-info")
def system_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Tizim holati: TimescaleDB, ClickHouse mavjudligi.
    Faqat superadmin uchun to'liq ma'lumot.
    """
    from utils.clickhouse import clickhouse_available

    info = {
        "timescaledb": {
            "available": is_timescaledb_available(),
        },
        "clickhouse": {
            "available": clickhouse_available(),
        },
    }

    if current_user.role == "superadmin":
        if info["timescaledb"]["available"]:
            info["timescaledb"].update(get_timescale_stats())

    return info
