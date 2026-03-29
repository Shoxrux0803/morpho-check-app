import sqlite3
import os

db_path = "morphocheck.db"
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(patient_analysis)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "created_by_id" not in columns:
            print("Adding created_by_id column to patient_analysis table...")
            cursor.execute("ALTER TABLE patient_analysis ADD COLUMN created_by_id INTEGER REFERENCES users(id)")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column created_by_id already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
