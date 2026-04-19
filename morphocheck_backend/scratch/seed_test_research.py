from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.userdata import ResearchRecord
from models.user import User
from utils.security import get_password_hash

DATABASE_URL = "sqlite:///d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_research_data():
    db = SessionLocal()
    try:
        # 1. Check if researcher exists, if not create one
        researcher = db.query(User).filter(User.role == "researcher").first()
        if not researcher:
            researcher = User(
                name="Test Researcher",
                email="researcher@test.com",
                hashed_password=get_password_hash("Researcher123!"),
                role="researcher",
                region="Toshkent"
            )
            db.add(researcher)
            db.commit()
            db.refresh(researcher)
            print(f"Created researcher: {researcher.email}")
        else:
            print(f"Using existing researcher: {researcher.email}")

        # 2. Add a test research record
        record = ResearchRecord(
            created_by_id=researcher.id,
            full_name="Aliyeva Guli",
            school_name="15-maktab",
            settlement="Chilonzor tumani",
            birth_place="Toshkent shahri",
            birth_date="2015-05-12",
            father_nationality="O'zbek",
            mother_nationality="O'zbek",
            living_since="Tug'ilganidan beri",
            enrolled_date="2022-09-01",
            living_conditions="Yaxshi",
            labor_regime="O'rtacha",
            past_illnesses="Gripp",
            children_count=2,
            child_order=1,
            feeding_type="Tabiiy",
            parents_marriage="Qarindosh emas",
            mother_health_status="Sog'lom",
            examination_date="2026-04-19",
            
            # Measurements
            weight=32.5,
            chest_standing_height=135.0,
            chest_sitting_height=72.0,
            trunk_length=42.0,
            torso_length=38.5,
            chest_circumference_pause=64.0,
            chest_circumference_inhale=68.0,
            chest_circumference_exhale=62.0,
            waist_circumference=58.0,
            abdomen_circumference=60.0,
            
            head_circumference=52.5,
            skull_longitudinal=17.5,
            skull_transverse=14.2,
            
            arm_length=58.0,
            shoulder_length=12.5,
            hand_length=15.0,
            
            thigh_length=38.0,
            thigh_circumference=42.0,
            calf_length=32.0,
            calf_circumference=28.0,
            foot_length=21.5,
            
            fat_triceps=8.5,
            fat_subscapular=7.2
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        print(f"Successfully added research record for {record.full_name} (ID: {record.id})")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_research_data()
