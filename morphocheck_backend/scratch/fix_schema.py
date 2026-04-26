
import sqlite3
from utils.database import engine
from models.userdata import PatientAnalysis
from sqlalchemy import inspect

def check_and_fix_schema():
    conn = sqlite3.connect("morphocheck.db")
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(patient_analysis)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    
    # Get model columns
    inspector = inspect(engine)
    columns_in_model = [c['name'] for c in inspector.get_columns('patient_analysis')]
    
    print(f"Existing columns in DB: {existing_cols}")
    
    # Missing columns to add
    # We'll explicitly check for father_height and mother_height first
    target_cols = ["father_height", "mother_height"]
    
    for col in target_cols:
        if col not in existing_cols:
            print(f"Adding missing column: {col}")
            try:
                cursor.execute(f"ALTER TABLE patient_analysis ADD COLUMN {col} FLOAT")
                print(f"Successfully added {col}")
            except Exception as e:
                print(f"Error adding {col}: {e}")
    
    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    check_and_fix_schema()
