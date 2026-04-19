from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.userdata import ResearchRecord
from models.user import User

DATABASE_URL = "sqlite:///d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_4yo_research_record():
    db = SessionLocal()
    try:
        # Find the researcher user
        researcher = db.query(User).filter(User.role == "researcher").first()
        if not researcher:
            print("Researcher user not found. Please create one first.")
            return

        # 4-year-old child (born in 2022, current date is 2026)
        record = ResearchRecord(
            created_by_id=researcher.id,
            full_name="Abdukarimov Temur",
            school_name="4-sonli bog'cha",
            settlement="Yunusobod tumani",
            birth_place="Toshkent",
            birth_date="2022-03-20", # 4 yosh
            father_nationality="O'zbek",
            mother_nationality="O'zbek",
            living_since="Tug'ilganidan beri",
            enrolled_date="2025-01-10",
            living_conditions="Yaxshi",
            labor_regime="Bolalar bog'chasi",
            past_illnesses="Shamollash",
            children_count=1,
            child_order=1,
            feeding_type="Aralash",
            parents_marriage="Qarindosh emas",
            mother_health_status="Sog'lom",
            examination_date="2026-04-19",
            
            # Measurements for 4-year-old
            weight=16.8,
            chest_standing_height=104.5,
            chest_sitting_height=58.0,
            trunk_length=32.0,
            chest_circumference_pause=53.0,
            waist_circumference=49.0,
            head_circumference=50.5,
            
            arm_length=42.0,
            hand_length=11.5,
            thigh_length=28.0,
            foot_length=16.5
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        print(f"Izlanuvchi uchun 4 yoshli bola muvaffaqiyatli qo'shildi: {record.full_name} (ID: {record.id})")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_4yo_research_record()
