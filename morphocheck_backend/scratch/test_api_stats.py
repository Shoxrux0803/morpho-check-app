
import requests

def test_stats_endpoint():
    url = "http://localhost:8000/api/admin/stats?age_min=0&age_max=100&bmi_min=10&bmi_max=50"
    
    # We need a token. I'll try to find an admin user and login.
    # But since I'm on the server, I can just mock the DB call if I want to be safe.
    # However, testing the endpoint via HTTP is better.
    
    print(f"Testing {url}...")
    try:
        # Assuming no auth for now just to see the error type if it's 401/403 vs 500
        # Wait, the user said it responded with 500.
        resp = requests.get(url)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # This might fail if the server is not running or needs auth.
    # I'll check if uvicorn is running in the background.
    test_stats_endpoint()
