from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from models.schemas import UserRegister, UserLogin, UserOut, Token
from models.user import User
from utils.database import get_db
from utils.security import get_password_hash, verify_password, create_access_token
from utils.audit_helper import record_audit_log
from jose import JWTError, jwt
import os
from utils.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretjwtkey_please_change_in_prod")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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
    
    # Update activity
    from datetime import datetime
    user.last_active_at = datetime.utcnow()
    try:
        db.commit()
    except:
        db.rollback()
        
    return user

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu amal uchun huquqingiz yetarli emas (faqat adminlar uchun)"
        )
    return current_user

def get_optional_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email:
            user = db.query(User).filter(User.email == email).first()
            return user
    except JWTError:
        pass
    return None

def get_current_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat Super Admin ushbu amalni bajara oladi"
        )
    return current_user

@router.post("/register", response_model=UserOut)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Ushbu email bilan ro'yxatdan o'tilgan.")
    
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        phone=user_in.phone,
        region=user_in.region,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

from sqlalchemy import or_

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, user_in: UserLogin, db: Session = Depends(get_db)):
    # Login (email) yoki Ism (name) bo'yicha qidirish
    user = db.query(User).filter(
        or_(
            User.email == user_in.email,
            User.name == user_in.email
        )
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Email yoki parol noto'g'ri")
        
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email yoki parol noto'g'ri")
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    
    # Success Login Logging
    record_audit_log(
        db=db,
        user_id=user.id,
        action="LOGIN",
        target_type="User",
        target_id=user.id,
        details=f"Foydalanuvchi tizimga kirdi: {user.email or user.name}",
        request=request
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
