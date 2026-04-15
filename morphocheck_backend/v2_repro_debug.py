import requests
import json

BASE_URL = "http://localhost:8000/api"

def get_token():
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@admin.com",
        "password": "admin123"
    })
    if resp.status_code != 200:
        print(f"FAILED LOGIN: {resp.status_code} {resp.text}")
        return None
    return resp.json()["access_token"]

def check_endpoint(name, path, token):
    print(f"Checking {name} ({path})...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}{path}", headers=headers)
    if resp.status_code == 500:
        print(f"!!! 500 ERROR in {name} !!!")
        try:
            detail = resp.json()
            print(json.dumps(detail, indent=2))
        except:
            print(resp.text)
        return True
    else:
        print(f"OK: {resp.status_code}")
        return False

def main():
    token = get_token()
    if not token: return

    has_error = False
    has_error |= check_endpoint("Stats", "/admin/stats", token)
    has_error |= check_endpoint("Analyses List", "/admin/analyses", token)
    has_error |= check_endpoint("Deleted Analyses", "/admin/deleted-analyses", token)
    
    if not has_error:
        print("\nNo 500 errors found in standard GET endpoints.")
        print("Testing POST analyze/full...")
        # Try a sample analysis
        payload = {
            "firstName": "Test", "lastName": "User", "age": 25, "gender": "erkak",
            "height": 175, "weight": 70, "chest": 90, "waist": 80, "head": 55,
            "region": "Tashkent", "address": "Test"
        }
        resp = requests.post(f"{BASE_URL}/analyze/full", json=payload, headers={"Authorization": f"Bearer {token}"})
        if resp.status_code == 500:
            print("!!! 500 ERROR in analyze/full !!!")
            print(resp.text)
        else:
            print(f"OK: {resp.status_code}")

if __name__ == "__main__":
    main()
