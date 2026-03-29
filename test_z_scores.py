
import sys
import os

# Backend path
sys.path.append(os.path.abspath("morphocheck_backend"))

from services.indices_service import calculate_detailed_indices

def get_bmi_cat(bmi):
    if bmi < 18.5: return "Дефицит массы"
    if bmi >= 30: return "Ожирение"
    if bmi >= 25: return "Избыточный вес"
    return "Норма"

def test_case(age, gender, height, weight):
    bmi = weight / ((height/100)**2)
    res = calculate_detailed_indices(age=age, gender=gender, height=height, weight=weight, bmi=bmi)
    
    print(f"--- TEST CASE: Age={age}, Gender={gender}, H={height}, W={weight} ---")
    print(f"BMI: {bmi:.1f} ({get_bmi_cat(bmi)})")
    print(f"Somatotype: {res['morphological_type']}")
    print(f"Z-scores: Z_H={res.get('z_h')}, Z_W={res.get('z_w')}, Z_BMI={res.get('z_bmi')}")
    print(f"Indices: HMAI={res.get('hmai')} ({res.get('hmai_desc')})")
    print(f"MII={res.get('mii')} ({res.get('mii_desc')})")
    print(f"ADI={res.get('adi')} ({res.get('adi_desc')})")
    print(f"Advice (count): {len(res.get('advice', []))}")
    if res.get('advice'):
        print(f"Sample advice: {res.get('advice')[0][:100]}...")
    print("-" * 50)

# 1. 5 year old boy, normal
test_case(5, "erkak", 110.0, 18.5)

# 2. 5 year old boy, obese
test_case(5, "erkak", 110.0, 25.0)

# 3. 12 year old girl, underweight
test_case(12, "ayol", 145.0, 30.0)

# 4. 25 year old adult, obese (BMI > 30)
test_case(25, "erkak", 180.0, 105.0)

# 5. 2 year old, stunted (low height)
test_case(2, "ayol", 75.0, 11.0)
