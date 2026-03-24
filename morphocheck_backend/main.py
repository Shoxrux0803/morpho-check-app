# morphocheck_backend/main.py
import os
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv

# .env faylini yuklash
load_dotenv()

# Routers
from routers.analyze_router import router as analyze_router
from routers.admin_router import router as admin_router
from routers.pdf_router import router as pdf_router
from routers.rating_router import router as rating_router
from routers.auth_router import router as auth_router

# DB init
from utils.database import engine, get_db, init_db
from models.base import Base
from models.userdata import UserAnalysis

API_PREFIX = os.getenv("API_PREFIX", "/api")

app = FastAPI(
    title="MorphoCheck Pro API",
    description="Antropometrik tahlil, tavsiyalar va PDF hisoboti",
    version="1.0.0",
)

# CORS sozlamalari (env orqali boshqariladi yoki default)
_origins = os.getenv("CORS_ORIGINS", "")
if _origins:
    allow_origins = [o.strip() for o in _origins.split(",") if o.strip()]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    # Mahalliy testlarda (dev) origin regexdan foydalanish xatoliklarning oldini oladi
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Jadval(lar) mavjud bo'lmasa yaratadi + ulanishni tekshiradi
    init_db(lambda: Base.metadata.create_all(bind=engine))

# ---- Routers (barchasi /api/ ostida) ----
app.include_router(analyze_router, prefix=f"{API_PREFIX}/analyze", tags=["Tahlil"])
app.include_router(admin_router,  prefix=f"{API_PREFIX}/admin",   tags=["Admin"])
app.include_router(pdf_router,    prefix=f"{API_PREFIX}/pdf",     tags=["PDF Hisobot"])
app.include_router(rating_router, prefix=f"{API_PREFIX}/rating",  tags=["Fikr va baho"])
app.include_router(auth_router,   prefix=f"{API_PREFIX}")

# Sog'liqni tekshirish
@app.get(f"{API_PREFIX}/health", tags=["Service"])
def health(db: Session = Depends(get_db)):
    from sqlalchemy import text
    db.execute(text("SELECT 1"))
    return {"status": "ok"}

# --- Analizni qo'lda saqlash endpointi (ixtiyoriy) ---
class UserInput(BaseModel):
    name: str
    age: int
    gender: str
    height: float
    weight: float
    chest: float
    waist: float
    hip: float
    head: float
    bmi: Optional[float] = None
    z_score: Optional[float] = None
    somatotype: Optional[str] = None
    recommendations: Optional[str] = None

@app.post(f"{API_PREFIX}/analyze/save", tags=["Ma'lumotlar bazasi"])
def save_user_analysis(data: UserInput, db: Session = Depends(get_db)):
    try:
        record = UserAnalysis(**data.dict())
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"message": "Ma'lumot saqlandi", "id": record.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
