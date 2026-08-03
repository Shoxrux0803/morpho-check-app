import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend configuration before modules read environment variables.
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

import sentry_sdk

def _configure_sentry() -> None:
    """Sentry'ni faqat haqiqiy HTTP(S) DSN berilganda yoqadi.

    `.env.example` dagi namunaviy qiymat lokal serverni yiqitmasligi kerak.
    """
    sentry_dsn = os.getenv("SENTRY_DSN", "").strip()
    if not sentry_dsn or not sentry_dsn.startswith(("http://", "https://")):
        return

    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            profiles_sample_rate=float(
                os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")
            ),
        )
    except Exception as exc:
        # Monitoring xatosi asosiy API ishga tushishiga to'sqinlik qilmasin.
        print(f"[STARTUP] Sentry o'chirildi: {exc}")


_configure_sentry()

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from utils.i18n import I18nMiddleware, i18n_http_exception_handler, i18n_validation_exception_handler

from models.base import Base
from models.security_event import SecurityEvent  # noqa: F401
from routers.admin_router import router as admin_router
from routers.ai_router import router as ai_router
from routers.analytics_router import router as analytics_router  # 3-bosqich

# Routers
from routers.analyze_router import router as analyze_router
from routers.auth_router import router as auth_router
from routers.backup_router import router as backup_router
from routers.chat_router import router as chat_router
from routers.clinical_router import router as clinical_router
from routers.pdf_router import router as pdf_router
from routers.research_router import router as research_router
from routers.utils_router import router as utils_router

# DB init
from utils.database import SessionLocal, engine, get_db, init_db
from utils.rate_limit import limiter
from utils.security_events import record_security_event

API_PREFIX = os.getenv("API_PREFIX", "/api")

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Jadval(lar) mavjud bo'lmasa yaratadi + ulanishni tekshiradi
    init_db(lambda: Base.metadata.create_all(bind=engine))
    ensure_schema_updates()
    
    from utils.blocked_ips import load_blocked_ips_to_cache
    load_blocked_ips_to_cache()
    
    # 2-bosqich: TimescaleDB hypertable larni tekshirish va yaratish
    try:
        from utils.timescale import ensure_hypertables

        ensure_hypertables()
    except Exception as _ts_err:
        print(f"[STARTUP] TimescaleDB: {_ts_err}")
    yield


app = FastAPI(
    title="MorphoCheck Pro API",
    description="Antropometrik tahlil, tavsiyalar va PDF hisoboti",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter

async def security_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    db = SessionLocal()
    try:
        record_security_event(
            db,
            "RATE_LIMIT_EXCEEDED",
            request=request,
            details=f"Rate limit exceeded on {request.method} {request.url.path}",
            severity="high",
        )
    finally:
        db.close()
    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(RateLimitExceeded, security_rate_limit_handler)
app.add_exception_handler(StarletteHTTPException, i18n_http_exception_handler)
app.add_exception_handler(RequestValidationError, i18n_validation_exception_handler)

app.add_middleware(I18nMiddleware)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'"
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)

from fastapi.responses import JSONResponse
from utils.security_events import get_request_ip
from utils.threat_shield import assess_request_threat
from utils.blocked_ips import block_ips, is_ip_blocked

@app.middleware("http")
async def check_blocked_ip_middleware(request: Request, call_next):
    ip = get_request_ip(request)
    if is_ip_blocked(ip):
        return JSONResponse(status_code=403, content={"detail": "IP address is blocked due to security violations."})
    return await call_next(request)

