try:
    from utils.database import SessionLocal
    from models.userdata import PatientAnalysis
    db = SessionLocal()
    analyses = db.query(PatientAnalysis).all()
    print(f"Total analyses: {len(analyses)}")
    for a in analyses:
        try:
            if a.bmi is not None: float(a.bmi)
            if a.z_score is not None: float(a.z_score)
            if a.height is not None: float(a.height)
            if a.weight is not None: float(a.weight)
        except Exception as e:
            print(f"Row ID {a.id} has invalid numeric data: bmi={a.bmi}, z_score={a.z_score}, height={a.height}, weight={a.weight} - {e}")
    db.close()
    print("Database audit complete.")
except Exception as global_e:
    print(f"GLOBAL ERROR: {global_e}")
