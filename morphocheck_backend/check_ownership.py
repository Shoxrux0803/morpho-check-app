
import sqlite3
import os

def check_data_ownership():
    try:
        db_path = 'morphocheck.db'
        print(f"Checking database at: {os.path.abspath(db_path)}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n--- Users ---")
        cursor.execute("SELECT id, name, email, role FROM users")
        for user in cursor.fetchall():
            print(f"ID={user[0]}, Name={user[1]}, Email={user[2]}, Role='{user[3]}'")
            
        print("\n--- Patient Analyses (Samples) ---")
        cursor.execute("SELECT id, name, created_by_id FROM patient_analysis LIMIT 10")
        for row in cursor.fetchall():
            print(f"ID={row[0]}, PatientName={row[1]}, CreatedByID={row[2]}")
            
        print("\n--- Counts ---")
        cursor.execute("SELECT created_by_id, COUNT(*) FROM patient_analysis GROUP BY created_by_id")
        for row in cursor.fetchall():
            print(f"CreatedByID={row[0]}: Count={row[1]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data_ownership()
