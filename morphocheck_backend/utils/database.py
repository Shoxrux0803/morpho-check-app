# utils/database.py
import os
import time
from typing import Callable, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# .env faylini yuklash
load_dotenv()

# --- ENV dan sozlamalar ---
def _normalize_db_url(url: str) -> str:
    # SQLITE_ABS_PATH yordamida bazani aniq joyini ko'rsatamiz
    # Agar DATABASE_URL ko'rsatilmagan bo'lsa, joriy papkadagi morphocheck.db ishlatiladi
    if not url or url.startswith("sqlite"):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(base_dir, "morphocheck.db")
        return f"sqlite:///{db_path}"
        
    # Heroku/formats: postgres:// -> postgresql+psycopg2://
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    return url

DATABASE_URL = _normalize_db_url(os.getenv("DATABASE_URL", ""))

POOL_SIZE     = int(os.getenv("DB_POOL_SIZE", "5"))
MAX_OVERFLOW  = int(os.getenv("DB_MAX_OVERFLOW", "10"))
POOL_RECYCLE  = int(os.getenv("DB_POOL_RECYCLE", "280"))   # sekund
POOL_TIMEOUT  = int(os.getenv("DB_POOL_TIMEOUT", "30"))    # sekund
ECHO          = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

# --- Engine ---
_is_sqlite = DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    from sqlalchemy import event

    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite uchun kerak
        echo=ECHO,
        future=True,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=15000")  # 15s — ko'p foydalanuvchi bilan
        cursor.execute("PRAGMA cache_size=-128000")  # ~128MB shared cache
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.execute("PRAGMA mmap_size=268435456")  # 256MB memory-mapped I/O
        cursor.execute("PRAGMA wal_autocheckpoint=1000")  # WAL checkpoint every 1000 pages
        cursor.execute("PRAGMA page_size=4096")  # Optimal page size
        cursor.close()
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # o'lik connectionlarni aniqlash
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_recycle=POOL_RECYCLE,
        pool_timeout=POOL_TIMEOUT,
        echo=ECHO,
        future=True,             # 2.0 API
    )

# --- Session factory ---
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    future=True,
)

# FastAPI dependency — routerlar bundan foydalanadi
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# Jadval yaratishni (va ulanishni) qayta urinish bilan bajarish
def init_db(
    create_metadata_callable: Optional[Callable[[], None]] = None,
    retries: int = int(os.getenv("DB_INIT_RETRIES", "20")),
    delay_sec: float = float(os.getenv("DB_INIT_DELAY", "1.5")),
):
    """
    main.py da:
      init_db(lambda: Base.metadata.create_all(bind=engine))
    """
    last_err: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            # 1) Ulanish test
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            # 2) Metadata yaratish (agar berilgan bo'lsa)
            if create_metadata_callable:
                create_metadata_callable()
            return
        except Exception as e:
            last_err = e
            time.sleep(delay_sec)
    # Oxirgi xatoni ko'taramiz
    if last_err:
        raise last_err