@app.middleware("http")
async def threat_shield_middleware(request: Request, call_next):
    body = b""
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        assessment = assess_request_threat(request)
    else:
        content_type = (request.headers.get("content-type") or "").lower()
        if "multipart/form-data" not in content_type:
            body = await request.body()
        assessment = assess_request_threat(request, body)

    if assessment.should_log:
        db = SessionLocal()
        try:
            record_security_event(
                db,
                "THREAT_DETECTED",
                request=request,
                details=f"Threat shield detected {assessment.threat_type} on {request.method} {request.url.path}",
                severity=assessment.severity,
                threat_type=assessment.threat_type,
                risk_score=assessment.risk_score,
                action_taken=assessment.action,
                matched_signals=assessment.signals,
            )
            if assessment.should_auto_block_ip:
                ip = get_request_ip(request)
                if ip:
                    block_ips(
                        db,
                        [ip],
                        f"Auto-blocked by Threat Shield: {assessment.threat_type}",
                    )
        finally:
            db.close()

    if assessment.should_block:
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Request blocked by Morpho Security Shield.",
                "threat_type": assessment.threat_type,
                "risk_score": assessment.risk_score,
            },
        )

    if body:
        body_sent = False

        async def receive():
            nonlocal body_sent
            if body_sent:
                return {"type": "http.request", "body": b"", "more_body": False}
            body_sent = True
            return {"type": "http.request", "body": body, "more_body": False}

        request._receive = receive

    return await call_next(request)
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


