import random
import sqlite3
from datetime import datetime, timedelta


def get_random_date(start_year, end_year):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    return (start + timedelta(days=random.randint(0, delta.days))).strftime("%Y-%m-%d")


def seed_research():
    db_path = "morphocheck.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    names = [
        "Ali",
        "Vali",
        "Zuhra",
        "Hasan",
        "Malika",
        "Sardor",
        "Nilufar",
        "Javohir",
        "Ezgulik",
        "Gulnora",
    ]
    last_names = [
        "Valiyev",
        "Karimov",
        "Usmonov",
        "Rustamova",
        "Azimov",
        "Rahimova",
        "Sobirov",
        "Tursunov",
        "Shamsiyeva",
        "Oripov",
    ]
    regions = [
        "Toshkent",
        "Samarqand",
        "Buxoro",
        "Andijon",
        "Namangan",
        "Xorazm",
        "Farg'ona",
    ]

    records_data = []
    for i in range(10):
        gender = "Boy" if i % 2 == 0 else "Girl"
        full_name = f"{names[i]} {last_names[i]}"

        # Base demographics
        record = (
            1,  # created_by_id (Superadmin)
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            full_name,
            f"School #{random.randint(1, 50)}",
            random.choice(regions),
            random.choice(regions),
            get_random_date(2010, 2020),  # birth_date
            "Uzbek",  # father_nationality
            "Uzbek",  # mother_nationality
            "Since birth",  # living_since
            get_random_date(2021, 2023),  # enrolled_date
            "Good",  # living_conditions
            "Normal",  # labor_regime
            "None",  # past_illnesses
            random.randint(1, 4),  # children_count
            random.randint(1, 3),  # child_order
            "Natural",  # feeding_type
            "Non-relative",  # parents_marriage
            "Healthy",  # mother_health_status
            datetime.now().strftime("%Y-%m-%d"),  # examination_date
            # I Phisical development
            round(random.uniform(20, 40), 1),  # lower_leg_spina_iliaca
            round(random.uniform(20, 40), 1),  # lower_leg_symphysion
            round(random.uniform(30, 50), 1),  # tibiale_height
            round(random.uniform(15, 25), 1),  # pelvic_width
            round(random.uniform(20, 35), 1),  # thigh_length
            round(random.uniform(25, 45), 1),  # thigh_circumference
            round(random.uniform(20, 35), 1),  # calf_length
            round(random.uniform(20, 35), 1),  # calf_circumference
            round(random.uniform(15, 25), 1),  # foot_length
            random.randint(20, 32),  # teeth_count
            "N/A" if gender == "Boy" else "12 years",  # menstruation_start
            # II Skull
            round(random.uniform(15, 20), 1),  # skull_longitudinal
            round(random.uniform(12, 16), 1),  # skull_transverse
            round(random.uniform(48, 56), 1),  # head_circumference
            round(random.uniform(10, 13), 1),  # forehead_transverse
            round(random.uniform(10, 15), 1),  # skull_height
            round(random.uniform(10, 15), 1),  # skull_base_length
            round(random.uniform(10, 15), 1),  # skull_base_width
            # Face
            round(random.uniform(10, 14), 1),  # face_bizygomatic
            round(random.uniform(8, 12), 1),  # face_bigonial
            round(random.uniform(10, 13), 1),  # face_morphological_height
            round(random.uniform(15, 20), 1),  # face_physiognomic_height
            round(random.uniform(4, 6), 1),  # nose_height
            round(random.uniform(2, 4), 1),  # nose_width
            round(random.uniform(8, 11), 1),  # outer_canthal_width
            round(random.uniform(2, 4), 1),  # inner_canthal_width
            round(random.uniform(1, 2), 1),  # lips_mucosa_height
            round(random.uniform(4, 6), 1),  # mouth_width
            # Chest
            round(random.uniform(120, 180), 1),  # chest_standing_height
            round(random.uniform(70, 100), 1),  # chest_sitting_height
            round(random.uniform(30, 80), 1),  # weight
            round(random.uniform(30, 50), 1),  # trunk_length
            round(random.uniform(30, 50), 1),  # torso_length
            round(random.uniform(60, 90), 1),  # chest_circumference_pause
            round(random.uniform(65, 95), 1),  # chest_circumference_inhale
            round(random.uniform(55, 85), 1),  # chest_circumference_exhale
            round(random.uniform(50, 80), 1),  # waist_circumference
            round(random.uniform(50, 80), 1),  # abdomen_circumference
            round(random.uniform(60, 90), 1),  # upper_segment_length
            round(random.uniform(20, 30), 1),  # chest_transverse_diameter
            round(random.uniform(15, 25), 1),  # chest_anteroposterior_diameter
            round(random.uniform(15, 25), 1),  # chest_height
            # Arms
            round(random.uniform(50, 80), 1),  # arm_length
            round(random.uniform(25, 40), 1),  # shoulder_length
            round(random.uniform(30, 45), 1),  # shoulder_width
            round(random.uniform(20, 30), 1),  # shoulder_circumference_rest
            round(random.uniform(22, 35), 1),  # shoulder_circumference_flexed
            round(random.uniform(20, 30), 1),  # forearm_length
            round(random.uniform(15, 22), 1),  # hand_length
            round(random.uniform(15, 45), 1),  # dynamometry
            # Fat
            round(random.uniform(5, 20), 1),  # fat_triceps
            round(random.uniform(4, 15), 1),  # fat_biceps
            round(random.uniform(6, 18), 1),  # fat_subscapular
            round(random.uniform(5, 25), 1),  # fat_iliac
            round(random.uniform(4, 12), 1),  # fat_popliteal
            gender,
            0,  # is_deleted
        )
        records_data.append(record)

    cols = [
        "created_by_id",
        "created_at",
        "full_name",
        "school_name",
        "settlement",
        "birth_place",
        "birth_date",
        "father_nationality",
        "mother_nationality",
        "living_since",
        "enrolled_date",
        "living_conditions",
        "labor_regime",
        "past_illnesses",
        "children_count",
        "child_order",
        "feeding_type",
        "parents_marriage",
        "mother_health_status",
        "examination_date",
        "lower_leg_spina_iliaca",
        "lower_leg_symphysion",
        "tibiale_height",
        "pelvic_width",
        "thigh_length",
        "thigh_circumference",
        "calf_length",
        "calf_circumference",
        "foot_length",
        "teeth_count",
        "menstruation_start",
        "skull_longitudinal",
        "skull_transverse",
        "head_circumference",
        "forehead_transverse",
        "skull_height",
        "skull_base_length",
        "skull_base_width",
        "face_bizygomatic",
        "face_bigonial",
        "face_morphological_height",
        "face_physiognomic_height",
        "nose_height",
        "nose_width",
        "outer_canthal_width",
        "inner_canthal_width",
        "lips_mucosa_height",
        "mouth_width",
        "chest_standing_height",
        "chest_sitting_height",
        "weight",
        "trunk_length",
        "torso_length",
        "chest_circumference_pause",
        "chest_circumference_inhale",
        "chest_circumference_exhale",
        "waist_circumference",
        "abdomen_circumference",
        "upper_segment_length",
        "chest_transverse_diameter",
        "chest_anteroposterior_diameter",
        "chest_height",
        "arm_length",
        "shoulder_length",
        "shoulder_width",
        "shoulder_circumference_rest",
        "shoulder_circumference_flexed",
        "forearm_length",
        "hand_length",
        "dynamometry",
        "fat_triceps",
        "fat_biceps",
        "fat_subscapular",
        "fat_iliac",
        "fat_popliteal",
        "gender",
        "is_deleted",
    ]

    placeholders = ", ".join(["?"] * len(cols))
    sql = f"INSERT INTO research_records ({', '.join(cols)}) VALUES ({placeholders})"

    try:
        cursor.executemany(sql, records_data)
        conn.commit()
        print("Success: 10 research records created for superadmin!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_research()
