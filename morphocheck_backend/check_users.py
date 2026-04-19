import sqlite3
import os

db_path = 'morphocheck.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()
try:
    cur.execute("SELECT id, name, role FROM users")
    users = cur.fetchall()
    print("Users found:")
    for user in users:
        print(user)
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
