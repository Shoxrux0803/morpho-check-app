
from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_predict_params():
    # We need to bypass auth or get a token.
    # For testing, I'll just check if the model initialization works.
    # I'll mock get_current_user
    from routers.auth_router import get_current_user
    from models.user import User
    
    app.dependency_overrides[get_current_user] = lambda: User(id=1, role="superadmin", email="admin@admin.com")
    
    payload = {
        "age": 10,
        "gender": "Boy",
        "target_form": "analysis"
    }
    
    print("Sending request to /api/ai/predict-params...")
    response = client.post("/api/ai/predict-params", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    app.dependency_overrides = {}

if __name__ == "__main__":
    test_predict_params()
