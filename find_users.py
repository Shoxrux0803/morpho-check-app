import sqlite3
import os

dbs = ['morphocheck_backend/morphocheck.db', 'morphocheck.db']

for db_path in dbs:
    if os.path.exists(db_path):
        print(f"--- Users in {db_path} ---")
        try:
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("SELECT email, role FROM users")
            users = cur.fetchall()
            for user in users:
                print(f"Email: {user[0]}, Role: {user[1]}")
            conn.close()
        except Exception as e:
            print(f"Error reading {db_path}: {e}")
    else:
        print(f"Database {db_path} does not exist.")
