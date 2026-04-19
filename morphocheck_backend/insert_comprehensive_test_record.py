import sys
import os
from datetime import datetime

# Add the backend directory to sys.path to import models
sys.path.append(os.path.abspath(os.path.join(os.getcwd())))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.userdata import ResearchRecord
from models.base import Base

# Database setup
DATABASE_URL = "sqlite:///./morphocheck.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_comprehensive_test_record():
    db = SessionLocal()
    try:
        # Create a new ResearchRecord for a 7-year-old child
        # Researcher: Izlanuvchiyev Izlanuvchi (ID: 7)
        new_record = ResearchRecord(
            created_by_id=7,
            full_name="Izzatillo Izlanuvchi-O'g'li",
            school_name="12-ixtisoslashtirilgan davlat maktab-internati",
            settlement="Toshkent viloyati, Chirchiq shahri",
            birth_place="Chirchiq",
            birth_date="2019.05.15", # 7 yoshga yaqin (2026 yilda)
            father_nationality="O'zbek",
            mother_nationality="O'zbek",
            living_since="Tug'ilgandan buyon shu hududda",
            enrolled_date="2024.01.10",
            living_conditions="A'lo darajada (shaxsiy hovli, barcha qulayliklar)",
            labor_regime="Kunlik darslar va sport to'garaklari",
            past_illnesses="Gripp (mavsumiy), qizamiq (2022-yilda)",
            children_count=3,
            child_order=2,
            feeding_type="Tabiiy (1.5 yoshgacha ona suti)",
            parents_marriage="Yaqin qarindosh emas",
            mother_health_status="Sog'lom, surunkali kasalliklari yo'q",
            examination_date="2026.04.19",

            # I Показатели физического развития
            lower_leg_spina_iliaca=68.2,
            lower_leg_symphysion=64.5,
            tibiale_height=34.3,
            pelvic_width=22.1,
            thigh_length=36.8,
            thigh_circumference=38.4,
            calf_length=32.1,
            calf_circumference=26.2,
            foot_length=20.5,
            teeth_count=20,
            menstruation_start="Yo'q",

            # II Определение формы черепа
            skull_longitudinal=18.2,
            skull_transverse=14.8,
            head_circumference=52.4,
            forehead_transverse=12.1,
            skull_height=13.2,

            # Определения размера основания черепа
            skull_base_length=15.8,
            skull_base_width=12.5,

            # Лицо
            face_bizygomatic=12.2,
            face_bigonial=9.8,
            face_morphological_height=10.6,
            face_physiognomic_height=16.2,
            nose_height=4.5,
            nose_width=3.1,
            outer_canthal_width=8.9,
            inner_canthal_width=3.0,
            lips_mucosa_height=1.4,
            mouth_width=4.3,

            # Грудь
            chest_standing_height=122.5,
            chest_sitting_height=68.4,
            weight=24.8,
            trunk_length=45.2,
            torso_length=38.1,
            chest_circumference_pause=58.5,
            chest_circumference_inhale=61.2,
            chest_circumference_exhale=57.4,
            waist_circumference=54.2,
            abdomen_circumference=56.8,
            upper_segment_length=51.4,
            chest_transverse_diameter=19.8,
            chest_anteroposterior_diameter=15.2,
            chest_height=17.8,
            
            # Верхняя конечность
            arm_length=51.5,
            shoulder_length=24.2,
            shoulder_width=28.4,
            shoulder_circumference_rest=18.8,
            shoulder_circumference_flexed=20.1,
            forearm_length=19.4,
            hand_length=14.2,
            dynamometry=10.5,
            
            # Толщина подкожно-жировой клетчатки
            fat_triceps=9.2,
            fat_biceps=5.5,
            fat_subscapular=7.1,
            fat_iliac=7.8,
            fat_popliteal=9.6
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        print(f"Successfully created Comprehensive ResearchRecord with ID: {new_record.id}")
        return new_record.id
    except Exception as e:
        db.rollback()
        print(f"Error creating record: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_comprehensive_test_record()
