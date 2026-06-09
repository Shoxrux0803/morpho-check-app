# utils/timescale.py
"""
TimescaleDB yordamchi funksiyalar.
Hypertable mavjudligini tekshirish, continuous aggregate refresh va boshqalar.
"""
import logging
from typing import Optional
from sqlalchemy import text
from utils.database import engine

logger = logging.getLogger(__name__)


def is_timescaledb_available() -> bool:
    """TimescaleDB extension o'rnatilganligini tekshiradi."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT COUNT(*) FROM pg_extension WHERE extname = 'timescaledb'"
            )).scalar()
            return bool(result)
    except Exception:
        return False


def get_hypertables() -> list[str]:
    """Mavjud hypertablelar ro'yxatini qaytaradi."""
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(
                "SELECT hypertable_name FROM timescaledb_information.hypertables "
                "ORDER BY hypertable_name"
            )).fetchall()
            return [r[0] for r in rows]
    except Exception as e:
        logger.debug("get_hypertables xatosi: %s", e)
        return []


def ensure_hypertables():
    """
    Agar TimescaleDB mavjud bo'lsa, jadvallarni hypertable ga aylantiradi.
    Bu funksiya startup da chaqiriladi.
    Idempotent — qayta-qayta chaqirish xavfsiz.
    """
    if engine.dialect.name != "postgresql":
        logger.debug("TimescaleDB faqat PostgreSQL da ishlaydi.")
        return

    if not is_timescaledb_available():
        logger.info("TimescaleDB extension yo'q — standart PostgreSQL da ishlaydi.")
        return

    tables = [
        ("patient_analysis", "created_at"),
        ("research_records", "created_at"),
        ("audit_logs", "created_at"),
    ]

    existing_hypertables = set(get_hypertables())

    with engine.begin() as conn:
        for table_name, time_column in tables:
            if table_name in existing_hypertables:
                logger.debug("%s allaqachon hypertable", table_name)
                continue

            try:
                # Jadval mavjudligini tekshirish
                exists = conn.execute(text(
                    f"SELECT COUNT(*) FROM information_schema.tables "
                    f"WHERE table_schema='public' AND table_name='{table_name}'"
                )).scalar()

                if not exists:
                    logger.debug("%s jadvali hali yaratilmagan", table_name)
                    continue

                conn.execute(text(
                    f"SELECT create_hypertable('{table_name}', '{time_column}', "
                    f"if_not_exists => TRUE, migrate_data => TRUE)"
                ))
                logger.info("✅ %s → hypertable (column: %s)", table_name, time_column)

            except Exception as e:
                logger.warning("⚠️ %s hypertable xatosi: %s", table_name, e)


def get_timescale_stats() -> dict:
    """TimescaleDB statistikasini qaytaradi (dashboard uchun)."""
    if not is_timescaledb_available():
        return {"available": False}

    try:
        with engine.connect() as conn:
            # Jami chunklar soni
            chunks = conn.execute(text(
                "SELECT COUNT(*) FROM timescaledb_information.chunks"
            )).scalar() or 0

            # Hypertablelar
            hypertables = conn.execute(text(
                "SELECT hypertable_name, num_chunks, compression_enabled "
                "FROM timescaledb_information.hypertables"
            )).fetchall()

            # Disk hajmi
            size_info = conn.execute(text(
                "SELECT hypertable_name, "
                "pg_size_pretty(hypertable_size(format('%I', hypertable_name)::regclass)) AS size "
                "FROM timescaledb_information.hypertables"
            )).fetchall()

            return {
                "available": True,
                "total_chunks": int(chunks),
                "hypertables": [
                    {
                        "name": r[0],
                        "num_chunks": r[1],
                        "compression_enabled": r[2],
                    }
                    for r in hypertables
                ],
                "sizes": {r[0]: r[1] for r in size_info},
            }
    except Exception as e:
        logger.warning("get_timescale_stats xatosi: %s", e)
        return {"available": True, "error": str(e)}
