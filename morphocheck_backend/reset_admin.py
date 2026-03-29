from utils.security import get_password_hash
import sqlite3
import os

def reset_admin():
    db_path = 'morphocheck.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    new_password = "admin123"
    hashed = get_password_hash(new_password)
    print(f"New hash for '{new_password}': {hashed}")

    try:
        cursor.execute("UPDATE users SET hashed_password=?, role='superadmin' WHERE email='admin@admin.com'", (hashed,))
        if cursor.rowcount == 0:
            print("Admin user not found, creating new one...")
            cursor.execute("""
                INSERT INTO users (name, email, hashed_password, role, region, phone)
                VALUES (?, ?, ?, ?, ?, ?)
            """, ('Shermanov Abduvali', 'admin@admin.com', hashed, 'superadmin', 'Tashkent', '+998901234567'))
        
        conn.commit()
        print("Success: Admin password reset to 'admin123'")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    reset_admin()
