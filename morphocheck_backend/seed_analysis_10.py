
import sqlite3
import random
import json
from datetime import datetime

def seed_patient_analysis():
    db_path = 'morphocheck.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    names = ["Ali", "Vali", "Zuhra", "Hasan", "Malika", "Sardor", "Nilufar", "Javohir", "Ezgulik", "Gulnora"]
    last_names = ["Valiyev", "Karimov", "Usmonov", "Rustamova", "Azimov", "Rahimova", "Sobirov", "Tursunov", "Shamsiyeva", "Oripov"]
    
    data = []
    for i in range(10):
        gender = "erkak" if i % 2 == 0 else "ayol"
        height = round(random.uniform(90, 180), 1)
        weight = round(random.uniform(15, 80), 1)
        age = random.randint(3, 17)
        bmi = round(weight / ((height/100)**2), 1)

        record = (
            f"ID-{1000+i}", # id_code
            f"{names[i]} {last_names[i]}", # name
            "Toshkent", # region
            "Yunusobod", # district
            "Test address", # address
            datetime.now().strftime("%Y-%m-%d"), # examination_date
            "2015-01-01", # birth_date
            "Preschool #1", # preschool_institution
            age, # age
            gender, # gender
            height,
            weight,
            round(random.uniform(50, 90), 1), # chest
            round(random.uniform(40, 80), 1), # waist
            round(random.uniform(50, 100), 1), # hip
            round(random.uniform(48, 58), 1), # head
            bmi, # bmi
            0.0, # z_score
            "Normostenik", # somatotype
            "Sog'lom turmush tarziga amal qiling.", # recommendations
            1, # created_by_id
            0 # is_deleted
        )
        data.append(record)

    cols = [
        "id_code", "name", "region", "district", "address", "examination_date", "birth_date", 
        "preschool_institution", "age", "gender", "height", "weight", "chest", "waist", 
        "hip", "head", "bmi", "z_score", "somatotype", "recommendations", "created_by_id", "is_deleted"
    ]
    
    placeholders = ", ".join(["?"] * len(cols))
    sql = f"INSERT INTO patient_analysis ({', '.join(cols)}) VALUES ({placeholders})"
    
    try:
        cursor.executemany(sql, data)
        conn.commit()
        print("Success: 10 patient analysis records created!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_patient_analysis()
