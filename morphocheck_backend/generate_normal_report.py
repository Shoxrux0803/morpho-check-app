import sys
import os

# Add the current directory to sys.path to import services
sys.path.append(os.getcwd())

from services.indices_service import calculate_detailed_indices
from services.docx_services import generate_docx_report
from services.pdf_services import generate_pdf_report
from datetime import datetime

def generate_normal_jizzakh():
    # 1. Prepare "Normal" data for a 6-year-old boy
    # Based on medians in indices_service.py: height=116.0, weight=20.5
    age = 6
    gender = "og'il"
    height = 116.0
    weight = 20.5
    bmi = weight / ((height / 100) ** 2)
    
    # Mock manual bioimpedance data to get "Normal" values
    # tbw ~ 65%, fm ~ 15%
    manual_data = {
        "total_body_water": 13.3, # ~65% of 20.5
        "fat_mass": 3.1,          # ~15% of 20.5
        "fat_percent": 15.1,
        "muscle_mass": 14.0,
        "bone_mass": 2.6,
        "acm": 7.3,
        "visceral_fat": 1.0
    }
    
    # 2. Calculate indices
    indices = calculate_detailed_indices(age, gender, height, weight, bmi, manual_data)
    
    # Prepare full data for report
    full_data = {
        "full_name": "Нормал Болажон",
        "id_code": "JIZ-001",
        "examination_date": datetime.now().strftime("%d.%m.%Y"),
        "birth_date": "01.01.2020",
        "age": age,
        "age_months": 0,
        "age_days": 0,
        "gender": gender,
        "region": "Jizzax viloyati",
        "district": "Jizzax shahri",
        "address": "Navoiy ko'chasi, 1-uy",
        "preschool_institution": "1-MTT",
        "height": height,
        "weight": weight,
        "head": 51.0,
        "chest": 58.0,
        "waist": 52.0,
        "shoulder_length": 18.0,
        "shoulder_breadth": 25.0,
        "shoulder_circumference": 17.5,
        "arm_elbow_length": 15.0,
        "hand_length": 12.0,
        "thigh_length": 30.0,
        "thigh_circumference": 32.0,
        "calf_length": 25.0,
        "calf_circumference": 22.0,
        "foot_length": 18.0,
        "analysis": {
            "bmi": bmi,
            "z_score": 0.0, # Resulting Z-score for bmi-for-age roughly
            "bmi_category": "Меъёр",
            "indices": indices
        }
    }
    
    # 3. Generate DOCX
    docx_buffer = generate_docx_report(full_data)
    output_path = "normal_jizzakh_report.docx"
    with open(output_path, "wb") as f:
        f.write(docx_buffer.getvalue())

    # 4. Generate PDF
    pdf_buffer = generate_pdf_report(full_data)
    pdf_path = "normal_jizzakh_report.pdf"
    with open(pdf_path, "wb") as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"DOCX Report generated: {output_path}")
    print(f"PDF Report generated: {pdf_path}")
    print("--- Indices Results ---")
    for k, v in indices.items():
        if isinstance(v, (int, float)):
            print(f"{k}: {v}")
        else:
            print(f"{k}: {v}")

if __name__ == "__main__":
    generate_normal_jizzakh()
