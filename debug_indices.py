import sys
import os

# Add the morphocheck_backend directory to the path
sys.path.append(os.path.abspath("morphocheck_backend"))

from services.indices_service import calculate_detailed_indices

def debug():
    age = 10
    gender = "erkak"
    height = 140
    weight = 35
    bmi = 17.9
    manual_bio = {
        "body_length": 140.5
    }
    
    print(f"Calling calculate_detailed_indices with body_length: {manual_bio['body_length']}")
    result = calculate_detailed_indices(age, gender, height, weight, bmi, manual_bio)
    
    print(f"Resulting z_body_length: {result.get('z_body_length')}")
    print(f"Advice count: {len(result.get('advice', []))}")
    for a in result.get('advice', []):
        if "tana uzunligi" in a.lower():
            print(f"Found advice: {a}")

if __name__ == "__main__":
    debug()
