
import sys
import os

# Add parent directory to sys.path to import modules correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from morphocheck_backend.routers.analyze_router import calculate_bmi as calc_full_bmi, PatientData
from morphocheck_backend.services.clinical_service import clinical_service
from morphocheck_backend.utils.database import SessionLocal

def test_calc():
    db = SessionLocal()
    try:
        all_settings = clinical_service.get_all_settings(db)
        print(f"Fetched {len(all_settings)} settings.")
        
        p_data = PatientData(
            firstName="Test", lastName="User", region="Toshkent", 
            address="Street 1", examinationDate="2023-01-01", age=25, 
            gender="erkak", height=180.0, weight=80.0, chest=90.0, head=55.0,
            waist=80.0, shoulderBreadth=40.0, thighCircumference=50.0
        )
        
        analysis = calc_full_bmi(p_data, all_settings=all_settings, lang="uz")
        print("Calculation successful!")
        print(f"BMI: {analysis.get('bmi')}")
        print(f"Category: {analysis.get('bmi_category')}")
        print(f"Somatotype: {analysis.get('somatotype')}")
        
        if not analysis.get('bmi_category') or analysis.get('bmi_category') == "-":
             print("ERROR: BMI category is empty or '-'")
        else:
             print("SUCCESS: Data is present.")
             
    except Exception as e:
        print(f"FAILED with error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_calc()
