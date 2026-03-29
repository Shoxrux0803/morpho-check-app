import sys
import os
from io import BytesIO

# Add backend path
sys.path.append(os.path.abspath("morphocheck_backend"))

from routers.analyze_router import BMI_CATEGORIES
print("Successfully imported BMI_CATEGORIES from analyze_router")

from services.pdf_services import generate_pdf_file

mock_data = {
    "first_name": "Test",
    "last_name": "User",
    "age": 25,
    "gender": "erkak",
    "height": 180,
    "weight": 80,
    "analysis": {
        "bmi": 24.7,
        "bmi_category": "Normal",
        "somatotype": "normostenik",
        "ideal_weight": 75.0,
        "weight_diff": 5.0,
        "ideal_weight_range": {"min": 65, "max": 80},
        "indices": {
            "hmai": 1.0,
            "hmai_desc": "Optimal",
            "mii": 2.0,
            "mii_desc": "Normal",
            "adi": 0.5,
            "adi_desc": "Uyg'un",
            "advice": ["Test advice"]
        }
    }
}

try:
    buffer = generate_pdf_file(mock_data, lang="uz")
    print("PDF generation successful!")
    with open("test_verify.pdf", "wb") as f:
        f.write(buffer.getvalue())
    print("Test PDF saved to test_verify.pdf")
except Exception as e:
    import traceback
    print("PDF generation FAILED:")
    print(traceback.format_exc())
