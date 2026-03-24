import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath("morphocheck_backend"))

from services.docx_services import generate_docx_report
from services.indices_service import calculate_detailed_indices

# Mock data for a 3-year-old boy
mock_data = {
    "examination_date": "23.03.2026",
    "birth_date": "15.05.2023",
    "age": "3",
    "age_months": "10",
    "age_days": "8",
    "gender": "o'g'il",
    "preschool_institution": "Nurobod bog'chasi",
    "region": "Samarqand",
    "district": "Nurobod",
    "address": "Mustaqillik ko'chasi, 12-uy",
    "full_name": "Toshpo'latov Alisher",
    "id_code": "MC-2026-001",
    "height": 98.5,
    "weight": 15.2,
    "head": 50.0,
    "chest": 52.0,
    "waist": 48.0,
    "shoulder_length": 15.0,
    "shoulder_breadth": 22.0,
    "shoulder_circumference": 16.0,
    "arm_elbow_length": 14.0,
    "hand_length": 10.0,
    "thigh_length": 25.0,
    "thigh_circumference": 28.0,
    "calf_length": 20.0,
    "calf_circumference": 18.0,
    "foot_length": 14.0,
}

# Calculate indices
bmi = 15.2 / ((98.5 / 100) ** 2)
indices = calculate_detailed_indices(3, "o'g'il", 98.5, 15.2, bmi)

mock_data["analysis"] = {
    "bmi": bmi,
    "bmi_category": "Меъёр",
    "z_score": indices["z_bmi"],
    "indices": indices
}

# Generate report
buffer = generate_docx_report(mock_data)

output_path = "test_output.docx"
with open(output_path, "wb") as f:
    f.write(buffer.getvalue())

print(f"Report generated successfully: {output_path}")
print(f"Fat Mass Norm: {indices['fm_norm']}")
print(f"Fat Mass KG Norm: {indices['fm_kg_norm']}")
