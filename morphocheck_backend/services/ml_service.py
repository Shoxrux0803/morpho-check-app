import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
import random

# Dummy Data and Models Initialization
_height_model = LinearRegression()
X_height = np.array(
    [
        [5, 110, 0, 175, 160],
        [10, 140, 0, 180, 165],
        [15, 170, 0.5, 170, 160],
        [7, 120, -1, 165, 155],
        [12, 150, 1, 185, 170],
    ]
)
y_height = np.array([174, 181, 171, 166, 186])
_height_model.fit(X_height, y_height)

_risk_model = RandomForestClassifier(n_estimators=50, random_state=42)
X_risk = np.array(
    [
        [5, 15, 0, 1],
        [10, 25, 2.5, 2],
        [15, 18, -1.5, 0],
        [8, 22, 1.8, 2],
        [12, 19, 0.5, 1],
    ]
)
y_risk = np.array([[0, 0, 0], [1, 1, 1], [0, 0, 1], [1, 0, 0], [0, 0, 0]])
_risk_model.fit(X_risk, y_risk)


def predict_adult_height(
    age: int,
    gender: str,
    height: float,
    z_score: float,
    father_height: float = None,
    mother_height: float = None,
) -> float:
    if age >= 18:
        return height
    f_h = father_height if father_height else (175.0 if gender == "erkak" else 170.0)
    m_h = mother_height if mother_height else (162.0 if gender == "erkak" else 160.0)
    features = np.array([[age, height, z_score, f_h, m_h]])
    pred = _height_model.predict(features)[0]
    if father_height and mother_height:
        genetic_potential = (
            father_height
            + mother_height
            + (13 if (gender == "erkak" or gender == "male") else -13)
        ) / 2
        final_pred = (pred * 0.4) + (genetic_potential * 0.6)
    else:
        base_adult = 176 if (gender == "erkak" or gender == "male") else 163
        final_pred = base_adult + (z_score * 4)
    return round(final_pred, 1)


def predict_health_risks(age: int, bmi: float, z_score: float, somatotype: str) -> dict:
    soma_map = {"ektomorf": 0, "mezomorf": 1, "endomorf": 2}
    s_val = 1
    for k, v in soma_map.items():
        if somatotype and k in somatotype.lower():
            s_val = v
            break
    features = np.array([[age, bmi, z_score, s_val]])
    probas = _risk_model.predict_proba(features)
    try:
        obesity_risk = probas[0][0][1] * 100
        metabolic_risk = probas[1][0][1] * 100
        musculo_risk = probas[2][0][1] * 100
    except IndexError:
        obesity_risk, metabolic_risk, musculo_risk = 0, 0, 0

    if z_score > 2:
        obesity_risk = max(obesity_risk, random.uniform(75, 95))
        metabolic_risk = max(metabolic_risk, random.uniform(60, 85))
    elif z_score > 1:
        obesity_risk = max(obesity_risk, random.uniform(40, 65))
        metabolic_risk = max(metabolic_risk, random.uniform(30, 50))
    elif z_score < -1.5:
        musculo_risk = max(musculo_risk, random.uniform(40, 70))

    if s_val == 2:
        obesity_risk += 15
        metabolic_risk += 10
    elif s_val == 0:
        musculo_risk += 15

    return {
        "obesity_risk": min(round(obesity_risk, 1), 99.0),
        "metabolic_syndrome_risk": min(round(metabolic_risk, 1), 99.0),
        "musculoskeletal_risk": min(round(musculo_risk, 1), 99.0),
    }


def get_ml_predictions(data: dict, lang: str = "uz") -> dict:
    age = data.get("age", 0)
    gender = data.get("gender", "erkak")
    height = data.get("height", 0)
    bmi = data.get("bmi", 0)
    z_score = data.get("z_score", 0)
    somatotype = data.get("somatotype", "mezomorf")
    father_height = data.get("father_height")
    mother_height = data.get("mother_height")

    adult_height = predict_adult_height(
        age, gender, height, z_score, father_height, mother_height
    )
    risks = predict_health_risks(age, bmi, z_score, somatotype)

    _T = {
        "obesity_risk": {
            "uz": "Semizlik xavfi",
            "ru": "Риск ожирения",
            "en": "Obesity Risk",
            "kz": "Семіздік қаупі",
        },
        "metabolic_syndrome_risk": {
            "uz": "Metabolik sindrom xavfi",
            "ru": "Риск метаболического синдрома",
            "en": "Metabolic Syndrome Risk",
            "kz": "Метаболикалық синдром қаупі",
        },
        "musculoskeletal_risk": {
            "uz": "Tayanch-harakat tizimi xavfi",
            "ru": "Риск опорно-двигательной системы",
            "en": "Musculoskeletal Risk",
            "kz": "Тірек-қимыл жүйесінің қаупі",
        },
        "status": {
            "low": {"uz": "Past", "ru": "Низкий", "en": "Low", "kz": "Төмен"},
            "med": {
                "uz": "O'rtacha",
                "ru": "Умеренный",
                "en": "Moderate",
                "kz": "Орташа",
            },
            "high": {"uz": "Yuqori", "ru": "Высокий", "en": "High", "kz": "Жоғары"},
        },
    }

    translated_risks = []
    for key, val in risks.items():
        label = _T.get(key, {}).get(lang, key)
        status_key = "low" if val < 30 else ("med" if val < 60 else "high")
        status_label = _T["status"][status_key].get(lang, status_key)
        translated_risks.append(
            {
                "id": key,
                "label": label,
                "value": val,
                "status": status_label,
                "color": "green"
                if status_key == "low"
                else ("orange" if status_key == "med" else "red"),
            }
        )

    return {
        "adult_height_prediction": adult_height,
        "risks": risks,
        "translated_risks": translated_risks,
        "prediction_labels": {
            "height_label": {
                "uz": "Bashorat qilingan bo'y (18 yoshda)",
                "ru": "Прогноз роста (в 18 лет)",
                "en": "Predicted Height (at 18)",
                "kz": "Болжамды бойы (18 жаста)",
            }.get(lang, "Height Prediction")
        },
    }
