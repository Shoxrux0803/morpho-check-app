import sqlite3
import os

db_path = 'morphocheck.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns = [
    ('lower_leg_total', 'FLOAT'),
    ('arm_circumference_total', 'FLOAT')
]

for col_name, col_type in columns:
    try:
        cursor.execute(f'ALTER TABLE research_records ADD COLUMN {col_name} {col_type}')
        print(f"Column '{col_name}' added successfully.")
    except sqlite3.OperationalError:
        print(f"Column '{col_name}' already exists.")

conn.commit()
conn.close()
