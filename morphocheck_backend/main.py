# morphocheck_backend/main.py
import os
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.rate_limit import limiter
from starlette.middleware.base import BaseHTTPMiddleware

# .env faylini yuklash
load_dotenv()

# Routers
from routers.analyze_router import router as analyze_router
from routers.admin_router import router as admin_router
from routers.pdf_router import router as pdf_router
from routers.auth_router import router as auth_router
from routers.clinical_router import router as clinical_router
from routers.backup_router import router as backup_router
from routers.research_router import router as research_router
from routers.chat_router import router as chat_router
from routers.ai_router import router as ai_router
from routers.utils_router import router as utils_router
from routers.rating_router import router as rating_router

# DB init
from utils.database import engine, get_db, init_db
from models.base import Base
from models.user import User
from models.userdata import PatientAnalysis
from models.chat import ChatMessage

API_PREFIX = os.getenv("API_PREFIX", "/api")

app = FastAPI(
    title="MorphoCheck Pro API",
    description="Antropometrik tahlil, tavsiyalar va PDF hisoboti",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    debug = os.getenv("DEBUG", "false").lower() == "true"
    if debug:
        print(f"[DEBUG] Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    if debug:
        print(f"[DEBUG] Response status: {response.status_code}")
    return response

# CORS sozlamalari
_origins = os.getenv("CORS_ORIGINS", "")
if _origins:
    allow_origins = [o.strip() for o in _origins.split(",") if o.strip()]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

if "*" in allow_origins:
    raise RuntimeError("CORS_ORIGINS must not contain '*'. Configure explicit origins.")

allowed_hosts = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")
    if h.strip()
]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Uploads papkasini yaratish va static qilish
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    # Jadval(lar) mavjud bo'lmasa yaratadi + ulanishni tekshiradi
    init_db(lambda: Base.metadata.create_all(bind=engine))
    ensure_schema_updates()

def ensure_schema_updates():
    """Small additive schema fixes for deployments without migrations."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "patient_analysis" in table_names:
        existing = {col["name"] for col in inspector.get_columns("patient_analysis")}
        with engine.begin() as conn:
            if "doctor_note" not in existing:
                conn.execute(text("ALTER TABLE patient_analysis ADD COLUMN doctor_note TEXT"))
            if "mahalla" not in existing:
                conn.execute(text("ALTER TABLE patient_analysis ADD COLUMN mahalla VARCHAR(150)"))

    if "users" in table_names:
        user_columns = {
            "district": "VARCHAR(100)",
            "mahalla": "VARCHAR(150)",
            "address": "VARCHAR(255)",
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "research_topic": "VARCHAR(500)",
            "research_type": "VARCHAR(100)",
            "research_area": "VARCHAR(255)",
            "scientific_supervisor": "VARCHAR(200)",
        }
        existing = {col["name"] for col in inspector.get_columns("users")}
        with engine.begin() as conn:
            for column_name, column_type in user_columns.items():
                if column_name not in existing:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))

# ---- Routers (barchasi /api/ ostida) ----
app.include_router(analyze_router, prefix=f"{API_PREFIX}/analyze", tags=["Tahlil"])
app.include_router(admin_router,  prefix=f"{API_PREFIX}/admin",   tags=["Admin"])
app.include_router(pdf_router,    prefix=f"{API_PREFIX}/pdf",     tags=["PDF Hisobot"])
app.include_router(clinical_router, prefix=f"{API_PREFIX}/clinical", tags=["Klinik CMS"])
app.include_router(backup_router, prefix=f"{API_PREFIX}/backup",  tags=["Zaxira (Backup)"])
app.include_router(research_router, prefix=f"{API_PREFIX}/research", tags=["Izlanuvchi"])
app.include_router(chat_router,     prefix=f"{API_PREFIX}/chat",     tags=["Chat"])
app.include_router(ai_router,       prefix=f"{API_PREFIX}/ai",       tags=["AI Assistant"])
app.include_router(utils_router,    prefix=f"{API_PREFIX}/utils",    tags=["Utilities"])
app.include_router(rating_router,   prefix=f"{API_PREFIX}/rating",   tags=["Fikr va baho"])
app.include_router(auth_router,   prefix=f"{API_PREFIX}")

# Sog'liqni tekshirish
@app.get(f"{API_PREFIX}/health", tags=["Service"])
def health(db: Session = Depends(get_db)):
    from sqlalchemy import text
    db.execute(text("SELECT 1"))
    return {"status": "ok"}

# ---- Global Error Handler for Observability ----
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log detailed error to console/logs
    print("="*50)
    print(f"[ERROR] {request.method} {request.url}")
    print(f"Detail: {str(exc)}")
    traceback.print_exc()
    print("="*50)
    
    # Return generic but helpful message to client
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Serverda ichki xatolik yuz berdi."
        }
    )

# Endpoints are now handled via specialized routers

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
