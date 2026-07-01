from typing import Set
from sqlalchemy.orm import Session
from models.blocked_ip import BlockedIP
from utils.database import SessionLocal

# In-memory cache for ultra-fast middleware lookups
BLOCKED_IPS_CACHE: Set[str] = set()

def load_blocked_ips_to_cache():
    global BLOCKED_IPS_CACHE
    db = SessionLocal()
    try:
        blocked = db.query(BlockedIP).all()
        BLOCKED_IPS_CACHE = {b.ip_address for b in blocked}
        print(f"[SECURITY] Loaded {len(BLOCKED_IPS_CACHE)} blocked IPs into cache.")
    except Exception as e:
        print(f"[SECURITY] Error loading blocked IPs: {e}")
    finally:
        db.close()

def is_ip_blocked(ip_address: str) -> bool:
    if not ip_address:
        return False
    return ip_address in BLOCKED_IPS_CACHE

def block_ips(db: Session, ips: list[str], reason: str = "Blocked by Superadmin"):
    newly_blocked = []
    for ip in ips:
        if not ip:
            continue
        if ip not in BLOCKED_IPS_CACHE:
            # Add to DB
            existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()
            if not existing:
                b = BlockedIP(ip_address=ip, reason=reason)
                db.add(b)
                newly_blocked.append(b)
            BLOCKED_IPS_CACHE.add(ip)
    
    if newly_blocked:
        db.commit()
    return len(newly_blocked)