def ensure_schema_updates():
    """Small additive schema fixes for deployments without Alembic migrations.
    PostgreSQL va SQLite ikkalasida ham ishlaydi.
    """
    from sqlalchemy import inspect, text

    is_pg = engine.dialect.name == "postgresql"
    is_sqlite = engine.dialect.name == "sqlite"
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    def _columns(table_name: str) -> set[str]:
        return {col["name"] for col in inspector.get_columns(table_name)}

    def _create_index(conn, table_name: str, index_name: str, columns: tuple[str, ...]):
        if table_name not in table_names:
            return
        existing_columns = _columns(table_name)
        if not set(columns).issubset(existing_columns):
            return
        column_sql = ", ".join(columns)
        conn.execute(
            text(
                f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column_sql})"
            )
        )

    def _drop_index(conn, index_name: str):
        """PostgreSQL da tablename talab qilinmaydi, SQLite ham shu."""
        if is_pg:
            conn.execute(text(f"DROP INDEX IF EXISTS {index_name}"))
        else:
            conn.execute(text(f"DROP INDEX IF EXISTS {index_name}"))

    def _pg_type(sqlite_type: str) -> str:
        """SQLite tiplarini PostgreSQL ekvivalentiga aylantirish."""
        mapping = {
            "INTEGER DEFAULT 0 NOT NULL": "INTEGER DEFAULT 0 NOT NULL",
            "DATETIME": "TIMESTAMP WITH TIME ZONE",
            "FLOAT": "DOUBLE PRECISION",
        }
        return mapping.get(sqlite_type, sqlite_type)

    def _add_column_if_missing(table_name: str, column_name: str, column_type: str):
        if table_name not in table_names:
            return False
        if column_name in _columns(table_name):
            return False
        pg_type = _pg_type(column_type) if is_pg else column_type
        if is_pg:
            # PostgreSQL: ADD COLUMN IF NOT EXISTS
            with engine.begin() as conn:
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {pg_type}"
                    )
                )
        else:
            with engine.begin() as conn:
                conn.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {pg_type}")
                )
        return True

    # -- patient_analysis ustunlari --
    if "patient_analysis" in table_names:
        for col, typ in [
            ("doctor_note", "TEXT"),
            ("mahalla", "VARCHAR(150)"),
            ("parents_phone", "VARCHAR(50)"),
            ("consent_confirmed", "INTEGER DEFAULT 0 NOT NULL"),
            ("consent_guardian_name", "VARCHAR(255)"),
            ("consent_guardian_relationship", "VARCHAR(100)"),
            ("consent_guardian_phone", "VARCHAR(50)"),
            ("consent_confirmed_at", "DATETIME"),
            ("consent_policy_version", "VARCHAR(50)"),
        ]:
            _add_column_if_missing("patient_analysis", col, typ)

    # -- research_records ustunlari --
    if "research_records" in table_names:
        for col, typ in [
            ("consent_confirmed", "INTEGER DEFAULT 0 NOT NULL"),
            ("consent_guardian_name", "VARCHAR(255)"),
            ("consent_guardian_relationship", "VARCHAR(100)"),
            ("consent_guardian_phone", "VARCHAR(50)"),
            ("consent_confirmed_at", "DATETIME"),
            ("consent_policy_version", "VARCHAR(50)"),
        ]:
            _add_column_if_missing("research_records", col, typ)

    # -- users ustunlari --
    if "users" in table_names:
        for col, typ in [
            ("district", "VARCHAR(100)"),
            ("mahalla", "VARCHAR(150)"),
            ("address", "VARCHAR(255)"),
            ("latitude", "FLOAT"),
            ("longitude", "FLOAT"),
            ("research_topic", "VARCHAR(500)"),
            ("research_type", "VARCHAR(100)"),
            ("research_area", "VARCHAR(255)"),
            ("scientific_supervisor", "VARCHAR(200)"),
            ("admin_permissions", "TEXT"),
        ]:
            _add_column_if_missing("users", col, typ)
        if "plain_password" in _columns("users"):
            pass

    if "role_settings" in table_names:
        privacy_column_added = _add_column_if_missing(
            "role_settings",
            "child_data_privacy_enabled",
            "BOOLEAN DEFAULT 1 NOT NULL",
        )
        if privacy_column_added:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "UPDATE role_settings "
                        "SET child_data_privacy_enabled = false "
                        "WHERE role_name = 'researcher'"
                    )
                )

    # -- security_events ustunlari --
    if "security_events" in table_names:
        for col, typ in [
            ("threat_type", "VARCHAR(80)"),
            ("risk_score", "INTEGER DEFAULT 0 NOT NULL"),
            ("action_taken", "VARCHAR(80)"),
            ("matched_signals", "TEXT"),
            ("attempts", "INTEGER DEFAULT 1 NOT NULL"),
        ]:
            _add_column_if_missing("security_events", col, typ)
    # -- chat_messages ustunlari --
    if "chat_messages" in table_names:
        _add_column_if_missing("chat_messages", "reaction", "VARCHAR(8)")

    with engine.begin() as conn:
        indexes = [
            ("security_events", "ix_security_events_threat_created", ("threat_type", "created_at")),
            ("security_events", "ix_security_events_risk_created", ("risk_score", "created_at")),
            ("patient_analysis", "ix_patient_analysis_is_deleted", ("is_deleted",)),
            (
                "patient_analysis",
                "ix_patient_analysis_created_by_id",
                ("created_by_id",),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_deleted_created",
                ("is_deleted", "created_at"),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_owner_active_created",
                ("created_by_id", "is_deleted", "created_at"),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_deleted_deleted_at",
                ("is_deleted", "deleted_at"),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_region_active_created",
                ("region", "is_deleted", "created_at"),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_gender_age_active",
                ("gender", "age", "is_deleted"),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_consent_active",
                ("consent_confirmed", "is_deleted"),
            ),
            (
                "patient_analysis",
                "ix_patient_analysis_child_history",
                ("name", "birth_date", "gender", "is_deleted", "created_at"),
            ),
            (
                "research_records",
                "ix_research_records_deleted_created",
                ("is_deleted", "created_at"),
            ),
            (
                "research_records",
                "ix_research_records_owner_active_id",
                ("created_by_id", "is_deleted", "id"),
            ),
            (
                "research_records",
                "ix_research_records_active_exam_id",
                ("is_deleted", "examination_date", "id"),
            ),
            (
                "research_records",
                "ix_research_records_owner_exam",
                ("created_by_id", "examination_date"),
            ),
            (
                "research_records",
                "ix_research_records_gender_active",
                ("gender", "is_deleted"),
            ),
            (
                "research_records",
                "ix_research_records_feeding_active",
                ("feeding_type", "is_deleted"),
            ),
            (
                "research_records",
                "ix_research_records_marriage_active",
                ("parents_marriage", "is_deleted"),
            ),
            (
                "research_records",
                "ix_research_records_consent_active",
                ("consent_confirmed", "is_deleted"),
            ),
            (
                "chat_messages",
                "ix_chat_messages_sender_recipient_created",
                ("sender_id", "recipient_id", "created_at"),
            ),
            (
                "chat_messages",
                "ix_chat_messages_recipient_sender_read",
                ("recipient_id", "sender_id", "is_read"),
            ),
            (
                "chat_messages",
                "ix_chat_messages_type_created",
                ("message_type", "created_at"),
            ),
            ("audit_logs", "ix_audit_logs_action_created", ("action", "created_at")),
            ("audit_logs", "ix_audit_logs_user_created", ("user_id", "created_at")),
            ("audit_logs", "ix_audit_logs_target", ("target_type", "target_id")),
            ("payments", "ix_payments_user_created", ("user_id", "created_at")),
            ("payments", "ix_payments_status_created", ("status", "created_at")),
            ("users", "ix_users_role_active", ("role", "is_deleted")),
            ("users", "ix_users_deleted_deleted_at", ("is_deleted", "deleted_at")),
        ]
        for table_name, index_name, columns in indexes:
            _create_index(conn, table_name, index_name, columns)

        # is_deleted = NULL ni 0 ga tuzatish
        null_val = "FALSE" if is_pg else "0"
        for table_name in ("patient_analysis", "research_records", "users"):
            if table_name in table_names and "is_deleted" in _columns(table_name):
                conn.execute(
                    text(
                        f"UPDATE {table_name} SET is_deleted = {null_val} WHERE is_deleted IS NULL"
                    )
                )

        # Eski indekslarni olib tashlash
        for index_name in (
            "idx_patient_gender",
            "idx_patient_age",
            "idx_patient_district",
            "idx_patient_id_code",
            "idx_patient_name",
            "idx_patient_created_at",
            "ix_patient_analysis_id",
            "ix_users_id",
            "ix_audit_logs_id",
            "ix_payments_id",
            "ix_ratings_id",
            "ix_clinical_settings_id",
        ):
            _drop_index(conn, index_name)

        # ANALYZE — PostgreSQL va SQLite da ishlaydi
        conn.execute(text("ANALYZE"))


