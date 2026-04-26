import sqlite3
import os

db_path = r"d:\BOT\morpho-check-app\morphocheck_backend\morphocheck.db"

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adding father_height to research_records...")
    cursor.execute("ALTER TABLE research_records ADD COLUMN father_height FLOAT")
except sqlite3.OperationalError as e:
    print(f"Notice: {e}")

try:
    print("Adding mother_height to research_records...")
    cursor.execute("ALTER TABLE research_records ADD COLUMN mother_height FLOAT")
except sqlite3.OperationalError as e:
    print(f"Notice: {e}")

conn.commit()
conn.close()
print("Migration completed.")
