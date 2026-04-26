import sqlite3
import os

db_path = 'morphocheck.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE research_records ADD COLUMN parents_phone TEXT')
    print("Column 'parents_phone' added successfully.")
except sqlite3.OperationalError:
    print("Column 'parents_phone' already exists.")

conn.commit()
conn.close()
