import os
import sys
from datetime import date, datetime, timedelta

# Add current directory to path
sys.path.append(os.getcwd())

from utils.database import SessionLocal
from models.userdata import PatientAnalysis
from models.user import User
from models.payment import Payment
from sqlalchemy import func, cast, Date, desc

db = SessionLocal()

def simulate_stats_endpoint():
    try:
        # Mock a superadmin user
        total_users = db.query(func.count(User.id)).scalar() or 0
        analysis_q = db.query(PatientAnalysis)
        
        total_analyses = analysis_q.with_entities(func.count(PatientAnalysis.id)).scalar() or 0
        total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0
        
        # Additional Stats
        today = date.today()
        # Today count
        today_analyses = analysis_q.filter(cast(PatientAnalysis.created_at, Date) == today).count()
        print(f"Today count: {today_analyses}")
        
        # Avg BMI
        avg_bmi = analysis_q.with_entities(func.avg(PatientAnalysis.bmi)).scalar() or 0
        print(f"Avg BMI: {avg_bmi}")
        
        # BMI Distribution
        bmi_dist = {
            "underweight": analysis_q.filter(PatientAnalysis.bmi < 18.5).count(),
            "normal": analysis_q.filter(PatientAnalysis.bmi >= 18.5, PatientAnalysis.bmi < 25).count(),
            "overweight": analysis_q.filter(PatientAnalysis.bmi >= 25, PatientAnalysis.bmi < 30).count(),
            "obese": analysis_q.filter(PatientAnalysis.bmi >= 30).count(),
        }
        print(f"BMI Dist: {bmi_dist}")

        # Somatotype Average Approximation
        avg_fat = analysis_q.with_entities(func.avg(PatientAnalysis.fat_percent)).scalar() or 20
        # CRITICAL: Floating point division check
        avg_muscle = analysis_q.with_entities(func.avg(PatientAnalysis.muscle_mass / PatientAnalysis.weight)).scalar() or 0.4
        print(f"Avg Muscle Ratio: {avg_muscle}")
        
        rpi_avg = analysis_q.with_entities(
            func.avg(PatientAnalysis.height / func.pow(PatientAnalysis.weight, 1/3))
        ).scalar() or 40
        print(f"RPI Avg: {rpi_avg}")

        # Monthly Trend
        trend_counts = (
            analysis_q.with_entities(
                func.strftime('%Y-%m', PatientAnalysis.created_at).label("month"),
                func.count(PatientAnalysis.id),
                func.avg(PatientAnalysis.bmi).label("avg_bmi")
            )
            .group_by("month")
            .order_by("month")
            .all()
        )
        print(f"Monthly entries: {len(trend_counts)}")

        print("SUCCESS: Stats calculation completed without error.")
        
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    simulate_stats_endpoint()
