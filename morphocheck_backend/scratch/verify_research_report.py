import sys
import os

# Add the backend directory to sys.path
backend_dir = r"d:\BOT\morpho-check-app\morphocheck_backend"
sys.path.append(backend_dir)

from services.research_docx import generate_researcher_docx

sample_data = {
    "full_name": "Test Testov",
    "school_name": "School #1",
    "settlement": "Tashkent",
    "birth_place": "Tashkent",
    "birth_date": "2010-01-01",
    "father_nationality": "Uzbek",
    "mother_nationality": "Uzbek",
    "living_since": "5 years",
    "enrolled_date": "2023-09-01",
    "living_conditions": "Good",
    "labor_regime": "Standard",
    "past_illnesses": "None",
    "children_count": 2,
    "child_order": 1,
    "feeding_type": "Natural",
    "parents_marriage": "Non-relative",
    "mother_health_status": "Healthy",
    "examination_date": "2024-04-25",
    
    # Problematic fields
    "lower_leg_spina_iliaca": 85.5,
    "lower_leg_symphysion": 78.2,
    "tibiale_height": 42.1,
    "pelvic_width": 25.4,
    "thigh_length": 45.3,
    "thigh_circumference": 50.1,
    "calf_length": 38.2,
    "calf_circumference": 32.5,
    "foot_length": 24.6,
    "teeth_count": 28,
    "menstruation_start": "13 years",
}

def test_report(lang="uz"):
    print(f"Generating test report for lang: {lang}")
    buf = generate_researcher_docx(sample_data, lang=lang)
    filename = f"test_research_report_{lang}.docx"
    with open(filename, "wb") as f:
        f.write(buf.getbuffer())
    print(f"Saved to {filename}")

if __name__ == "__main__":
    test_report("uz")
    test_report("ru")
