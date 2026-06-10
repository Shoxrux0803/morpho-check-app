# utils/clickhouse.py
"""
ClickHouse ulanish va yozish utility.
Analytics ma'lumotlarini PostgreSQL dan ClickHouse ga sinxronlash uchun.
"""

import logging
import os
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ClickHouse sozlamalari
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", "8123"))
CLICKHOUSE_DB = os.getenv("CLICKHOUSE_DB", "morphocheck_analytics")
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "morpho")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "morpho_click_2024")

_clickhouse_client = None


def get_clickhouse_client():
    """ClickHouse client ni lazy initialization bilan qaytaradi."""
    global _clickhouse_client
    if _clickhouse_client is not None:
        return _clickhouse_client

    try:
        from clickhouse_driver import Client

        _clickhouse_client = Client(
            host=CLICKHOUSE_HOST,
            port=9000,  # Native protocol
            database=CLICKHOUSE_DB,
            user=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
            connect_timeout=5,
            send_receive_timeout=30,
            settings={
                "use_numpy": False,
                "max_block_size": 10000,
            },
        )
        logger.info(
            "ClickHouse ga ulandi: %s:%s/%s", CLICKHOUSE_HOST, 9000, CLICKHOUSE_DB
        )
        return _clickhouse_client
    except ImportError:
        logger.warning(
            "clickhouse_driver o'rnatilmagan. ClickHouse analytics o'chirilgan."
        )
        return None
    except Exception as e:
        logger.warning("ClickHouse ulanish xatosi: %s", e)
        return None


def clickhouse_available() -> bool:
    """ClickHouse mavjudligini tekshiradi."""
    try:
        client = get_clickhouse_client()
        if client is None:
            return False
        client.execute("SELECT 1")
        return True
    except Exception:
        return False


def insert_analysis_event(record: dict) -> bool:
    """
    PatientAnalysis yozuvini ClickHouse ga yuboradi.
    Xato bo'lsa False qaytaradi — bu operatsiya ixtiyoriy.
    """
    try:
        client = get_clickhouse_client()
        if client is None:
            return False

        row = {
            "id": int(record.get("id", 0)),
            "created_at": _to_datetime(record.get("created_at")),
            "gender": str(record.get("gender") or ""),
            "age": int(record.get("age") or 0),
            "age_months": _safe_int(record.get("age_months")),
            "height": float(record.get("height") or 0),
            "weight": float(record.get("weight") or 0),
            "bmi": float(record.get("bmi") or 0),
            "z_score": float(record.get("z_score") or 0),
            "somatotype": str(record.get("somatotype") or ""),
            "region": str(record.get("region") or ""),
            "district": str(record.get("district") or ""),
            "is_deleted": int(record.get("is_deleted") or 0),
            "created_by_id": _safe_int(record.get("created_by_id")),
            "fat_percent": _safe_float(record.get("fat_percent")),
            "muscle_mass": _safe_float(record.get("muscle_mass")),
            "fat_mass": _safe_float(record.get("fat_mass")),
            "bone_mass": _safe_float(record.get("bone_mass")),
        }

        client.execute(
            f"INSERT INTO {CLICKHOUSE_DB}.patient_analysis_events VALUES",
            [row],
            types_check=True,
        )
        return True
    except Exception as e:
        logger.debug("ClickHouse insert_analysis_event xatosi: %s", e)
        return False


def insert_research_event(record: dict) -> bool:
    """ResearchRecord yozuvini ClickHouse ga yuboradi."""
    try:
        client = get_clickhouse_client()
        if client is None:
            return False

        row = {
            "id": int(record.get("id", 0)),
            "created_at": _to_datetime(record.get("created_at")),
            "gender": str(record.get("gender") or ""),
            "birth_date": str(record.get("birth_date") or ""),
            "region": str(record.get("region") or ""),
            "feeding_type": str(record.get("feeding_type") or ""),
            "parents_marriage": str(record.get("parents_marriage") or ""),
            "is_deleted": int(record.get("is_deleted") or 0),
            "created_by_id": _safe_int(record.get("created_by_id")),
        }

        client.execute(
            f"INSERT INTO {CLICKHOUSE_DB}.research_events VALUES",
            [row],
            types_check=True,
        )
        return True
    except Exception as e:
        logger.debug("ClickHouse insert_research_event xatosi: %s", e)
        return False


def insert_user_activity(record: dict) -> bool:
    """AuditLog yozuvini ClickHouse ga yuboradi."""
    try:
        client = get_clickhouse_client()
        if client is None:
            return False

        row = {
            "id": int(record.get("id", 0)),
            "user_id": int(record.get("user_id") or 0),
            "action": str(record.get("action") or ""),
            "target_type": str(record.get("target_type") or ""),
            "target_id": _safe_int(record.get("target_id")),
            "ip_address": str(record.get("ip_address") or ""),
            "created_at": _to_datetime(record.get("created_at")),
        }

        client.execute(
            f"INSERT INTO {CLICKHOUSE_DB}.user_activity VALUES",
            [row],
            types_check=True,
        )
        return True
    except Exception as e:
        logger.debug("ClickHouse insert_user_activity xatosi: %s", e)
        return False


def query_clickhouse(sql: str, params: dict | None = None) -> list[dict]:
    """ClickHouse dan so'rov bajaradi va dict ro'yxat qaytaradi."""
    try:
        client = get_clickhouse_client()
        if client is None:
            return []
        rows, cols = client.execute(sql, params or {}, with_column_types=True)
        col_names = [c[0] for c in cols]
        return [dict(zip(col_names, row)) for row in rows]
    except Exception as e:
        logger.warning("ClickHouse query xatosi: %s | SQL: %s", e, sql[:200])
        return []


# ─── Yordamchi funksiyalar ──────────────────────────────────────────────────


def _to_datetime(value) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            pass
    return datetime.utcnow()


def _safe_int(value) -> Optional[int]:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _safe_float(value) -> Optional[float]:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None
