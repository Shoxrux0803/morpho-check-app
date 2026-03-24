import sqlite3
import os

db_path = "d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"

def migrate():
    if not os.path.exists(db_path):
        print("Database not found. Skipping migration.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    columns_to_add = [
        ("examination_date", "TEXT"),
        ("birth_date", "TEXT"),
        ("preschool_institution", "TEXT"),
        ("shoulder_length", "REAL"),
        ("shoulder_breadth", "REAL"),
        ("shoulder_circumference", "REAL"),
        ("arm_elbow_length", "REAL"),
        ("hand_length", "REAL"),
        ("thigh_length", "REAL"),
        ("thigh_circumference", "REAL"),
        ("calf_length", "REAL"),
        ("calf_circumference", "REAL"),
        ("foot_length", "REAL"),
        ("age_months", "INTEGER"),
        ("age_days", "INTEGER"),
        ("id_code", "TEXT"),
        # Bioimpedance Analysis
        ("total_body_water", "REAL"),
        ("fat_percent", "REAL"),
        ("fat_mass", "REAL"),
        ("muscle_mass", "REAL"),
        ("bone_mass", "REAL"),
        ("acm", "REAL"),
        ("visceral_fat", "REAL"),
    ]
    
    for col, dtype in columns_to_add:
        try:
            cur.execute(f"ALTER TABLE user_analysis ADD COLUMN {col} {dtype}")
            print(f"Successfully added column {col}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col} already exists")
            else:
                print(f"Error adding {col}: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
