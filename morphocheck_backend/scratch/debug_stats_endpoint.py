
import os
import sys
from fastapi.testclient import TestClient

# Add backend to sys.path
backend_path = os.path.abspath("morphocheck_backend")
sys.path.append(backend_path)

from main import app
from models.user import User
from utils.database import SessionLocal

client = TestClient(app)

def test_stats():
    db = SessionLocal()
    try:
        # Get a superadmin user for token or mock auth
        admin = db.query(User).filter(User.role == "superadmin").first()
        if not admin:
            print("No superadmin found")
            return

        # Mock get_current_admin/get_current_superadmin
        from routers.auth_router import get_current_admin, get_current_superadmin
        app.dependency_overrides[get_current_admin] = lambda: admin
        app.dependency_overrides[get_current_superadmin] = lambda: admin

        print("Calling /api/admin/stats...")
        response = client.get("/api/admin/stats")
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
        else:
            print("Success!")
            # print(response.json())
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        app.dependency_overrides = {}

if __name__ == "__main__":
    test_stats()
