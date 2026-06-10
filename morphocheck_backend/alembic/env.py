# morphocheck_backend/alembic/env.py
# ============================================================
# MorphoCheck Pro — Alembic Environment
#
# Bu fayl:
#   1. .env faylidan DATABASE_URL ni o'qiydi
#   2. Barcha modellarni import qiladi (autogenerate uchun)
#   3. SQLite va PostgreSQL ikkalasini ham qo'llab-quvvatlaydi
# ============================================================

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# ------------------------------------------------------------
# 1. morphocheck_backend/ papkasini sys.path ga qo'shish
#    Bu import larni to'g'ri ishlashi uchun kerak
# ------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# ------------------------------------------------------------
# 2. .env faylini yuklash
# ------------------------------------------------------------
from dotenv import load_dotenv

load_dotenv(BACKEND_DIR / ".env")

# ------------------------------------------------------------
# 3. Barcha modellarni import qilish (autogenerate uchun zarur)
#    MUHIM: Yangi model qo'shilsa, shu yerga ham qo'shing!
# ------------------------------------------------------------
from models.audit import AuditLog  # noqa: F401
from models.auth_device import LoginVerificationCode, TrustedLoginDevice  # noqa: F401
from models.base import Base  # noqa: F401
from models.chat import ChatMessage  # noqa: F401
from models.clinical import ClinicalSetting  # noqa: F401
from models.payment import Payment  # noqa: F401
from models.user import User  # noqa: F401
from models.userdata import PatientAnalysis, ResearchRecord  # noqa: F401

# target_metadata — autogenerate uchun
target_metadata = Base.metadata


# ------------------------------------------------------------
# 4. DATABASE_URL ni .env dan o'qish
# ------------------------------------------------------------
def _get_database_url() -> str:
    """
    DATABASE_URL ni .env dan o'qiydi.
    SQLite va PostgreSQL ikkalasini ham qo'llab-quvvatlaydi.
    """
    url = os.getenv("DATABASE_URL", "")

    if not url or url.startswith("sqlite"):
        # Dev rejimi: SQLite
        db_path = BACKEND_DIR / "morphocheck.db"
        return f"sqlite:///{db_path}"

    # Heroku postgres:// formatini to'g'irlash
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)

    return url


# Alembic config obyektini olish
config = context.config

# Logging konfiguratsiyasi
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DATABASE_URL ni dinamik o'rnatish
config.set_main_option("sqlalchemy.url", _get_database_url())


# ------------------------------------------------------------
# 5. Offline migration (SQL fayl generatsiya)
#    alembic upgrade head --sql  →  stdout ga SQL chiqaradi
# ------------------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # SQLite uchun batch mode (ALTER TABLE emulyatsiyasi)
        render_as_batch=url.startswith("sqlite"),
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ------------------------------------------------------------
# 6. Online migration (haqiqiy DB ga qo'llaniladi)
#    alembic upgrade head  →  DB ga to'g'ridan-to'g'ri
# ------------------------------------------------------------
def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = config.get_main_option("sqlalchemy.url")
    is_sqlite = url.startswith("sqlite")

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        # SQLite bilan bir vaqtda faqat 1 connection
        poolclass=pool.StaticPool if is_sqlite else pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # SQLite uchun batch mode — ALTER TABLE ni emulyatsiya qiladi
            render_as_batch=is_sqlite,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ------------------------------------------------------------
# 7. Offline yoki Online rejimini tanlash
# ------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