# ---- Routers (barchasi /api/ ostida) ----
app.include_router(analyze_router, prefix=f"{API_PREFIX}/analyze", tags=["Tahlil"])
app.include_router(admin_router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])
app.include_router(pdf_router, prefix=f"{API_PREFIX}/pdf", tags=["PDF Hisobot"])
app.include_router(
    clinical_router, prefix=f"{API_PREFIX}/clinical", tags=["Klinik CMS"]
)
app.include_router(
    backup_router, prefix=f"{API_PREFIX}/backup", tags=["Zaxira (Backup)"]
)
app.include_router(
    research_router, prefix=f"{API_PREFIX}/research", tags=["Izlanuvchi"]
)
app.include_router(chat_router, prefix=f"{API_PREFIX}/chat", tags=["Chat"])
app.include_router(ai_router, prefix=f"{API_PREFIX}/ai", tags=["AI Assistant"])
app.include_router(utils_router, prefix=f"{API_PREFIX}/utils", tags=["Utilities"])
app.include_router(
    analytics_router, prefix=f"{API_PREFIX}/analytics", tags=["Analytics Dashboard"]
)  # 3-bosqich
app.include_router(auth_router, prefix=f"{API_PREFIX}")


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
    print("=" * 50)
    print(f"[ERROR] {request.method} {request.url}")
    print(f"Detail: {str(exc)}")
    traceback.print_exc()
    print("=" * 50)

    # Return generic but helpful message to client
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Serverda ichki xatolik yuz berdi."},
    )


# Endpoints are now handled via specialized routers

if __name__ == "__main__":
    import uvicorn

    _debug = os.getenv("DEBUG", "false").lower() == "true"
    _workers = int(os.getenv("UVICORN_WORKERS", "1"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=_debug,  # faqat dev rejimida reload
        workers=_workers if not _debug else 1,  # production uchun ko'p worker
        access_log=_debug,  # log faqat debug rejimida
    )
