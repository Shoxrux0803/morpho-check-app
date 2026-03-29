
import sqlite3
import os

def test_filter_logic():
    try:
        db_path = 'morphocheck.db'
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Simulating current_user (ID=1, Role='admin')
        user_id = 1
        user_role = 'admin'
        
        # Reality check
        cursor.execute("SELECT created_by_id, COUNT(*) FROM patient_analysis GROUP BY created_by_id")
        print(f"REALITY CHECK Distribution: {cursor.fetchall()}")
        
        # Logic: if role == 'admin' then filter by created_by_id
        query = "SELECT id, name, created_by_id FROM patient_analysis"
        if user_role == 'admin':
            query += f" WHERE created_by_id = {user_id}"
            
        print(f"Query: {query}")
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"Results count: {len(results)}")
        if results:
            print(f"First result: {results[0]}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_filter_logic()
