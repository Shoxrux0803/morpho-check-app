import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from utils.database import SessionLocal
from models.userdata import PatientAnalysis
from sqlalchemy import func, cast, Date
from datetime import date
import math

db = SessionLocal()

def test_stats():
    try:
        analysis_q = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted != 1)
        
        # 1. Today count
        today = date.today()
        today_count = analysis_q.filter(cast(PatientAnalysis.created_at, Date) == today).count()
        print(f"Today count: {today_count}")
        
        # 2. Avg BMI
        avg_bmi = analysis_q.with_entities(func.avg(PatientAnalysis.bmi)).scalar()
        print(f"Avg BMI: {avg_bmi}")
        
        # 3. Complex calculations
        # Fat avg
        avg_fat = analysis_q.with_entities(func.avg(PatientAnalysis.fat_percent)).scalar() or 20
        # Muscle avg ratio
        # Instead of doing division in SQL (risky), let's do it in Python for the avg
        m_data = analysis_q.with_entities(PatientAnalysis.muscle_mass, PatientAnalysis.weight).all()
        ratios = [ (m/w) if (w and w > 0) else 0.4 for m, w in m_data if m is not None and w is not None]
        avg_muscle_ratio = sum(ratios)/len(ratios) if ratios else 0.4
        print(f"Avg Muscle Ratio: {avg_muscle_ratio}")
        
        # Monthly trend with avg_bmi
        trend_counts = (
            analysis_q.with_entities(
                # Use a safer way for SQLite if needed, but let's test strftime
                func.strftime('%Y-%m', PatientAnalysis.created_at).label("month"),
                func.count(PatientAnalysis.id),
                func.avg(PatientAnalysis.bmi).label("avg_bmi")
            )
            .group_by("month")
            .all()
        )
        print(f"Trend entries: {len(trend_counts)}")
        for t in trend_counts:
            print(f"  {t.month}: {t[1]} (BMI: {t.avg_bmi})")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_stats()
