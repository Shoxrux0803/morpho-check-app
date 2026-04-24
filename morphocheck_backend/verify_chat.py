import json
import sqlite3
import os

db_path = r"c:\Users\user\.gemini\antigravity\scratch\morpho-check-app\morphocheck_backend\morphocheck.db"

def check_db():
    if not os.path.exists(db_path):
        print("DB not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n--- Recent Messages ---")
    cursor.execute("SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()

if __name__ == "__main__":
    check_db()
