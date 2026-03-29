import sqlite3
import os

db_path = "morphocheck_backend/morphocheck.db"
if not os.path.exists(db_path):
    db_path = "morphocheck.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE patient_analysis ADD COLUMN body_length REAL;")
    conn.commit()
    print("Column body_length added successfully!")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column body_length already exists.")
    else:
        print(f"Error: {e}")
finally:
    conn.close()
