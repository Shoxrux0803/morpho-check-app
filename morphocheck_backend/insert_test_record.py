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

def create_test_record():
    db = SessionLocal()
    try:
        # Create a new ResearchRecord for a 6-year-old child
        # Researcher: Izlanuvchiyev Izlanuvchi (ID: 7)
        new_record = ResearchRecord(
            created_by_id=7,
            full_name="Testbek Izlanuvchiyev",
            school_name="6-umumiy o'rta ta'lim maktabi",
            settlement="Toshkent shahri, Yunusobod tumani",
            birth_place="Toshkent",
            birth_date="2020.04.10", # Around 6 years old as of 2026.04.19
            father_nationality="O'zbek",
            mother_nationality="O'zbek",
            living_since="Tug'ilgandan beri",
            enrolled_date="2023.09.01",
            living_conditions="Yaxshi, barcha sharoitlar mavjud",
            labor_regime="O'rtacha, maktabgacha ta'lim muassasasi",
            past_illnesses="O'tkir respirator kasalliklar (kam hollarda)",
            children_count=2,
            child_order=1,
            feeding_type="Tabiiy (ona suti)",
            parents_marriage="Qarindosh emas",
            mother_health_status="Sog'lom",
            examination_date="2026.04.19",

            # I Показатели физического развития
            lower_leg_spina_iliaca=65.0,
            lower_leg_symphysion=62.5,
            tibiale_height=32.0,
            pelvic_width=20.5,
            thigh_length=34.0,
            thigh_circumference=36.0,
            calf_length=30.0,
            calf_circumference=24.5,
            foot_length=18.5,
            teeth_count=20,
            menstruation_start="Yo'q (yoshiga mos)",

            # II Определение формы черепа
            skull_longitudinal=17.5,
            skull_transverse=14.2,
            head_circumference=51.5,
            forehead_transverse=11.5,
            skull_height=12.5,

            # Определения размера основания черепа
            skull_base_length=15.0,
            skull_base_width=12.0,

            # Лицо
            face_bizygomatic=11.5,
            face_bigonial=9.2,
            face_morphological_height=10.0,
            face_physiognomic_height=15.5,
            nose_height=4.2,
            nose_width=2.8,
            outer_canthal_width=8.5,
            inner_canthal_width=2.8,
            lips_mucosa_height=1.2,
            mouth_width=4.0,

            # Грудь
            chest_standing_height=115.5,
            chest_sitting_height=65.0,
            weight=21.5,
            trunk_length=42.0,
            torso_length=35.0,
            chest_circumference_pause=56.5,
            chest_circumference_inhale=58.0,
            chest_circumference_exhale=55.0,
            waist_circumference=52.0,
            abdomen_circumference=54.0,
            upper_segment_length=48.0,
            chest_transverse_diameter=18.5,
            chest_anteroposterior_diameter=14.0,
            chest_height=16.5,
            
            # Верхняя конечность
            arm_length=48.0,
            shoulder_length=22.0,
            shoulder_width=26.5,
            shoulder_circumference_rest=17.5,
            shoulder_circumference_flexed=18.5,
            forearm_length=18.0,
            hand_length=13.0,
            dynamometry=8.5,
            
            # Толщина подкожно-жировой клетчатки
            fat_triceps=8.5,
            fat_biceps=5.0,
            fat_subscapular=6.5,
            fat_iliac=7.0,
            fat_popliteal=9.0
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        print(f"Successfully created ResearchRecord with ID: {new_record.id}")
        return new_record.id
    except Exception as e:
        db.rollback()
        print(f"Error creating record: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_record()
