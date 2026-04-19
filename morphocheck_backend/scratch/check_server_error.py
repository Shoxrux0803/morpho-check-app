import sys
import os

# Add the backend directory to sys.path
backend_path = os.path.abspath("morphocheck_backend")
sys.path.append(backend_path)

try:
    from services.research_docx import generate_researcher_docx
    print("Import successful!")
    
    test_data = {
        "full_name": "Test User",
        "school_name": "Test School",
        "settlement": "Test City",
        "birth_place": "Test Birthplace",
        "birth_date": "2010.01.01",
        "father_nationality": "Uzbek",
        "mother_nationality": "Uzbek",
        "living_since": "Always",
        "enrolled_date": "2020.01.01",
        "living_conditions": "Good",
        "labor_regime": "Standard",
        "past_illnesses": "None",
        "children_count": 1,
        "child_order": 1,
        "feeding_type": "Tabiiy",
        "parents_marriage": "Boshqa",
        "mother_health_status": "Sog'lom"
    }
    
    buf = generate_researcher_docx(test_data, lang="ru")
    print("Report generation successful!")
    
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()
