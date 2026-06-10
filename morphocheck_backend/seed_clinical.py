from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base
from models.clinical import ClinicalSetting

# DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./morphocheck.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_clinical_settings():
    db = SessionLocal()

    # 1. BMI Categories (from analyze_router.py)
    bmi_cats = {
        "v_low": {
            "uz": "Vazn yetishmovchiligi (yaqqol)",
            "ru": "Выраженный дефицит массы",
            "en": "Severe underweight",
            "kz": "Айқын салмақ тапшылығы",
        },
        "low": {
            "uz": "Vazn yetishmovchiligi",
            "ru": "Недостаточная масса тела",
            "en": "Underweight",
            "kz": "Салмақ тапшылығы",
        },
        "normal": {
            "uz": "Me'yor",
            "ru": "Норма",
            "en": "Normal",
            "kz": "Қалыпты",
        },
        "overweight": {
            "uz": "Ortiqcha vazn",
            "ru": "Избыточная масса тела",
            "en": "Overweight",
            "kz": "Артық салмақ",
        },
        "obese": {
            "uz": "Semizlik",
            "ru": "Ожирение",
            "en": "Obesity",
        },
    }

    # 2. Advice Templates (from analyze_router.py)
    advice_templates = {
        "default_general": {
            "uz": "Sog'lom turmush tarzini davom ettiring.",
            "ru": "Продолжайте вести здоровый образ жизни.",
            "en": "Continue to maintain a healthy lifestyle.",
            "kz": "Салауатты өмір салтын жалғастырыңыз.",
        },
        "low_bmi_general": {
            "uz": "Tana vazni yetarli emas (Kam vazn). Diqqat qiling.",
            "ru": "Масса тела недостаточна (дефицит веса). Обратите внимание.",
            "en": "Body weight is insufficient (underweight). Please pay attention.",
            "kz": "Дене салмағы жеткіліксіз (салмақ тапшылығы). Назар аударыңыз.",
        },
        "high_bmi_general": {
            "uz": "Ortiqcha vazn aniqlandi. Bu kelajakda salomatlikka salbiy ta'sir qilishi mumkin.",
            "ru": "Выявлен избыточный вес. В будущем это может негативно сказаться на здоровье.",
            "en": "Excess weight was identified. This may negatively affect health in the future.",
            "kz": "Артық салмақ анықталды. Бұл болашақта денсаулыққа кері әсер етуі мүмкін.",
        },
        # ... (qolganlarini ham qo'shish mumkin, lekin misol uchun shular yetarli)
    }

    # 3. Interpretations (from indices_service.py - qisqacha)
    interpretations = {
        "hmai_optimal": {
            "uz": "muhitga nisbatan optimal morfologik moslashuv",
            "ru": "оптимальная морфологическая адаптация к среде",
            "en": "optimal morphological adaptation to the environment",
            "kz": "қоршаған ортаға оңтайлы морфологиялық бейімделу",
        },
        "astenik": {
            "uz": "astenik",
            "ru": "астенический",
            "en": "asthenic",
            "kz": "астеникалық",
        },
        "normostenik": {
            "uz": "normostenik",
            "ru": "нормостенический",
            "en": "normosthenic",
            "kz": "нормостеникалық",
        },
        "giperstenik": {
            "uz": "giperstenik",
            "ru": "гиперстенический",
            "en": "hypersthenic",
            "kz": "гиперстеникалық",
        },
    }

    def add_or_update(key, category, label, value):
        existing = db.query(ClinicalSetting).filter(ClinicalSetting.key == key).first()
        if existing:
            existing.value_json = value
            existing.label = label
            existing.category = category
        else:
            new_set = ClinicalSetting(
                key=key, category=category, label=label, value_json=value
            )
            db.add(new_set)

    # Seed BMI Categories
    for k, v in bmi_cats.items():
        add_or_update(f"bmi_cat_{k}", "bmi_categories", f"BMI Category: {k}", v)

    # Seed Advice
    for k, v in advice_templates.items():
        add_or_update(f"adv_{k}", "advice", f"Advice Template: {k}", v)

    # Seed Interpretations
    for k, v in interpretations.items():
        add_or_update(f"interp_{k}", "interpretations", f"Interpretation: {k}", v)

    # Add numeric standards example
    add_or_update(
        "std_bmi_adult",
        "standards",
        "Adult BMI Standards",
        {"underweight": 18.5, "normal": 24.9, "overweight": 29.9},
    )

    try:
        db.commit()
        print("Success: Clinical settings seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    # Avval jadvallarni yaratish (agar yo'q bo'lsa)
    Base.metadata.create_all(bind=engine)
    seed_clinical_settings()
