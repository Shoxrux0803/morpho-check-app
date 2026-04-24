# morphocheck_backend/services/ai_advice_service.py

import os
import google.generativeai as genai
from typing import List, Dict, Optional
import json

def get_gemini_model():
    """Configures Gemini and returns a model name to use."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        # We'll try these models in order during generation
        return True
    except:
        return None

def get_fallback_tips(lang: str = "uz") -> List[str]:
    """Returns basic tips if AI is unavailable."""
    fallbacks = {
        "uz": [
            "Sog'lom ovqatlanish rejimiga amal qiling.",
            "Kunlik jismoniy faollikni ta'minlang.",
            "Uyqu va dam olish vaqtini muvozanatlang."
        ],
        "ru": [
            "Соблюдайте режим здорового питания.",
            "Обеспечьте ежедневную физическую активность.",
            "Соблюдайте баланс сна и отдыха."
        ],
        "en": [
            "Maintain a healthy diet.",
            "Ensure daily physical activity.",
            "Balance sleep and rest time."
        ],
        "kz": [
            "Салауатты тамақтану режимін сақтаңыз.",
            "Күнделікті физикалық белсенділікті қамтамасыз етіңіз.",
            "Ұйқы мен демалыс уақытын теңгеріңіз."
        ]
    }
    return fallbacks.get(lang, fallbacks["uz"])

def generate_parent_tips(patient_data: Dict, ml_predictions: Dict, lang: str = "uz") -> List[str]:
    """
    Generates 3 ultra-short, parent-friendly tips based on patient data and ML predictions.
    """
    model = get_gemini_model()
    if not model:
        return get_fallback_tips(lang)

    # Prepare context for the AI
    age = patient_data.get("age", 0)
    gender = patient_data.get("gender", "unknown")
    bmi = patient_data.get("bmi", 0)
    z_score = patient_data.get("z_score", 0)
    
    adult_height = ml_predictions.get("adult_height_prediction", "N/A")
    risks = ml_predictions.get("risks", {})
    
    prompt = f"""
    Act as a professional pediatric anthropometrist. 
    Based on the following data for a {age}-year-old {gender} child, provide exactly 3 ultra-short advice/tips for their parents.
    
    DATA:
    - Current BMI: {bmi}
    - Z-Score (Physical Development): {z_score}
    - Predicted Adult Height: {adult_height} cm
    - Health Risks: Obesity {risks.get('obesity_risk') or 0}%, Metabolic {risks.get('metabolic_syndrome_risk') or 0}%, Musculoskeletal {risks.get('musculoskeletal_risk') or 0}%
    
    INSTRUCTIONS:
    1. Respond in {lang.upper()} language.
    2. Provide exactly 3 bullet points.
    3. Each point MUST be ultra-short (max 5-7 words).
    4. Focus on practical, positive actions for parents.
    5. No medical jargon. No alarmist language.
    6. Return ONLY the list items, no header, no intro.
    """

    last_error = None
    model_names = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Parse the response into a list
            tips = []
            for line in text.split('\n'):
                line = line.strip()
                if not line: continue
                if line.startswith('•') or line.startswith('-') or (line and line[0].isdigit() and (line[1] == '.' or line[1] == ')')):
                    clean_tip = line.lstrip('•-0123456789.() ').strip()
                    if clean_tip:
                        tips.append(clean_tip)
                else:
                    tips.append(line)
            
            if tips:
                return tips[:3]
        except Exception as e:
            last_error = e
            continue
            
    print(f"[AI ADVICE ERROR] All models failed. Last error: {str(last_error)}")
    return get_fallback_tips(lang)
