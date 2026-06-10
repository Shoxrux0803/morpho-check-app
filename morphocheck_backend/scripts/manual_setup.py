import sqlite3

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


db_path = "morphocheck.db"


def setup():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    email = "admin@morphocheck.uz"
    password = "superadmin123"
    hashed_pwd = get_password_hash(password)
    name = "Super Admin"
    role = "superadmin"

    # Check if exists
    cur.execute("SELECT id FROM users WHERE email = ?", (email,))
    row = cur.fetchone()

    if row:
        cur.execute(
            "UPDATE users SET hashed_password = ?, role = ?, name = ? WHERE id = ?",
            (hashed_pwd, role, name, row[0]),
        )
        print(f"Updated existing user {email}")
    else:
        cur.execute(
            "INSERT INTO users (name, email, hashed_password, role) VALUES (?, ?, ?, ?)",
            (name, email, hashed_pwd, role),
        )
        print(f"Created new user {email}")

    conn.commit()
    conn.close()


if __name__ == "__main__":
    setup()
