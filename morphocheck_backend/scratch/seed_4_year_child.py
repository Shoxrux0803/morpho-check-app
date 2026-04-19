from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os
import json

# Loyiha ildizini yo'lga qo'shish
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.userdata import PatientAnalysis
from models.user import User

DATABASE_URL = "sqlite:///d:/BOT/morpho-check-app/morphocheck_backend/morphocheck.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_4_year_old():
    db = SessionLocal()
    try:
        # Test uchun foydalanuvchini topish (superadmin yoki birinchi admin)
        user = db.query(User).filter(User.role == "superadmin").first()
        if not user:
            user = db.query(User).first()
            
        # 4 yoshli bola uchun tahliliy ma'lumotlar
        # Somatotip va tahlil natijalari
        analysis_data = {
            "id_code": "TEST-4Y-001",
            "name": "Olimjonov Sardor",
            "gender": "erkak",
            "age": 4,
            "age_months": 3,
            "age_days": 15,
            "height": 102.5,
            "weight": 16.2,
            "chest": 52.0,
            "head": 50.5,
            "waist": 48.0,
            "hip": 54.0,
            "region": "Toshkent",
            "examination_date": "2026-04-19",
            "birth_date": "2022-01-04",
            "bmi": 15.4,
            "z_score": 0.2,
            "somatotype": "Mezomorf",
            "recommendations": json.dumps({
                "general": "Bolaning jismoniy rivojlanishi yoshiga mos.",
                "nutrition": "Oqsil va vitaminlarga boy taomlar tavsiya etiladi.",
                "activity": "Kunlik faol o'yinlar va sayr.",
                "specialist": "Yillik ko'rikdan o'tib turish kifoya."
            }),
            "created_by_id": user.id if user else 1
        }
        
        new_analysis = PatientAnalysis(**analysis_data)
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)
        print(f"Muvaffaqiyatli qo'shildi: {new_analysis.name} (4 yosh). ID: {new_analysis.id}")
        
    except Exception as e:
        print(f"Xatolik: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_4_year_old()
