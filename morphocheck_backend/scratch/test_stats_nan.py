
import os
import sys
import json
from fastapi.testclient import TestClient

# Add backend to sys.path
backend_path = os.path.abspath("morphocheck_backend")
sys.path.append(backend_path)

from main import app
from models.user import User
from utils.database import SessionLocal

client = TestClient(app)

def test_stats_serialization():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == "superadmin").first()
        if not admin:
            print("No superadmin found")
            return

        from routers.auth_router import get_current_admin, get_current_superadmin
        app.dependency_overrides[get_current_admin] = lambda: admin
        app.dependency_overrides[get_current_superadmin] = lambda: admin

        print("Calling /api/admin/stats...")
        response = client.get("/api/admin/stats")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                # Check for NaNs in correlation matrix
                for row in data.get("correlation_matrix", []):
                    for k, v in row.items():
                        if v != v: # NaN check
                            print(f"FOUND NaN in {row['param']} -> {k}")
            except Exception as e:
                print(f"JSON Parse Error: {e}")
        else:
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        app.dependency_overrides = {}

if __name__ == "__main__":
    test_stats_serialization()
