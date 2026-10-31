# morphocheck_backend/services/norms_service.py

from typing import Any, Dict

# Extended reference table for typical anthropometric values (Birth to Adult)
# Values are for: [height, weight, chest, waist, head]
_NORM_TABLE = {
    "male": {
        0: [50.0, 3.3, 33.0, 30.0, 35.0],
        1: [75.7, 9.6, 46.0, 44.0, 46.0],
        2: [87.8, 12.2, 49.0, 47.0, 48.5],
        3: [96.1, 14.3, 51.0, 48.0, 50.0],
        5: [110.0, 18.3, 55.0, 51.0, 51.5],
        7: [121.7, 22.9, 60.0, 54.0, 52.0],
        10: [137.8, 31.2, 67.0, 59.0, 53.0],
        12: [149.1, 39.9, 73.0, 63.0, 54.0],
        14: [163.8, 50.8, 81.0, 68.0, 55.0],
        16: [173.4, 61.5, 87.0, 72.0, 56.0],
        18: [176.1, 70.3, 91.0, 76.0, 56.5],
        25: [177.0, 75.0, 95.0, 82.0, 57.0],
        40: [176.0, 80.0, 98.0, 88.0, 57.5],
        60: [174.0, 82.0, 100.0, 92.0, 57.5],
        80: [170.0, 75.0, 98.0, 94.0, 57.0],
    },
    "female": {
        0: [49.0, 3.2, 32.5, 29.5, 34.0],
        1: [74.0, 8.9, 45.0, 43.0, 45.0],
        2: [86.4, 11.5, 48.0, 46.0, 47.5],
        3: [95.1, 13.9, 50.0, 47.0, 49.5],
        5: [109.4, 17.6, 54.0, 50.0, 50.5],
        7: [120.8, 22.0, 59.0, 53.0, 51.5],
        10: [138.6, 31.9, 66.0, 58.0, 52.5],
        12: [151.2, 38.8, 72.0, 62.0, 53.5],
        14: [160.4, 48.3, 80.0, 67.0, 54.5],
        16: [163.1, 54.1, 84.0, 69.0, 55.0],
        18: [163.7, 56.7, 86.0, 70.0, 55.5],
        25: [164.0, 60.0, 88.0, 72.0, 56.0],
        40: [163.0, 65.0, 92.0, 78.0, 56.5],
        60: [161.0, 68.0, 95.0, 84.0, 56.5],
        80: [158.0, 62.0, 93.0, 86.0, 56.0],
    },
}


