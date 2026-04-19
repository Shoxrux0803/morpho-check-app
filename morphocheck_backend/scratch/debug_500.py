import sys
import os

# Add parent dir to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import SessionLocal
from models.user import User
from models.schemas import UserOut
from typing import List
from pydantic import TypeAdapter

def debug_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users: {len(users)}")
        
        # Try to validate each user against UserOut
        adapter = TypeAdapter(List[UserOut])
        try:
            validated = adapter.validate_python(users)
            print("Validation successful!")
        except Exception as e:
            print(f"Validation failed: {e}")
            
            # Find which user is failing
            for user in users:
                try:
                    UserOut.model_validate(user)
                except Exception as user_e:
                    print(f"User ID {user.id} failed validation: {user_e}")
                    print(f"User data: {user.__dict__}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_users()
