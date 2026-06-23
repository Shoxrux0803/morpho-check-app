import hashlib
import os
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.auth_device import LoginVerificationCode, TrustedLoginDevice
from models.schemas import Token, UserLogin, UserOut, UserRegister
from models.user import User
from utils.audit_helper import record_audit_log
from utils.database import get_db
from utils.rate_limit import limiter
from utils.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Superadmin emaili .env faylidan o'qiladi — hech qachon kodga yozilmasin!
SUPERADMIN_EMAIL = (os.getenv("MORPHOCHECK_SUPERADMIN_EMAIL") or "").strip().lower()
VERIFICATION_TTL_MINUTES = int(os.getenv("LOGIN_VERIFICATION_TTL_MINUTES", "10"))


def _hash_value(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else ""


def _send_verification_email(to_email: str, code: str):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not host or not sender:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email yuborish sozlanmagan. SMTP_HOST va SMTP_FROM/SMTP_USERNAME ni .env ga kiriting.",
        )
    if username and not password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gmail kodi yuborilishi uchun SMTP_PASSWORD ga Google App Password kiriting.",
        )

    message = EmailMessage()
    message["Subject"] = "MorphoCheck superadmin tasdiqlash kodi"
    message["From"] = sender
    message["To"] = to_email
    message.set_content(
        "MorphoCheck superadmin hisobiga yangi qurilmadan kirish kodi:\n\n"
        f"{code}\n\n"
        f"Kod {VERIFICATION_TTL_MINUTES} daqiqa amal qiladi."
    )

    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            if use_tls:
                smtp.starttls()
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Tasdiqlash kodini emailga yuborib bo'lmadi.",
        ) from exc


def _is_trusted_device(db: Session, user_id: int, device_hash: str) -> bool:
    trusted = (
        db.query(TrustedLoginDevice)
        .filter(
            TrustedLoginDevice.user_id == user_id,
            TrustedLoginDevice.device_id_hash == device_hash,
        )
        .first()
    )
    if trusted:
        trusted.last_used_at = datetime.utcnow()
        return True
    return False


def _store_verification_code(db: Session, user_id: int, device_hash: str, code: str):
    db.query(LoginVerificationCode).filter(
        LoginVerificationCode.user_id == user_id,
        LoginVerificationCode.device_id_hash == device_hash,
    ).delete()
    db.add(
        LoginVerificationCode(
            user_id=user_id,
            device_id_hash=device_hash,
            code_hash=get_password_hash(code),
            expires_at=datetime.utcnow() + timedelta(minutes=VERIFICATION_TTL_MINUTES),
        )
    )


def _verify_device_code(db: Session, user_id: int, device_hash: str, code: str):
    record = (
        db.query(LoginVerificationCode)
        .filter(
            LoginVerificationCode.user_id == user_id,
            LoginVerificationCode.device_id_hash == device_hash,
        )
        .first()
    )
    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=400, detail="Tasdiqlash kodi eskirgan yoki topilmadi"
        )
    if record.attempts >= 5:
        raise HTTPException(
            status_code=400, detail="Tasdiqlash kodi urinishlari tugadi"
        )
    if not verify_password(code.strip(), record.code_hash):
        record.attempts += 1
        raise HTTPException(status_code=400, detail="Tasdiqlash kodi noto'g'ri")
    db.delete(record)


def _trust_device(db: Session, user_id: int, device_hash: str, request: Request):
    existing = (
        db.query(TrustedLoginDevice)
        .filter(
            TrustedLoginDevice.user_id == user_id,
            TrustedLoginDevice.device_id_hash == device_hash,
        )
        .first()
    )
    if existing:
        existing.last_used_at = datetime.utcnow()
        return
    db.add(
        TrustedLoginDevice(
            user_id=user_id,
            device_id_hash=device_hash,
            user_agent=(request.headers.get("user-agent") or "")[:255],
            ip_address=_client_ip(request)[:64],
            last_used_at=datetime.utcnow(),
        )
    )


def _validate_active_user(user: User):
    if getattr(user, "is_deleted", 0) == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Foydalanuvchi bloklangan yoki o'chirilgan",
        )
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    _validate_active_user(user)

    # Update activity
    from datetime import datetime

    user.last_active_at = datetime.utcnow()
    try:
        db.commit()
    except Exception:
        db.rollback()

    return user


def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu amal uchun huquqingiz yetarli emas (faqat adminlar uchun)",
        )
    return current_user


def get_optional_user(
    token: str = Depends(
        OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
    ),
    db: Session = Depends(get_db),
):
    if not token:
        return None
    try:
        from jose import JWTError, jwt

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user and getattr(user, "is_deleted", 0) != 1:
                return user
    except JWTError:
        return None
    return None


def get_current_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat Super Admin ushbu amalni bajara oladi",
        )
    return current_user


def get_current_admin_or_assistant(current_user: User = Depends(get_current_user)):
    is_admin_assistant = (
        current_user.role == "field_assistant"
        and current_user.supervisor is not None
        and current_user.supervisor.role == "admin"
        and getattr(current_user.supervisor, "is_deleted", 0) != 1
    )
    if current_user.role not in ["admin", "superadmin"] and not is_admin_assistant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu amal uchun huquqingiz yetarli emas (faqat admin va uning assistenti uchun)",
        )
    return current_user


@router.post("/register", response_model=UserOut)
@limiter.limit("100/minute")
def register(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    email = user_in.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Ushbu email bilan ro'yxatdan o'tilgan."
        )

    new_user = User(
        name=user_in.name,
        email=email,
        hashed_password=get_password_hash(user_in.password),
        phone=user_in.phone,
        region=user_in.region,
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
@limiter.limit("100/minute")
def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    # Login (email) yoki Ism (name) bo'yicha qidirish
    login_value = user_in.email.strip().lower()
    user = (
        db.query(User)
        .filter(or_(User.email == login_value, User.name == user_in.email.strip()))
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="Email yoki parol noto'g'ri")

    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email yoki parol noto'g'ri")
    _validate_active_user(user)

    # Superadmin qurilma tekshiruvi: email env dan o'qiladi va superadmin bo'lsa ishga tushadi
    if (
        user.role == "superadmin"
        and SUPERADMIN_EMAIL
        and (user.email or "").lower() == SUPERADMIN_EMAIL
    ):
        if not user_in.device_id:
            raise HTTPException(
                status_code=400, detail="Qurilma identifikatori topilmadi"
            )
        device_hash = _hash_value(user_in.device_id.strip())
        if not _is_trusted_device(db, user.id, device_hash):
            verification_code = (user_in.verification_code or "").strip()
            if not verification_code:
                code = f"{secrets.randbelow(1000000):06d}"
                _store_verification_code(db, user.id, device_hash, code)
                _send_verification_email(user.email, code)
                db.commit()
                return {
                    "requires_verification": True,
                    "message": "Yangi qurilma aniqlandi. Emailga yuborilgan kodni kiriting.",
                }
            _verify_device_code(db, user.id, device_hash, verification_code)
            _trust_device(db, user.id, device_hash, request)

    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    # Success Login Logging
    record_audit_log(
        db=db,
        user_id=user.id,
        action="LOGIN",
        target_type="User",
        target_id=user.id,
        details=f"Foydalanuvchi tizimga kirdi: {user.email or user.name}",
        request=request,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
