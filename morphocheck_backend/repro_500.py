import os
import sys
from io import BytesIO
from openpyxl import Workbook
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.getcwd())

# Mock the environment
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

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

# Instead of calling the router which has many dependencies, let's just try to save a PatientAnalysis without hip
try:
    print("Testing saving PatientAnalysis without hip...")
    # These fields are nullable=False in models/userdata.py:
    # name, age, gender, height, weight, chest, waist, hip, head, bmi, z_score, somatotype, recommendations
    rec = PatientAnalysis(
        name="Test User",
        age=20,
        gender="erkak",
        height=170.0,
        weight=70.0,
        chest=90.0,
        waist=80.0,
        # hip is MISSING!
        head=55.0,
        bmi=24.2,
        z_score=0.0,
        somatotype="normostenik",
        recommendations="Test",
        created_by_id=test_user.id
    )
    db.add(rec)
    db.commit()
    print("SUCCESS: SQLite allowed missing hip (it might not have strict null checks by default or SQLALchemy didn't complain yet)")
except Exception as e:
    print(f"FAILED as expected: {e}")
finally:
    db.close()