def get_typical_params(
    age: int,
    gender: str,
    target_form: str = "analysis",
    age_months: int = 0,
    age_days: int = 0,
) -> Dict[str, Any]:
    """
    Returns typical (normative) parameters for a given age and gender.
    Calculated using linear interpolation between key age points.
    Now supports birth (0) to elderly (80+).
    """
    gender_norm = (
        "female"
        if any(x in gender.lower() for x in ["girl", "female", "ayol", "qiz"])
        else "male"
    )
    table = _NORM_TABLE[gender_norm]
    precise_age = (
        float(age) + (float(age_months) / 12.0) + (float(age_days) / 365.2425)
    )

    ages = sorted(table.keys())

    # Clamp age to table range
    if precise_age <= ages[0]:
        base_vals = table[ages[0]]
    elif precise_age >= ages[-1]:
        base_vals = table[ages[-1]]
    else:
        # Interpolate
        lower_age = max([a for a in ages if a <= precise_age])
        upper_age = min([a for a in ages if a > precise_age])

        lower_vals = table[lower_age]
        upper_vals = table[upper_age]

        # Avoid division by zero
        if upper_age == lower_age:
            base_vals = lower_vals
        else:
            ratio = (precise_age - lower_age) / (upper_age - lower_age)
            base_vals = [
                round(lower_vals[i] + (upper_vals[i] - lower_vals[i]) * ratio, 1)
                for i in range(len(lower_vals))
            ]

    h, w, c, wa, head = base_vals
    params = {
        "height": h,
        "weight": w,
        "chest": c,
        "waist": wa,
        "head": head,
    }

    # Logic for anatomical proportionality based on age group
    if age < 3:
        # Infant/Toddler proportions
        params.update(
            {
                "bodyLength": round(h * 0.4, 1),
                "shoulderLength": round(h * 0.15, 1),
                "totalBodyWater": round(w * 0.75, 1),  # Infants have higher TBW
                "fatPercent": 25.0,  # Babies are "chubby"
            }
        )
    elif age < 20:
        # Child/Adolescent
        params.update(
            {
                "bodyLength": round(h * 0.45, 1),
                "totalBodyWater": round(w * 0.65, 1),
                "fatPercent": 18.0 if gender_norm == "male" else 22.0,
            }
        )
    else:
        # Adult
        params.update(
            {
                "bodyLength": round(h * 0.48, 1),
                "totalBodyWater": round(w * 0.6, 1)
                if gender_norm == "male"
                else round(w * 0.5, 1),
                "fatPercent": 22.0 if gender_norm == "male" else 28.0,
            }
        )

    # Add shared defaults if not already present
    defaults = {
        "shoulderLength": round(h * 0.18, 1),
        "shoulderBreadth": round(h * 0.22, 1),
        "shoulderCircumference": round(c * 0.9, 1),
        "armElbowLength": round(h * 0.15, 1),
        "handLength": round(h * 0.11, 1),
        "thighLength": round(h * 0.25, 1),
        "thighCircumference": round(wa * 0.8, 1),
        "calfLength": round(h * 0.22, 1),
        "calfCircumference": round(wa * 0.5, 1),
        "footLength": round(h * 0.15, 1),
        "fatMass": round(w * (params.get("fatPercent", 20) / 100), 1),
        "muscleMass": round(w * 0.4, 1),
        "boneMass": round(w * 0.05, 1),
        "acm": round(w * 0.3, 1),
        "visceralFat": 1.0 if age < 12 else (3.0 if age < 30 else 5.0),
    }

    for k, v in defaults.items():
        if k not in params:
            params[k] = v

    # Key mapping for Research Form
    if target_form == "research":
        research_mapping = {
            "height": "chest_standing_height",
            "bodyLength": "trunk_length",
            "chest": "chest_circumference_pause",
            "waist": "waist_circumference",
            "head": "head_circumference",
            "shoulderLength": "shoulder_length",
            "shoulderBreadth": "shoulder_width",
            "shoulderCircumference": "shoulder_circumference_rest",
            "armElbowLength": "forearm_length",
            "handLength": "hand_length",
            "thighLength": "thigh_length",
            "thighCircumference": "thigh_circumference",
            "calfLength": "calf_length",
            "calfCircumference": "calf_circumference",
            "footLength": "foot_length",
        }

        research_params = {}
        for k, v in params.items():
            mapped_key = research_mapping.get(k, k)
            research_params[mapped_key] = v

        # Specific research-only extras - covering 100% of fields
        research_params.update(
            {
                "chest_sitting_height": round(params["height"] * 0.52, 1),
                "chest_circumference_inhale": round(params["chest"] + 3, 1),
                "chest_circumference_exhale": round(params["chest"] - 2, 1),
                "torso_length": round(params["height"] * 0.3, 1),
                "upper_segment_length": round(params["height"] * 0.5, 1),
                "chest_transverse_diameter": round(params["chest"] * 0.3, 1),
                "chest_anteroposterior_diameter": round(params["chest"] * 0.22, 1),
                "chest_height": round(params["height"] * 0.15, 1),
                "arm_length": round(params["height"] * 0.4, 1),
                "shoulder_circumference_flexed": round(
                    params["shoulderCircumference"] + 2, 1
                ),
                "skull_longitudinal": round(params["head"] * 0.33, 1),
                "skull_transverse": round(params["head"] * 0.25, 1),
                "skull_height": round(params["height"] * 0.08, 1),
                "face_bizygomatic": round(params["head"] * 0.25, 1),
                "face_morphological_height": round(params["height"] * 0.07, 1),
                # Additional missing fields
                "lower_leg_total": round(params["height"] * 0.53, 1),
                "lower_leg_length": round(params["height"] * 0.5, 1),
                "lower_leg_spina_iliaca": round(params["height"] * 0.53, 1),
                "lower_leg_symphysion": round(params["height"] * 0.48, 1),
                "tibiale_height": round(params["height"] * 0.25, 1),
                "pelvic_width": round(params["height"] * 0.16, 1),
                "abdomen_circumference": round(params["waist"] * 1.05, 1),
                "forehead_transverse": round(params["head"] * 0.2, 1),
                "skull_base_length": round(params["head"] * 0.3, 1),
                "skull_base_width": round(params["head"] * 0.22, 1),
                "face_bigonial": round(params["head"] * 0.18, 1),
                "face_physiognomic_height": round(params["height"] * 0.1, 1),
                "nose_height": round(params["height"] * 0.03, 1),
                "nose_width": round(params["height"] * 0.02, 1),
                "outer_canthal_width": round(params["head"] * 0.16, 1),
                "inner_canthal_width": round(params["head"] * 0.05, 1),
                "lips_mucosa_height": 0.8 if age < 12 else 1.2,
                "mouth_width": round(params["head"] * 0.08, 1),
                "dynamometry": round(params["weight"] * 0.45, 1),
                "fat_triceps": 12.0 if gender_norm == "female" else 8.0,
                "fat_biceps": 8.0 if gender_norm == "female" else 5.0,
                "fat_subscapular": 10.0 if gender_norm == "female" else 7.0,
                "fat_iliac": 14.0 if gender_norm == "female" else 9.0,
                "fat_popliteal": 6.0 if gender_norm == "female" else 4.0,
                "teeth_count": 20 if age < 6 else (28 if age < 18 else 32),
                "arm_circumference_total": round(params["shoulderCircumference"], 1),
                "menstruation_start": "12-14 yosh"
                if (gender_norm == "female" and age >= 11)
                else "",
            }
        )
        return research_params

    return params
