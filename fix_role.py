import sqlite3
import os

db_path = 'morphocheck_backend/morphocheck.db'
if not os.path.exists(db_path):
    # Try current directory if run from inside backend
    db_path = 'morphocheck.db'

conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("UPDATE users SET role = 'superadmin' WHERE email = 'admin@admin.com'")
conn.commit()
print("Success: admin@admin.com role set back to superadmin")
conn.close()
