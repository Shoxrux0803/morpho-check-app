# morphocheck_backend/utils/audit_helper.py
from sqlalchemy.orm import Session
from models.audit import AuditLog
from fastapi import Request
from typing import Optional


def record_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    details: Optional[str] = None,
    request: Optional[Request] = None,
):
    """
    Saves an audit log entry to the database.
    """
    ip_address = None
    if request:
        # Get IP from X-Forwarded-For if behind proxy, else client.host
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0]
        else:
            ip_address = request.client.host if request.client else None

    # Limit details to prevent overflow if it gets too long
    if details and len(details) > 1000:
        details = details[:997] + "..."

    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address,
    )

    db.add(log_entry)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving audit log: {e}")
