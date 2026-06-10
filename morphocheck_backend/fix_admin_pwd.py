import sqlite3
import os

db_path = "morphocheck.db"
correct_hash = "$2b$12$/yCt2vBm6Rt//uKLd4gVFO8o/wpSbaZ6XBB/cePMmZhzUWfRUhGNy"
email = "admin@admin.com"

if not os.path.exists(db_path):
    print(f"Error: {db_path} not found!")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET hashed_password=? WHERE email=?", (correct_hash, email)
    )
    conn.commit()
    conn.close()
    print(f"Success: Password for {email} has been updated to match 'admin123'")
