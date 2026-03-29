import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_body_length_analysis():
    payload = {
        "firstName": "Test",
        "lastName": "User",
        "region": "Tashkent",
        "district": "Yunsabad",
        "address": "Test Street",
        "age": 10,
        "gender": "erkak",
        "height": 140,
        "weight": 35,
        "chest": 70,
        "waist": 60,
        "head": 52,
        "examinationDate": "2024-03-25",
        "birthDate": "2014-03-25",
        "preschoolInstitution": "MTM 1",
        "shoulderLength": 15,
        "shoulderBreadth": 30,
        "shoulderCircumference": 20,
        "armElbowLength": 25,
        "handLength": 15,
        "thighLength": 35,
        "thighCircumference": 40,
        "calfLength": 30,
        "calfCircumference": 25,
        "footLength": 20,
        "bodyLength": 140.5, # New field
        "totalBodyWater": 20,
        "fatPercent": 15,
        "fatMass": 5,
        "muscleMass": 25,
        "boneMass": 2,
        "acm": 12,
        "visceralFat": 2
    }
    
    # Fix typo in manual copy
    payload["handLength"] = 15
    if "handLength: 15" in payload: del payload["handLength: 15"]

    print(f"Testing analysis with bodyLength: {payload['bodyLength']}")
    
    response = requests.post(f"{BASE_URL}/api/analyze/full", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Full Response: {json.dumps(data, indent=2)}")
        print("Analysis successful!")
        # Check indices
        # Structure is analysis -> indices
        indices = data.get("analysis", {}).get("indices", {})
        z_body = indices.get("z_body_length")
        print(f"Z-score for Body Length: {z_body}")
        
        advice = indices.get("advice", [])
        body_advice = [a for a in advice if "tana uzunligi" in a.lower()]
        print(f"Advice for Body Length: {body_advice}")
        
        if z_body is not None:
            print("SUCCESS: Body Length Z-score calculated.")
        else:
            print("FAILURE: Body Length Z-score missing.")
            
        if body_advice:
            print("SUCCESS: Body Length advice generated.")
        else:
            print("FAILURE: Body Length advice missing.")
    else:
        print(f"Analysis failed with status {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_body_length_analysis()
