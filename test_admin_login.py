
import sys
import os

# Backend papkasini path ga qo'shish
sys.path.append(os.path.join(os.getcwd(), 'morphocheck_backend'))

from morphocheck_backend.utils.security import verify_password
import sqlite3

def check_admin():
    conn = sqlite3.connect('morphocheck_backend/morphocheck.db')
    cursor = conn.cursor()
    cursor.execute("SELECT hashed_password FROM users WHERE email='admin@admin.com'")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        print("Admin user not found in DB")
        return
        
    hashed = row[0]
    print(f"Hashed password in DB: {hashed}")
    
    passwords_to_test = ["admin", "admin123"]
    for pwd in passwords_to_test:
        result = verify_password(pwd, hashed)
        print(f"Testing password '{pwd}': {result}")

if __name__ == "__main__":
    check_admin()
