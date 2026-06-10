import sqlite3
import os


def seed_db():
    db_path = "morphocheck.db"
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Pre-hashed password for 'admin123'
    # Hash generated using passlib.hash.bcrypt.hash("admin123")
    hashed = "$2b$12$dYfjhnKDb2SC0d1MsVnsDu5HXkfxhCkm6mvheCHq55Unb5qHJy7em"

    try:
        # Check if users table exists and has columns
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        if not cursor.fetchone():
            print("Error: Table 'users' does not exist!")
            return

        cursor.execute("SELECT * FROM users WHERE email='admin@admin.com'")
        if cursor.fetchone() is None:
            cursor.execute(
                """
                INSERT INTO users (name, email, hashed_password, role, region, phone)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                (
                    "Admin",
                    "admin@admin.com",
                    hashed,
                    "superadmin",
                    "Tashkent",
                    "+998901234567",
                ),
            )
            conn.commit()
            print("Success: Super Admin created: admin@admin.com / admin123")
        else:
            # Update password just in case
            cursor.execute(
                "UPDATE users SET hashed_password=? WHERE email='admin@admin.com'",
                (hashed,),
            )
            conn.commit()
            print("Success: Admin password updated: admin@admin.com / admin123")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_db()
