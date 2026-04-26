import sqlite3
import os

db_path = 'morphocheck.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE research_records ADD COLUMN lower_leg_length FLOAT')
    print("Column 'lower_leg_length' added successfully to 'research_records'.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column 'lower_leg_length' already exists.")
    else:
        print(f"Error: {e}")

conn.commit()
conn.close()
