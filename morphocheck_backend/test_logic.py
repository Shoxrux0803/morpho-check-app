
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
        
        print(f"Simulating User: ID={user_id}, Role='{user_role}'")
        
        # Logic: if role == 'admin' then filter by created_by_id
        query = "SELECT id, name, created_by_id FROM patient_analysis"
        if user_role == 'admin':
            query += f" WHERE created_by_id = {user_id}"
            
        print(f"Query: {query}")
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"Results count: {len(results)}")
        
        # Simulating SuperAdmin
        print("\nSimulating SuperAdmin: Role='superadmin'")
        query_sa = "SELECT id, name, created_by_id FROM patient_analysis"
        print(f"Query: {query_sa}")
        cursor.execute(query_sa)
        results_sa = cursor.fetchall()
        print(f"Results count: {len(results_sa)}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_filter_logic()
