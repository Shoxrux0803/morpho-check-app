
from utils.security import verify_password, get_password_hash
hashed = "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgNI9RPqh6HC0673.K7S8E9oFmO."
password = "admin123"
is_ok = verify_password(password, hashed)
print(f"Password 'admin123' verification: {is_ok}")
if not is_ok:
    new_hash = get_password_hash(password)
    print(f"Correct hash for 'admin123': {new_hash}")
