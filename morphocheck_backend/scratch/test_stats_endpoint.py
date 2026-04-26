
import requests

BASE_URL = "http://localhost:8000/api"

def test_stats():
    # Login
    login_data = {"email": "admin@admin.com", "password": "admin123"}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        return
    
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get stats
    print("Fetching stats...")
    resp = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print("Keys in response:", data.keys())
        print("Total analyses:", data.get("total_analyses"))
        print("BMI Distribution:", data.get("bmi_distribution"))
        print("By Gender:", data.get("by_gender"))
        print("By Age Group:", data.get("by_age_group"))
    else:
        print(f"Error: {resp.text}")

if __name__ == "__main__":
    test_stats()
