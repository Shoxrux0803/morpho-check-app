import os
import sqlite3
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import re

from utils.database import get_db
from models.user import User
from routers.auth_router import get_current_superadmin
from utils.audit_helper import record_audit_log

router = APIRouter(tags=["Zaxira (Backup)"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_DIR = os.path.join(BASE_DIR, "backups")
DB_PATH = os.path.join(BASE_DIR, "morphocheck.db")

# Ensure backups directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

BACKUP_FILENAME_RE = re.compile(r"^backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$")


def get_safe_backup_path(filename: str) -> str:
    if not BACKUP_FILENAME_RE.fullmatch(filename):
        raise HTTPException(status_code=400, detail="Noto'g'ri zaxira fayl nomi")
    backup_path = os.path.abspath(os.path.join(BACKUP_DIR, filename))
    backup_root = os.path.abspath(BACKUP_DIR)
    if os.path.commonpath([backup_root, backup_path]) != backup_root:
        raise HTTPException(status_code=400, detail="Noto'g'ri zaxira fayl yo'li")
    return backup_path


@router.get("/")
def list_backups(current_user: User = Depends(get_current_superadmin)):
    backups = []
    if os.path.exists(BACKUP_DIR):
        for f in os.listdir(BACKUP_DIR):
            if BACKUP_FILENAME_RE.fullmatch(f):
                path = os.path.join(BACKUP_DIR, f)
                stat = os.stat(path)
                backups.append(
                    {
                        "filename": f,
                        "size_bytes": stat.st_size,
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    }
                )
    # Sort descending by created_at
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return {"items": backups}


@router.post("/create")
def create_backup(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_filename = f"backup_{timestamp}.db"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    try:
        # Xavfsiz SQLite backup funksiyasi (bazani bloklamaydi)
        source = sqlite3.connect(DB_PATH)
        dest = sqlite3.connect(backup_path)
        with dest:
            source.backup(dest)
        dest.close()
        source.close()

        stat = os.stat(backup_path)

        record_audit_log(
            db=db,
            user_id=current_user.id,
            action="CREATE",
            target_type="Backup",
            target_id=None,
            details=f"Zaxira nusxasi yaratildi: {backup_filename}",
            request=request,
        )

        return {
            "status": "success",
            "filename": backup_filename,
            "size_bytes": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore/{filename}")
def restore_backup(
    filename: str,
    request: Request,
    mode: str = "replace",  # 'replace' yoki 'merge'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    backup_path = get_safe_backup_path(filename)
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Zaxira topilmadi")

    try:
        if mode == "replace":
            # Xavfsiz restore (to'liq almashtirish)
            source = sqlite3.connect(backup_path)
            dest = sqlite3.connect(DB_PATH)
            with dest:
                source.backup(dest)
            dest.close()
            source.close()
            details = f"Zaxira to'liq tiklandi (Almashtirish): {filename}"

        elif mode == "merge":
            # Merge: faqat yangi ma'lumotlarni qo'shish, mavjudlariga tegmaslik
            dest = sqlite3.connect(DB_PATH)
            escaped_backup_path = backup_path.replace("'", "''")
            dest.execute(f"ATTACH DATABASE '{escaped_backup_path}' AS backup_db")

            # Asosiy jadvallar
            tables = [
                "users",
                "patient_analyses",
                "audit_logs",
                "payments",
                "clinical_settings",
            ]

            for table in tables:
                try:
                    dest.execute(
                        f"INSERT OR IGNORE INTO {table} SELECT * FROM backup_db.{table}"
                    )
                except Exception as e:
                    print(f"Merge error for table {table}: {e}")
                    pass

            dest.commit()
            dest.execute("DETACH DATABASE backup_db")
            dest.close()
            details = f"Zaxira ma'lumotlari joriy bazaga qo'shildi (Merge): {filename}"
        else:
            raise HTTPException(status_code=400, detail="Noto'g'ri restore rejimi")

        record_audit_log(
            db=db,
            user_id=current_user.id,
            action="RESTORE",
            target_type="Backup",
            target_id=None,
            details=details,
            request=request,
        )
        db.commit()

        return {"status": "success", "message": details}
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{filename}")
def delete_backup(
    filename: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin),
):
    backup_path = get_safe_backup_path(filename)
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="Zaxira topilmadi")

    try:
        os.remove(backup_path)
        record_audit_log(
            db=db,
            user_id=current_user.id,
            action="DELETE_HARD",
            target_type="Backup",
            target_id=None,
            details=f"Zaxira nusxasi o'chirildi: {filename}",
            request=request,
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
