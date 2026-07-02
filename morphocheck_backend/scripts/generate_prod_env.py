import os
import secrets
import re

def generate_secure_password(length=32):
    return secrets.token_urlsafe(length)

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    example_env_path = os.path.join(root_dir, '.env.example')
    prod_env_path = os.path.join(root_dir, '.env')

    if not os.path.exists(example_env_path):
        print(f"Error: {example_env_path} not found.")
        return

    with open(example_env_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generate secrets
    db_pass = generate_secure_password(24)
    secret_key = generate_secure_password(48)
    minio_secret = generate_secure_password(32)
    superadmin_pass = generate_secure_password(16)

    # Replacements
    content = re.sub(r'POSTGRES_PASSWORD=.*', f'POSTGRES_PASSWORD={db_pass}', content)
    content = re.sub(r'SECRET_KEY=.*', f'SECRET_KEY={secret_key}', content)
    content = re.sub(r'MINIO_SECRET_KEY=.*', f'MINIO_SECRET_KEY={minio_secret}', content)
    
    # If superadmin password is empty, fill it
    content = re.sub(r'MORPHOCHECK_SUPERADMIN_PASSWORD=.*', f'MORPHOCHECK_SUPERADMIN_PASSWORD={superadmin_pass}', content)

    # Force DEBUG to false
    content = re.sub(r'DEBUG=.*', 'DEBUG=false', content)

    with open(prod_env_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("==================================================")
    print("✅ .env file successfully generated for PRODUCTION!")
    print("==================================================")
    print(f"Database Password: {db_pass}")
    print(f"Secret Key: {secret_key}")
    print(f"MinIO Secret Key: {minio_secret}")
    print(f"Superadmin Password: {superadmin_pass}")
    print("==================================================")
    print(f"Saved to: {prod_env_path}")
    print("IMPORTANT: Save these credentials in a safe place!")

if __name__ == "__main__":
    main()
