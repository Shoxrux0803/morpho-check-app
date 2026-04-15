import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.getcwd())

from models.base import Base
from models.userdata import PatientAnalysis
from models.user import User

# Use an in-memory SQLite for testing
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Create a test user
test_user = User(name="Admin", role="admin")
db.add(test_user)
db.commit()

# Test the fix
try:
    print("Verifying fix: Saving PatientAnalysis with hip=0.0...")
    rec = PatientAnalysis(
        name="Verified User",
        age=20,
        gender="erkak",
        height=175.0,
        weight=75.0,
        chest=95.0,
        waist=85.0,
        hip=0.0, # This was missing before
        head=56.0,
        bmi=24.5,
        z_score=0.0,
        somatotype="normostenik",
        recommendations="Test recommendation",
        created_by_id=test_user.id
    )
    db.add(rec)
    db.commit()
    print("SUCCESS: Record saved successfully with hip field.")
    
    # Check if we can read it back
    saved = db.query(PatientAnalysis).filter_by(name="Verified User").first()
    if saved and saved.hip == 0.0:
        print("VERIFIED: Record retrieved with correct hip value.")
    else:
        print("FAILED: Saved record seems incorrect.")
        
except Exception as e:
    print(f"FAILED: Verification error - {e}")
finally:
    db.close()
