import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
import random

# Dummy Data and Models Initialization
# In a real scenario, these models should be trained on a large dataset
# and loaded via joblib or pickle.

# 1. Height Prediction Model
# We use a Linear Regression model.
# Features: [current_age, current_height, current_z_score, father_height, mother_height]
_height_model = LinearRegression()

# Let's mock training data for height to give reasonable weights
# Khamis-Roche approximation idea
X_height = np.array([
    [5, 110, 0, 175, 160],
    [10, 140, 0, 180, 165],
    [15, 170, 0.5, 170, 160],
    [7, 120, -1, 165, 155],
    [12, 150, 1, 185, 170]
])
# Adult height targets roughly
y_height = np.array([174, 181, 171, 166, 186])
_height_model.fit(X_height, y_height)


# 2. Risk Prediction Model
# We use a Random Forest Classifier to predict risk probabilities.
# Features: [age, bmi, z_score, somatotype_encoded, height_percentile]
_risk_model = RandomForestClassifier(n_estimators=50, random_state=42)

# Mock training data for risks (0: low risk, 1: high risk)
# [age, bmi, z_score, somatotype (0:ecto, 1:meso, 2:endo)]
X_risk = np.array([
    [5, 15, 0, 1],    # Normal
    [10, 25, 2.5, 2], # Obese
    [15, 18, -1.5, 0],# Underweight
    [8, 22, 1.8, 2],  # Overweight
    [12, 19, 0.5, 1]  # Normal
])
# Target risks: [Obesity, Metabolic, Musculoskeletal]
# For simplicity, let's train separate models or a multi-output
# Actually, scikit-learn RFC supports multi-output classification
y_risk = np.array([
    [0, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, 0]
])
_risk_model.fit(X_risk, y_risk)

def predict_adult_height(age: int, gender: str, height: float, z_score: float, father_height: float = None, mother_height: float = None) -> float:
    """
    Bolaning 18 yoshdagi taxminiy bo'yini bashorat qiladi.
    Agar ota-onaning bo'yi kiritilmagan bo'lsa, o'rtacha qiymatlar olinadi.
    """
    if age >= 18:
        return height
        
    f_h = father_height if father_height else (175.0 if gender == 'erkak' else 170.0)
    m_h = mother_height if mother_height else (162.0 if gender == 'erkak' else 160.0)
    
    # Predict using the mocked Linear Regression
    features = np.array([[age, height, z_score, f_h, m_h]])
    pred = _height_model.predict(features)[0]
    
    # Add a bit of realistic boundary
    # Boy's genetic potential: (father + mother + 13) / 2
    # Girl's genetic potential: (father + mother - 13) / 2
    if father_height and mother_height:
        if gender == 'erkak' or gender == 'male':
            genetic_potential = (father_height + mother_height + 13) / 2
        else:
            genetic_potential = (father_height + mother_height - 13) / 2
            
        # Combine model prediction with genetic potential (weighted)
        final_pred = (pred * 0.4) + (genetic_potential * 0.6)
    else:
        # Rely more on current height percentile/z-score if parents not known
        # Approximate using WHO standard shift
        base_adult = 176 if (gender == 'erkak' or gender == 'male') else 163
        final_pred = base_adult + (z_score * 4) # roughly 4cm per z-score unit at adult age
        
    return round(final_pred, 1)

def predict_health_risks(age: int, bmi: float, z_score: float, somatotype: str) -> dict:
    """
    Kelajakda kasalliklar rivojlanish xavfini (%) bashorat qiladi.
    """
    soma_map = {"ektomorf": 0, "mezomorf": 1, "endomorf": 2}
    # Handle cases where somatotype might be missing or different
    s_val = 1
    for k, v in soma_map.items():
        if somatotype and k in somatotype.lower():
            s_val = v
            break
            
    features = np.array([[age, bmi, z_score, s_val]])
    
    # Get probabilities from RandomForest
    # RFC.predict_proba returns a list of arrays for multi-output
    probas = _risk_model.predict_proba(features)
    
    # probas format for multi-output: [array([[p0, p1]]), array([[p0, p1]]), array([[p0, p1]])]
    
    try:
        obesity_risk = probas[0][0][1] * 100
        metabolic_risk = probas[1][0][1] * 100
        musculo_risk = probas[2][0][1] * 100
    except IndexError:
        obesity_risk = 0
        metabolic_risk = 0
        musculo_risk = 0
        
    # Heuristic adjustments for more realistic UI presentation since training data is mock
    if z_score > 2:
        obesity_risk = max(obesity_risk, random.uniform(75, 95))
        metabolic_risk = max(metabolic_risk, random.uniform(60, 85))
    elif z_score > 1:
        obesity_risk = max(obesity_risk, random.uniform(40, 65))
        metabolic_risk = max(metabolic_risk, random.uniform(30, 50))
    elif z_score < -1.5:
        musculo_risk = max(musculo_risk, random.uniform(40, 70))
        
    if s_val == 2: # Endomorph
        obesity_risk += 15
        metabolic_risk += 10
    elif s_val == 0: # Ectomorph
        musculo_risk += 15
        
    return {
        "obesity_risk": min(round(obesity_risk, 1), 99.0),
        "metabolic_syndrome_risk": min(round(metabolic_risk, 1), 99.0),
        "musculoskeletal_risk": min(round(musculo_risk, 1), 99.0)
    }

def get_ml_predictions(data: dict) -> dict:
    """
    Barcha ML bashoratlarini bitta lug'atda qaytaradi.
    """
    age = data.get('age', 0)
    gender = data.get('gender', 'erkak')
    height = data.get('height', 0)
    bmi = data.get('bmi', 0)
    z_score = data.get('z_score', 0)
    somatotype = data.get('somatotype', 'mezomorf')
    father_height = data.get('father_height')
    mother_height = data.get('mother_height')
    
    adult_height = predict_adult_height(age, gender, height, z_score, father_height, mother_height)
    risks = predict_health_risks(age, bmi, z_score, somatotype)
    
    return {
        "adult_height_prediction": adult_height,
        "risks": risks
    }
