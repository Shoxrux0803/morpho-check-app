import requests

BASE_URL = "http://localhost:8000/api"
PATIENT_ID = 5 # This patient has low BMI (< 18.5)

def get_token():
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@admin.com",
        "password": "admin123"
    })
    return resp.json()["access_token"]

def main():
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Testing PDF report for patient {PATIENT_ID} (Low BMI)...")
    resp_pdf = requests.get(f"{BASE_URL}/pdf/report-by-id/{PATIENT_ID}?lang=uz", headers=headers)
    if resp_pdf.status_code == 200:
        print("SUCCESS: PDF report generated (200 OK)")
    else:
        print(f"FAILED: PDF report status {resp_pdf.status_code}")
        print(resp_pdf.json())
        
    print(f"\nTesting DOCX report for patient {PATIENT_ID} (Low BMI)...")
    resp_docx = requests.get(f"{BASE_URL}/pdf/report-docx-by-id/{PATIENT_ID}?lang=uz", headers=headers)
    if resp_docx.status_code == 200:
        print("SUCCESS: DOCX report generated (200 OK)")
    else:
        print(f"FAILED: DOCX report status {resp_docx.status_code}")
        print(resp_docx.json())

if __name__ == "__main__":
    main()
