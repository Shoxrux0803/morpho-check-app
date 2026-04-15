from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.userdata import PatientAnalysis
import os

db_url = "sqlite:///morphocheck.db"
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Find a deleted record
deleted_rec = db.query(PatientAnalysis).filter(PatientAnalysis.is_deleted == 1).first()
if deleted_rec:
    print(f"Found deleted record: ID={deleted_rec.id}, Name={deleted_rec.name}")
    
    # Try to restore
    deleted_rec.is_deleted = 0
    deleted_rec.deleted_by_id = None
    deleted_rec.deleted_at = None
    db.commit()
    
    # Verify
    db.refresh(deleted_rec)
    print(f"After restoration: is_deleted={deleted_rec.is_deleted}, deleted_at={deleted_rec.deleted_at}")
else:
    print("No deleted records found to test restoration.")

db.close()
