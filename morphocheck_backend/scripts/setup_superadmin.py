# morphocheck_backend/scripts/setup_superadmin.py
import sys
import os

# Mahalla papkani path ga qo'shamiz
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from utils.database import SessionLocal
from utils.security import get_password_hash
from models.user import User

def setup_superadmin():
    db: Session = SessionLocal()
    try:
        # Super admin ma'lumotlari
        email = "admin@morphocheck.uz" # O'zgartirishingiz mumkin, lekin login: admin deb so'ralgan
        password = "superadmin123"
        name = "Super Admin"
        
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
