#!/usr/bin/env python3
"""
migrate_sqlite_to_postgres.py
=================================
SQLite bazasidagi barcha ma'lumotlarni PostgreSQL ga ko'chiradi.

Ishlatish:
    # 1. PostgreSQL ishlab turganiga ishonch hosil qiling (Docker yoki local)
    # 2. Skriptni morphocheck_backend papkasidan ishgating:

    cd morphocheck_backend
    python scripts/migrate_sqlite_to_postgres.py

    # Yoki maxsus yo'llar bilan:
    python scripts/migrate_sqlite_to_postgres.py \
        --sqlite ./morphocheck.db \
        --pg "postgresql+psycopg2://morpho:morpho_secret_2024@localhost:5432/morphocheck"

Muhim:
    - Migratsiya idempotent: qayta ishlatsa, mavjud qatorlar qayta kiritilmaydi
    - SEQUENCE (auto-increment) lari to'g'ri yangilanadi
    - NULL qiymatlar saqlanadi
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

# Loyiha papkasiga yo'l
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# .env ni yuklash
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from sqlalchemy import create_engine, inspect, text

# ─── Jadval tartibi (FK bog'liqlik bo'yicha) ───────────────────────────────
# users birinchi — boshqalar unga referens qiladi
TABLE_ORDER = [
    "users",
    "patient_analysis",
    "research_records",
    "chat_messages",
    "audit_logs",
    "payments",
    "clinical_settings",
    "login_verification_codes",
    "trusted_login_devices",
]

# ─── NULL → FALSE konvertatsiya (PostgreSQL BOOLEAN kolonlar uchun) ─────────
BOOLEAN_COLUMNS: dict[str, list[str]] = {
    # jadval_nomi: [ustun_nomlari]
    "chat_messages": ["is_read"],
}

# ─── Asosiy migratsiya ─────────────────────────────────────────────────────


def get_tables_in_sqlite(sqlite_engine) -> list[str]:
    """SQLite dagi barcha jadvallarni qaytaradi."""
    inspector = inspect(sqlite_engine)
    return inspector.get_table_names()


def get_column_names(engine, table_name: str) -> list[str]:
    """Jadvalning barcha ustun nomlarini qaytaradi."""
    inspector = inspect(engine)
    return [col["name"] for col in inspector.get_columns(table_name)]


def migrate_table(
    table_name: str,
    sqlite_engine,
    pg_engine,
    batch_size: int = 500,
    verbose: bool = True,
):
    """Bitta jadval ma'lumotlarini SQLite → PostgreSQL ga ko'chiradi."""
    # SQLite dagi jadval mavjudligini tekshirish
    sqlite_tables = get_tables_in_sqlite(sqlite_engine)
    if table_name not in sqlite_tables:
        if verbose:
            print(f"  ⚠️  '{table_name}' SQLite da yo'q — o'tkazildi")
        return 0

    # PostgreSQL dagi jadval mavjudligini tekshirish
    pg_inspector = inspect(pg_engine)
    pg_tables = pg_inspector.get_table_names()
    if table_name not in pg_tables:
        if verbose:
            print(
                f"  ⚠️  '{table_name}' PostgreSQL da yo'q — avval jadvallarni yarating (init_db)"
            )
        return 0

    # Ustunlar kesishmasini topish (ikkalasida ham mavjud bo'lganlar)
    sqlite_cols = set(get_column_names(sqlite_engine, table_name))
    pg_cols = set(get_column_names(pg_engine, table_name))
    common_cols = list(sqlite_cols & pg_cols)

    if not common_cols:
        if verbose:
            print(f"  ❌  '{table_name}' — umumiy ustun topilmadi")
        return 0

    # Boolean ustunlar (SQLite da 0/1, PostgreSQL da True/False)
    bool_cols = set(BOOLEAN_COLUMNS.get(table_name, []))

    if verbose:
        print(f"\n📋  Jadval: {table_name}")
        print(f"   Ustunlar: {len(common_cols)} ta")

    with sqlite_engine.connect() as sqlite_conn:
        # Jami qatorlar soni
        total = (
            sqlite_conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            or 0
        )

        if verbose:
            print(f"   SQLite qatorlar: {total}")

        if total == 0:
            if verbose:
                print("   ✅  Bo'sh jadval — o'tkazildi")
            return 0

        cols_sql = ", ".join(f'"{c}"' for c in common_cols)
        placeholders = ", ".join(f":{c}" for c in common_cols)
        insert_sql = text(
            f"INSERT INTO {table_name} ({cols_sql}) VALUES ({placeholders}) "
            f"ON CONFLICT DO NOTHING"
        )

        migrated = 0
        offset = 0

        while True:
            rows = sqlite_conn.execute(
                text(
                    f"SELECT {cols_sql} FROM {table_name} LIMIT {batch_size} OFFSET {offset}"
                )
            ).fetchall()

            if not rows:
                break

            batch = []
            for row in rows:
                record = dict(zip(common_cols, row))
                # Boolean konvertatsiya
                for bc in bool_cols:
                    if bc in record and record[bc] is not None:
                        record[bc] = bool(record[bc])
                # None qiymatlarni tozalash (NULL saqlash)
                batch.append(record)

            with pg_engine.begin() as pg_conn:
                pg_conn.execute(insert_sql, batch)

            migrated += len(batch)
            offset += batch_size

            if verbose:
                print(f"   ⬆️  {migrated}/{total} qator ko'chirildi...", end="\r")

        if verbose:
            print(f"   ✅  {migrated} qator muvaffaqiyatli ko'chirildi{' ' * 20}")

    return migrated


def reset_sequences(pg_engine, verbose: bool = True):
    """PostgreSQL SEQUENCE larini jadval ma'lumotlari asosida yangilaydi.
    Aks holda yangi qo'shilganda PK conflict bo'ladi.
    """
    if verbose:
        print("\n🔄  PostgreSQL sequence larni yangilash...")

    with pg_engine.begin() as conn:
        # Barcha seriya (SERIAL / BIGSERIAL) ustunlarni topish
        result = conn.execute(
            text("""
            SELECT
                t.table_name,
                c.column_name,
                pg_get_serial_sequence(t.table_name, c.column_name) AS seq_name
            FROM information_schema.tables t
            JOIN information_schema.columns c
                ON t.table_name = c.table_name
                AND t.table_schema = c.table_schema
            WHERE t.table_schema = 'public'
              AND t.table_type = 'BASE TABLE'
              AND c.column_default LIKE 'nextval%'
        """)
        ).fetchall()

        for table_name, column_name, seq_name in result:
            if not seq_name:
                continue
            try:
                conn.execute(
                    text(
                        f"SELECT setval('{seq_name}', "
                        f"COALESCE((SELECT MAX({column_name}) FROM {table_name}), 0) + 1, false)"
                    )
                )
                if verbose:
                    print(f"   ✅  {table_name}.{column_name} sequence yangilandi")
            except Exception as e:
                print(f"   ⚠️  {table_name}.{column_name}: {e}")


def verify_migration(sqlite_engine, pg_engine, verbose: bool = True):
    """Migratsiya to'g'riligini tekshiradi (qatorlar soni taqqoslash)."""
    if verbose:
        print("\n🔍  Tekshirish...")

    sqlite_tables = get_tables_in_sqlite(sqlite_engine)
    pg_inspector = inspect(pg_engine)
    pg_tables = set(pg_inspector.get_table_names())

    all_ok = True
    with sqlite_engine.connect() as sc, pg_engine.connect() as pc:
        for table in TABLE_ORDER:
            if table not in sqlite_tables:
                continue
            if table not in pg_tables:
                print(f"   ❌  {table}: PostgreSQL da yo'q!")
                all_ok = False
                continue

            s_count = sc.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0
            p_count = pc.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() or 0

            status = "✅" if s_count == p_count else "⚠️ "
            if s_count != p_count:
                all_ok = False
            if verbose:
                print(f"   {status}  {table}: SQLite={s_count}, PostgreSQL={p_count}")

    return all_ok


def main():
    parser = argparse.ArgumentParser(
        description="SQLite → PostgreSQL ma'lumotlar migratsiyasi"
    )
    parser.add_argument(
        "--sqlite",
        default=str(ROOT / "morphocheck_backend" / "morphocheck.db"),
        help="SQLite fayl yo'li (default: morphocheck_backend/morphocheck.db)",
    )
    parser.add_argument(
        "--pg",
        default=os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://morpho:morpho_secret_2024@localhost:5432/morphocheck",
        ),
        help="PostgreSQL URL (default: .env dagi DATABASE_URL)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=500,
        help="Har bir o'tishda nechta qator (default: 500)",
    )
    parser.add_argument(
        "--no-verify",
        action="store_true",
        help="Tekshirishni o'tkazib yuborish",
    )
    parser.add_argument(
        "--tables",
        nargs="*",
        help="Faqat shu jadvallarni ko'chirish (bo'sh = hammasi)",
    )
    args = parser.parse_args()

    # postgres:// → postgresql+psycopg2://
    pg_url = args.pg
    if pg_url.startswith("postgres://"):
        pg_url = pg_url.replace("postgres://", "postgresql+psycopg2://", 1)

    # SQLite yo'li
    sqlite_path = Path(args.sqlite)
    if not sqlite_path.exists():
        # morphocheck_backend ichida ham qidirish
        alt = ROOT / "morphocheck_backend" / "morphocheck.db"
        if alt.exists():
            sqlite_path = alt
        else:
            print(f"❌  SQLite fayl topilmadi: {sqlite_path}")
            sys.exit(1)

    print("=" * 60)
    print("  MorphoCheck: SQLite → PostgreSQL Migratsiya")
    print("=" * 60)
    print(f"  SQLite:     {sqlite_path}")
    print(f"  PostgreSQL: {pg_url}")
    print(f"  Batch size: {args.batch}")
    print("=" * 60)

    # Engine yaratish
    sqlite_engine = create_engine(
        f"sqlite:///{sqlite_path}",
        connect_args={"check_same_thread": False},
    )
    pg_engine = create_engine(
        pg_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )

    # Ulanishni tekshirish
    print("\n🔌  PostgreSQL ulanishni tekshirish...")
    try:
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("   ✅  PostgreSQL ga ulandi")
    except Exception as e:
        print(f"   ❌  PostgreSQL ga ulanib bo'lmadi: {e}")
        print("   💡  Docker ishlab turganini tekshiring: docker-compose up -d db")
        sys.exit(1)

    # Jadvallar yaratish (SQLAlchemy models orqali)
    print("\n🏗️   PostgreSQL da jadvallar yaratish...")
    try:
        from models.base import Base

        Base.metadata.create_all(bind=pg_engine)
        print("   ✅  Jadvallar tayyor")
    except Exception as e:
        print(f"   ⚠️  Jadval yaratishda xatolik: {e}")
        print(
            "   💡  Backend avval ishga tushirilgan bo'lsa, jadvallar allaqachon mavjud"
        )

    # Ko'chirish
    tables_to_migrate = args.tables if args.tables else TABLE_ORDER
    print(f"\n🚀  Ko'chirish boshlandi ({len(tables_to_migrate)} jadval)...")

    start_time = datetime.now()
    total_migrated = 0

    for table in tables_to_migrate:
        try:
            count = migrate_table(
                table_name=table,
                sqlite_engine=sqlite_engine,
                pg_engine=pg_engine,
                batch_size=args.batch,
            )
            total_migrated += count
        except Exception as e:
            print(f"\n  ❌  {table} ko'chirishda xatolik: {e}")
            import traceback

            traceback.print_exc()

    # Sequence yangilash
    try:
        reset_sequences(pg_engine)
    except Exception as e:
        print(f"⚠️  Sequence yangilashda xatolik: {e}")

    # Tekshirish
    if not args.no_verify:
        all_ok = verify_migration(sqlite_engine, pg_engine)

    elapsed = (datetime.now() - start_time).total_seconds()

    print("\n" + "=" * 60)
    print("  ✅  Migratsiya yakunlandi!")
    print(f"  Jami ko'chirilgan: {total_migrated} qator")
    print(f"  Vaqt: {elapsed:.1f} sekund")
    print("=" * 60)
    print("\n🎉  Endi backend ni PostgreSQL bilan ishga tushiring:")
    print("     docker-compose up -d")
    print("     yoki: DATABASE_URL=postgresql+psycopg2://... uvicorn main:app")


if __name__ == "__main__":
    main()
