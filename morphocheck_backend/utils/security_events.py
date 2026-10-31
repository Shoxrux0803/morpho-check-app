from datetime import datetime, timedelta
from typing import Optional, Sequence

from fastapi import Request
from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.chat import ChatMessage
from models.security_event import SecurityEvent
from models.user import User

SECURITY_WINDOW_MINUTES = 15
HIGH_ATTEMPT_THRESHOLD = 5
CRITICAL_ATTEMPT_THRESHOLD = 10


def get_request_ip(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    forwarded_for = request.headers.get("x-forwarded-for") or request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()[:64]
    return (request.client.host if request.client else None)


def _normalize_email(email: Optional[str]) -> Optional[str]:
    value = (email or "").strip().lower()
    return value[:120] or None


def _calculate_attempts(db: Session, event_type: str, email: Optional[str], ip_address: Optional[str]) -> int:
    since = datetime.now() - timedelta(minutes=SECURITY_WINDOW_MINUTES)
    query = db.query(SecurityEvent).filter(
        SecurityEvent.event_type == event_type,
        SecurityEvent.created_at >= since,
    )
    filters = []
    if email:
        filters.append(SecurityEvent.email == email)
    if ip_address:
        filters.append(SecurityEvent.ip_address == ip_address)
    if filters:
        query = query.filter(or_(*filters))
    return (query.count() or 0) + 1


def _severity(base: str, attempts: int) -> str:
    if attempts >= CRITICAL_ATTEMPT_THRESHOLD:
        return "critical"
    if attempts >= HIGH_ATTEMPT_THRESHOLD:
        return "high"
    return base



def _get_or_create_security_bot(db: Session) -> User:
    bot = db.query(User).filter(User.email == "security_bot@system.local").first()
    if not bot:
        bot = User(
            name="Xavfsizlik xabarlari",
            email="security_bot@system.local",
            role="admin",
            is_deleted=0
        )
        db.add(bot)
        db.commit()
        db.refresh(bot)
    return bot

def _notify_superadmins_of_security_event(db: Session, event: SecurityEvent):
    try:
        bot = _get_or_create_security_bot(db)
        superadmins = db.query(User).filter(User.role == "superadmin", User.is_deleted == 0).all()
        if not superadmins:
            return

        severity_label = "CRITICAL 🔴" if event.severity == "critical" else "YUQORI 🟠" if event.severity == "high" else "O'RTA 🟡"
        message_content = f"⚠️ {severity_label} Xavfsizlik Hodisasi!\n\n"
        message_content += f"Hodisa: {event.event_type}\n"
        if event.email:
            message_content += f"Email: {event.email}\n"
        if event.ip_address:
            message_content += f"IP: {event.ip_address}\n"
        message_content += f"Urinishlar: {event.attempts}\n\n"
        # The user requested a button or link. We can add a relative link that the frontend can parse,
        # or we can rely on the frontend detecting Markdown/links.
        message_content += "Batafsil ma'lumot uchun xavfsizlik sahifasiga kiring: [Security Settings](/superadmin?tab=security)"

        for sa in superadmins:
            new_msg = ChatMessage(
                sender_id=bot.id,
                recipient_id=sa.id,
                content=message_content,
                message_type="direct"
            )
            db.add(new_msg)
        db.commit()
    except Exception as exc:
        db.rollback()
        print(f"Error notifying superadmins: {exc}")

def record_security_event(

    db: Session,
    event_type: str,
    request: Optional[Request] = None,
    email: Optional[str] = None,
    details: Optional[str] = None,
    severity: str = "medium",
    threat_type: Optional[str] = None,
    risk_score: int = 0,
    action_taken: Optional[str] = None,
    matched_signals: Optional[Sequence[str] | str] = None,
) -> SecurityEvent:
    normalized_email = _normalize_email(email)
    ip_address = get_request_ip(request)
    attempts = _calculate_attempts(db, event_type, normalized_email, ip_address)
    if isinstance(matched_signals, (list, tuple, set)):
        signals_text = "; ".join(str(item) for item in matched_signals)
    else:
        signals_text = matched_signals
    event = SecurityEvent(
        event_type=event_type,
        severity=_severity(severity, attempts),
        status="new",
        email=normalized_email,
        ip_address=ip_address,
        user_agent=((request.headers.get("user-agent") or "")[:255] if request else None),
        method=(request.method[:12] if request else None),
        path=(str(request.url.path)[:255] if request else None),
        details=(details[:1000] if details else None),
        threat_type=(threat_type[:80] if threat_type else None),
        risk_score=max(0, min(100, int(risk_score or 0))),
        action_taken=(action_taken[:80] if action_taken else None),
        matched_signals=(signals_text[:2000] if signals_text else None),
        attempts=attempts,
    )
    db.add(event)
    try:
        db.commit()
        db.refresh(event)
    except Exception as exc:
        db.rollback()
        print(f"Error saving security event: {exc}")

    _notify_superadmins_of_security_event(db, event)

    return event
