import os
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "morphocheck.db"

INDEXES = [
    ("patient_analysis", "ix_patient_analysis_is_deleted", ("is_deleted",)),
    ("patient_analysis", "ix_patient_analysis_created_by_id", ("created_by_id",)),
    ("patient_analysis", "ix_patient_analysis_deleted_created", ("is_deleted", "created_at")),
    ("patient_analysis", "ix_patient_analysis_owner_active_created", ("created_by_id", "is_deleted", "created_at")),
    ("patient_analysis", "ix_patient_analysis_deleted_deleted_at", ("is_deleted", "deleted_at")),
    ("patient_analysis", "ix_patient_analysis_region_active_created", ("region", "is_deleted", "created_at")),
    ("patient_analysis", "ix_patient_analysis_gender_age_active", ("gender", "age", "is_deleted")),
    ("patient_analysis", "ix_patient_analysis_child_history", ("name", "birth_date", "gender", "is_deleted", "created_at")),
    ("research_records", "ix_research_records_deleted_created", ("is_deleted", "created_at")),
    ("research_records", "ix_research_records_owner_active_id", ("created_by_id", "is_deleted", "id")),
    ("research_records", "ix_research_records_active_exam_id", ("is_deleted", "examination_date", "id")),
    ("research_records", "ix_research_records_owner_exam", ("created_by_id", "examination_date")),
    ("research_records", "ix_research_records_gender_active", ("gender", "is_deleted")),
    ("research_records", "ix_research_records_feeding_active", ("feeding_type", "is_deleted")),
    ("research_records", "ix_research_records_marriage_active", ("parents_marriage", "is_deleted")),
    ("chat_messages", "ix_chat_messages_sender_recipient_created", ("sender_id", "recipient_id", "created_at")),
    ("chat_messages", "ix_chat_messages_recipient_sender_read", ("recipient_id", "sender_id", "is_read")),
    ("chat_messages", "ix_chat_messages_type_created", ("message_type", "created_at")),
    ("audit_logs", "ix_audit_logs_action_created", ("action", "created_at")),
    ("audit_logs", "ix_audit_logs_user_created", ("user_id", "created_at")),
    ("audit_logs", "ix_audit_logs_target", ("target_type", "target_id")),
    ("payments", "ix_payments_user_created", ("user_id", "created_at")),
    ("payments", "ix_payments_status_created", ("status", "created_at")),
    ("users", "ix_users_role_active", ("role", "is_deleted")),
    ("users", "ix_users_deleted_deleted_at", ("is_deleted", "deleted_at")),
]

LEGACY_DUPLICATE_INDEXES = [
    "idx_patient_gender",
    "idx_patient_age",
    "idx_patient_district",
    "idx_patient_id_code",
    "idx_patient_name",
    "idx_patient_created_at",
    "ix_patient_analysis_id",
    "ix_users_id",
    "ix_audit_logs_id",
    "ix_payments_id",
    "ix_ratings_id",
    "ix_clinical_settings_id",
]


def table_columns(cursor: sqlite3.Cursor, table_name: str) -> set[str]:
    return {row[1] for row in cursor.execute(f"PRAGMA table_info('{table_name}')").fetchall()}


def optimize(db_path: Path = DB_PATH) -> None:
    if not db_path.exists():
        raise FileNotFoundError(f"Baza topilmadi: {db_path}")

    backup_path = db_path.with_suffix(f".db.bak_{os.getpid()}")
    backup_path.write_bytes(db_path.read_bytes())
    print(f"Backup yaratildi: {backup_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.execute("PRAGMA busy_timeout=5000")

        tables = {
            row[0]
            for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        }
        for table_name, index_name, columns in INDEXES:
            if table_name not in tables:
                continue
            if not set(columns).issubset(table_columns(cursor, table_name)):
                continue
            column_sql = ", ".join(columns)
            cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column_sql})")
            print(f"Index tayyor: {index_name}")

        for table_name in ("patient_analysis", "research_records", "users"):
            if table_name in tables and "is_deleted" in table_columns(cursor, table_name):
                cursor.execute(f"UPDATE {table_name} SET is_deleted = 0 WHERE is_deleted IS NULL")

        for index_name in LEGACY_DUPLICATE_INDEXES:
            cursor.execute(f"DROP INDEX IF EXISTS {index_name}")

        cursor.execute("ANALYZE")
        conn.commit()
        cursor.execute("VACUUM")

        integrity = cursor.execute("PRAGMA integrity_check").fetchone()[0]
        fk_errors = cursor.execute("PRAGMA foreign_key_check").fetchall()
        if integrity != "ok" or fk_errors:
            raise RuntimeError(f"DB tekshiruvdan o'tmadi: integrity={integrity}, fk_errors={fk_errors[:10]}")

        conn.commit()
        print("Database optimization completed successfully.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    optimize()
