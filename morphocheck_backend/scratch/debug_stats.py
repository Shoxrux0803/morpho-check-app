import os
import sys
from datetime import datetime, date

# Add the current directory to sys.path
sys.path.append(os.path.abspath('.'))

from utils.database import SessionLocal
from models.userdata import PatientAnalysis
from sqlalchemy import func, case
import numpy as np

def test_stats():
    db = SessionLocal()
    analysis_q = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 0)
    
    # Simulate the logic from admin_router.py
    sci_data = analysis_q.with_entities(
        PatientAnalysis.age,
        PatientAnalysis.height,
        PatientAnalysis.weight,
        PatientAnalysis.bmi,
        PatientAnalysis.chest,
        PatientAnalysis.z_score
    ).all()
    
    print(f"Total records: {len(sci_data)}")
    
    if sci_data:
        ages = np.array([float(r.age or 0) for r in sci_data])
        z_vals = np.array([float(r.z_score or 0) for r in sci_data])
        bmis = np.array([float(r.bmi or 0) for r in sci_data])
        
        bmi_dist = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
        for i in range(len(sci_data)):
            a = ages[i]
            z = z_vals[i]
            b = bmis[i]
            
            if a < 19:
                if z < -2: bmi_dist["underweight"] += 1
                elif z <= 1: bmi_dist["normal"] += 1
                elif z <= 2: bmi_dist["overweight"] += 1
                else: bmi_dist["obese"] += 1
            else:
                if b < 18.5: bmi_dist["underweight"] += 1
                elif b < 25: bmi_dist["normal"] += 1
                elif b < 30: bmi_dist["overweight"] += 1
                else: bmi_dist["obese"] += 1
        
        print("BMI Distribution (Risk Groups):")
        print(bmi_dist)
        
        z_ranges = [
            ("< -2σ (Ozg'in)", -999, -2, -2.5),
            ("-2σ — -1σ", -2, -1, -1.5),
            ("-1σ — 0 (Norm-)", -1, 0, -0.5),
            ("0 — +1σ (Norm+)", 0, 1, 0.5),
            ("+1σ — +2σ", 1, 2, 1.5),
            ("> +2σ (Semizlik)", 2, 999, 2.5)
        ]
        z_score_dist = []
        total_z = len(z_vals)
        for label, low, high, mid_z in z_ranges:
            count = np.sum((z_vals >= low) & (z_vals < high))
            z_score_dist.append({
                "category": label,
                "count": int(count),
                "pct": float(count / total_z * 100) if total_z > 0 else 0,
                "zscore": mid_z
            })
        
        print("\nZ-Score Distribution:")
        for item in z_score_dist:
            print(item)

if __name__ == "__main__":
    test_stats()
