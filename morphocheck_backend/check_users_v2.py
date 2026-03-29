import sqlite3
import os

def check_users_v2():
    try:
        db_path = 'morphocheck.db'
        print(f"Checking database at: {os.path.abspath(db_path)}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, role, hashed_password FROM users")
        users = cursor.fetchall()
        print(f"Number of users found: {len(users)}")
        for user in users:
            uid, name, email, role, hashed_password = user
            print("-" * 20)
            print(f"ID: {uid}")
            print(f"Name: {name}")
            print(f"Email: {email}")
            print(f"Role: {role}")
            print(f"Hash: {hashed_password}")
            print(f"Hash Type: {type(hashed_password)}")
            if hashed_password:
                print(f"Hash Length: {len(hashed_password)}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users_v2()
