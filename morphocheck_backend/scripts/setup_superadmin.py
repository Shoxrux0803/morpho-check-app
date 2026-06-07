# morphocheck_backend/scripts/setup_superadmin.py
import sys
import os

# Mahalla papkani path ga qo'shamiz
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
load_dotenv()

from utils.database import SessionLocal
from utils.security import get_password_hash
from models.user import User

def setup_superadmin():
    db: Session = SessionLocal()
    try:
        email = os.getenv("MORPHOCHECK_SUPERADMIN_EMAIL", "ortiqovshoxrux1996@gmail.com").strip().lower()
        password = os.getenv("MORPHOCHECK_SUPERADMIN_PASSWORD")
        name = os.getenv("MORPHOCHECK_SUPERADMIN_NAME", "Super Admin")

        if not password:
            raise RuntimeError("MORPHOCHECK_SUPERADMIN_PASSWORD env qiymatini kiriting.")
        
        # Tekshiramiz, bormi yo'qmi
        admin = db.query(User).filter(User.email == email).first()
        
        if admin:
            print(f"Super admin ({email}) allaqachon mavjud. Parol yangilanmoqda...")
            admin.hashed_password = get_password_hash(password)
            admin.role = "superadmin"
            admin.name = name
        else:
            print(f"Yangi super admin ({email}) yaratilmoqda...")
            admin = User(
                email=email,
                name=name,
                hashed_password=get_password_hash(password),
                role="superadmin"
            )
            db.add(admin)
        
        db.commit()
        print("Muvaffaqiyatli yakunlandi!")
    except Exception as e:
        db.rollback()
        print(f"Xatolik: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_superadmin()
