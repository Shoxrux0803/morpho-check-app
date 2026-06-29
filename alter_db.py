import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'morphocheck_backend', 'morphocheck.db')
try:
    conn = sqlite3.connect(db_path)
    conn.execute('ALTER TABLE users ADD COLUMN plain_password VARCHAR(255);')
    conn.commit()
    conn.close()
    print("Column added successfully.")
except Exception as e:
    print(f"Error: {e}")
