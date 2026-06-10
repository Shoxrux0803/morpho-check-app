import os
import sqlite3

db_path = "d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"


def run_migration():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. Skipping.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Starting migration...")

    # 1. Rename user_analysis to patient_analysis if it exists
    try:
        cursor.execute("ALTER TABLE user_analysis RENAME TO patient_analysis")
        print("Renamed table user_analysis to patient_analysis")
    except sqlite3.OperationalError as e:
        if "no such table" in str(e).lower():
            print("Table user_analysis not found (maybe already renamed).")
        else:
            print(f"Error renaming table: {e}")

    # 2. Create indexes for patient_analysis
    indexes = [
        ("idx_patient_created_at", "patient_analysis", "created_at"),
        ("idx_patient_name", "patient_analysis", "name"),
        ("idx_patient_id_code", "patient_analysis", "id_code"),
        ("idx_patient_region", "patient_analysis", "region"),
        ("idx_patient_district", "patient_analysis", "district"),
        ("idx_patient_age", "patient_analysis", "age"),
        ("idx_patient_gender", "patient_analysis", "gender"),
        # users
        ("idx_user_role", "users", "role"),
        ("idx_user_region", "users", "region"),
        # payments
        ("idx_payment_user_id", "payments", "user_id"),
        ("idx_payment_status", "payments", "status"),
    ]

    for idx_name, table, col in indexes:
        try:
            cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({col})")
            print(f"Ensured index {idx_name} on {table}({col})")
        except sqlite3.OperationalError as e:
            print(f"Error creating index {idx_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed successfully.")


if __name__ == "__main__":
    run_migration()
