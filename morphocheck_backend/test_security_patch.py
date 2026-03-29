
from utils.security import pwd_context

def test_security_patch():
    try:
        password = "testpassword"
        hashed = pwd_context.hash(password)
        print(f"Hashed: {hashed}")
        is_correct = pwd_context.verify(password, hashed)
        print(f"Verify result: {is_correct}")
    except Exception as e:
        print(f"Security patch test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_security_patch()
