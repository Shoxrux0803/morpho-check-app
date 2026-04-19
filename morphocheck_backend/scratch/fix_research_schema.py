import sqlite3
import os

DATABASE_PATH = r"d:\BOT\morpho-check-app\morphocheck_backend\morphocheck.db"

def fix_schema():
    if not os.path.exists(DATABASE_PATH):
        print(f"Database not found at {DATABASE_PATH}")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(research_records)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Add missing columns
    if "is_deleted" not in columns:
        print("Adding is_deleted column...")
        cursor.execute("ALTER TABLE research_records ADD COLUMN is_deleted INTEGER DEFAULT 0")
    
    if "deleted_by_id" not in columns:
        print("Adding deleted_by_id column...")
        cursor.execute("ALTER TABLE research_records ADD COLUMN deleted_by_id INTEGER")
        
    if "deleted_at" not in columns:
        print("Adding deleted_at column...")
        cursor.execute("ALTER TABLE research_records ADD COLUMN deleted_at DATETIME")
    
    conn.commit()
    conn.close()
    print("Schema fix completed successfully.")

if __name__ == "__main__":
    fix_schema()
