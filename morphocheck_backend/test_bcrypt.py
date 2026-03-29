
from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_bcrypt():
    try:
        password = "testpassword"
        hashed = pwd_context.hash(password)
        print(f"Hashed: {hashed}")
        is_correct = pwd_context.verify(password, hashed)
        print(f"Verify result: {is_correct}")
    except Exception as e:
        print(f"Bcrypt test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_bcrypt()
