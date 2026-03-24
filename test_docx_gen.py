
import sys
import os

# Backend yo'lini qo'shish
sys.path.append(os.path.abspath("morphocheck_backend"))

from services.docx_services import generate_docx_report

test_data = {
    "full_name": "Test Bolajon",
    "age": 3,
    "gender": "o'g'il",
    "weight": 15.0,
    "height": 95.0,
    "analysis": {
        "bmi": 16.6,
        "bmi_category": "Меъёр",
        "indices": {
            "tbw_percent": 65.0,
            "tbw_norm": "60-70%",
            "fm_percent": 15.0,
            "fm_norm": "12-21%",
            "fm": 2.2,
            "fm_kg_norm": "1.8-3.2 кг",
            "muscle_mass": 10.0,
            "muscle_norm": "35-40%",
            "bone_mass": 1.5,
            "bone_norm": "4-6%",
            "acm_percent": 55.0,
            "acm_norm": "50-60%",
            "visceral_fat": 1,
            "visceral_norm": "1-4"
        }
    }
}

try:
    buffer = generate_docx_report(test_data)
    with open("test_output_v2.docx", "wb") as f:
        f.write(buffer.getbuffer())
    print("Docx generated successfully: test_output_v2.docx")
except Exception as e:
    print(f"Error: {e}")
