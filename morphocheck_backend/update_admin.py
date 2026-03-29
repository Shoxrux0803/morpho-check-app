
import sqlite3
from utils.security import get_password_hash

def update_admin():
    try:
        conn = sqlite3.connect('morphocheck.db')
        cur = conn.cursor()
        new_hash = get_password_hash("admin123")
        cur.execute("UPDATE users SET hashed_password = ?, role = ? WHERE email = ?", (new_hash, "admin", "admin@admin.com"))
        conn.commit()
        print(f"Password and role updated for admin@admin.com. New role: admin")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_admin()
