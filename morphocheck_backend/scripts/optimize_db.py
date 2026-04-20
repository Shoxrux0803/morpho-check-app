import sqlite3
import os

def optimize_database():
    db_path = "morphocheck.db"
    
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Adding indexes to research_records...")
        # ResearchRecord indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_full_name ON research_records (full_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_school_name ON research_records (school_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_settlement ON research_records (settlement)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_birth_date ON research_records (birth_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_examination_date ON research_records (examination_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_records_is_deleted ON research_records (is_deleted)")

        print("Adding indexes to patient_analysis...")
        # PatientAnalysis indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_patient_analysis_is_deleted ON patient_analysis (is_deleted)")

        # Optional: Index on User activity if searched
        # cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_name ON users (name)")

        print("Committing changes...")
        conn.commit()

        print("Running VACUUM (this might take a moment)...")
        conn.execute("VACUUM")

        print("Running ANALYZE...")
        conn.execute("ANALYZE")

        print("Database optimization completed successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    optimize_database()
