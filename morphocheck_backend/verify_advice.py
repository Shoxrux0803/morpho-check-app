import sys
import os
from io import BytesIO

# Add the current directory to sys.path to import services
sys.path.append(os.getcwd())

from services.indices_service import calculate_detailed_indices
from services.pdf_services import generate_pdf_report
from datetime import datetime

def generate_test_report(name, age, gender, height, weight, manual_data_override=None, filename="test.pdf"):
    bmi = weight / ((height / 100) ** 2)
    
    # Base manual data
    manual_data = {
        "total_body_water": weight * 0.6,
        "fat_mass": weight * 0.2,
        "fat_percent": 20.0,
        "muscle_mass": weight * 0.4,
        "bone_mass": weight * 0.05,
        "acm": weight * 0.3,
        "visceral_fat": 1.0
    }
    if manual_data_override:
        manual_data.update(manual_data_override)
        
    indices = calculate_detailed_indices(age, gender, height, weight, bmi, manual_data)
    
    full_data = {
        "first_name": name.split()[0],
        "last_name": name.split()[1] if len(name.split()) > 1 else "",
        "examination_date": datetime.now().strftime("%d.%m.%Y"),
        "birth_date": "01.01.2015",
        "age": age,
        "age_months": 0,
        "age_days": 0,
        "gender": gender,
        "region": "Jizzax viloyati",
        "district": "Jizzax shahri",
        "address": "Test ko'chasi, 1-uy",
        "preschool_institution": "Test MTT",
        "analysis": {
            "bmi": bmi,
            "bmi_category": "Test",
            "indices": indices
        }
    }
    
    pdf_buffer = generate_pdf_report(full_data)
    with open(filename, "wb") as f:
        f.write(pdf_buffer.getvalue())
    print(f"\n[SUCCESS] Report generated: {filename}")
    print(f"--- Advice for {name} ({gender}, {age}y) ---")
    for a in indices.get('advice', []):
        print(f"  * {a}")
    print("-" * 50)

if __name__ == "__main__":
    # Create tests directory if it doesn't exist
    if not os.path.exists("morphocheck_backend/tests"):
        os.makedirs("morphocheck_backend/tests")
        
    # Scenario 1: Normal
    generate_test_report("Normal Bola", 6, "o'g'il", 116.0, 20.5, filename="test_normal.pdf")
    
    # Scenario 2: Overweight + Giperstenik
    # height 135 (normal is ~138 for 10y), weight 45 (normal is ~32). BMI ~ 24.7 (high for 10y)
    generate_test_report("Semiz Bola", 10, "o'g'il", 135.0, 45.0, filename="test_overweight.pdf")
    
    # Scenario 3: Underweight + Astenik
    # height 130 (normal for 8y), weight 20 (normal is ~25). BMI ~ 12 (low)
    generate_test_report("Ozg'in Qiz", 8, "qiz", 130.0, 20.0, filename="test_underweight.pdf")
