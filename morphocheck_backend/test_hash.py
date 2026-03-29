
import sqlite3
from utils.security import verify_password, pwd_context

def test():
    try:
        conn = sqlite3.connect('morphocheck.db')
        cur = conn.cursor()
        cur.execute("SELECT email, hashed_password FROM users WHERE email='admin@admin.com'")
        row = cur.fetchone()
        if not row:
            print("User not found")
            return
        
        email, h = row
        print(f"User: {email}")
        print(f"Hash in DB: {h}")
        
        try:
            is_valid = verify_password('admin123', h)
            print(f"Verify 'admin123': {is_valid}")
        except Exception as e:
            print(f"Verification error: {e}")
            
    except Exception as e:
        print(f"DB error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test()
