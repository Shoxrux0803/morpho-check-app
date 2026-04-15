import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from utils.database import SessionLocal
from models.userdata import PatientAnalysis
from sqlalchemy import func, cast, Date, pow
from datetime import date

db = SessionLocal()

def test_stats():
    try:
        analysis_q = db.query(PatientAnalysis)
        total = analysis_q.count()
        print(f"Total analyses: {total}")
        
        # Test today count
        today = date.today()
        today_count = analysis_q.filter(cast(PatientAnalysis.created_at, Date) == today).count()
        print(f"Today count: {today_count}")
        
        # Test avg BMI
        avg_bmi = analysis_q.with_entities(func.avg(PatientAnalysis.bmi)).scalar()
        print(f"Avg BMI: {avg_bmi}")
        
        # Test avg fat
        avg_fat = analysis_q.with_entities(func.avg(PatientAnalysis.fat_percent)).scalar()
        print(f"Avg Fat: {avg_fat}")
        
        # Test avg muscle (The suspicious one)
        # avg_muscle = analysis_q.with_entities(func.avg(PatientAnalysis.muscle_mass / PatientAnalysis.weight)).scalar()
        # print(f"Avg Muscle: {avg_muscle}")
        
        # Test RPI (The other suspicious one)
        # rpi_avg = analysis_q.with_entities(func.avg(PatientAnalysis.height / func.pow(PatientAnalysis.weight, 1/3))).scalar()
        # print(f"RPI Avg: {rpi_avg}")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_stats()
