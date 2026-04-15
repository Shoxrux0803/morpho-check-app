import requests
from io import BytesIO
from openpyxl import Workbook

BASE_URL = "http://localhost:8000/api"

def get_token():
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@admin.com",
        "password": "admin123"
    })
    return resp.json()["access_token"]

def create_broken_excel():
    wb = Workbook()
    ws = wb.active
    headers = [
        "first_name (Ism) *", "last_name (Familiya) *", "gender (erkak/ayol) *", 
        "age (Yosh) *", "age_months (Yosh oylar)", "age_days (Yosh kunlar)",
        "region (Viloyat) *", "district (Tuman)", "address (Manzil)",
        "height (Bo'y, sm) *", "weight (Vazn, kg) *", "chest (Ko'krak qafasi, sm) *",
        "waist (Bel айланаси, sm) *", "head (Bosh айланаси, sm) *",
        "birth_date (Tug'ilgan sana: YYYY-MM-DD)", "examination_date (Sana: YYYY-MM-DD)", 
        "preschool_institution (Muassasa)"
    ]
    ws.append(headers)
    
    # Row with float as age (was causing 500 if not handled)
    ws.append([
        "Test", "FloatAge", "erkak", 10.5, 5, 0,
        "Toshkent", "Yunusobod", "Mirobod",
        150, 45, 80, 70, 54,
        "2014-01-01", "2024-01-01", "School"
    ])
    
    # Row with comma as decimal separator
    ws.append([
        "Test", "CommaDecimal", "ayol", "12", 0, 0,
        "Samarqand", "Samarqand", "Registon",
        "145,5", "38,7", "75,2", "68,1", "52,5",
        "2012-05-05", "2024-05-05", "School"
    ])
    
    out = BytesIO()
    wb.save(out)
    out.seek(0)
    return out

def main():
    token = get_token()
    excel_file = create_broken_excel()
    
    print("Uploading test Excel with edge cases...")
    files = {'file': ('test.xlsx', excel_file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.post(f"{BASE_URL}/admin/import-xlsx", files=files, headers=headers)
    
    if resp.status_code == 200:
        res = resp.json()
        print(f"SUCCESS: Imported {res.get('imported')}, Updated {res.get('updated')}")
        if res.get('errors'):
            print("Errors reported (expected if data is missing):")
            for e in res['errors']:
                print(f"  - {e}")
    else:
        print(f"FAILED: {resp.status_code}")
        print(resp.text)

if __name__ == "__main__":
    main()
