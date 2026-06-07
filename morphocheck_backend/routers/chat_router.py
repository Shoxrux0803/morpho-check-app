# morphocheck_backend/routers/chat_router.py

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import os
import uuid

from utils.database import get_db
from models.chat import ChatMessage
from models.user import User
from routers.auth_router import get_current_user, get_current_superadmin
from pydantic import BaseModel

router = APIRouter(tags=["Chat"])

class ChatMessageCreate(BaseModel):
    recipient_id: Optional[int] = None
    content: str
    message_type: str = "direct" # "direct" or "broadcast"
    reply_to_id: Optional[int] = None
    file_url: Optional[str] = None

class ChatMessageOut(BaseModel):
    id: int
    sender_id: int
    recipient_id: Optional[int]
    reply_to_id: Optional[int] = None
    content: str
    message_type: str
    is_read: bool
    created_at: datetime
    sender_name: Optional[str] = None
    reply_to_content: Optional[str] = None
    reply_to_sender: Optional[str] = None
    file_url: Optional[str] = None

    class Config:
        from_attributes = True

router = APIRouter(tags=["Chat"])

# Typing status storage: {user_id: {"name": str, "timestamp": datetime}}
typing_statuses: Dict[int, dict] = {}
ALLOWED_UPLOAD_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

def _active_user_filter():
    return User.is_deleted == 0

def _validate_chat_file_url(file_url: Optional[str]) -> Optional[str]:
    if not file_url:
        return None
    normalized = file_url.strip().replace("\\", "/")
    if not normalized.startswith("/uploads/chat/"):
        raise HTTPException(status_code=400, detail="Noto'g'ri fayl manzili")
    basename = os.path.basename(normalized)
    if basename != normalized.rsplit("/", 1)[-1] or not basename:
        raise HTTPException(status_code=400, detail="Noto'g'ri fayl manzili")
    return normalized

def _hydrate_messages(db: Session, messages: List[ChatMessage]) -> List[ChatMessageOut]:
    sender_ids = {m.sender_id for m in messages}
    reply_ids = {m.reply_to_id for m in messages if m.reply_to_id}

    parents = {}
    if reply_ids:
        parent_rows = db.query(ChatMessage).filter(ChatMessage.id.in_(reply_ids)).all()
        parents = {p.id: p for p in parent_rows}
        sender_ids.update(p.sender_id for p in parent_rows)

    users = {}
    if sender_ids:
        user_rows = db.query(User.id, User.name).filter(User.id.in_(sender_ids)).all()
        users = {user_id: name for user_id, name in user_rows}

    results = []
    for m in messages:
        out = ChatMessageOut.from_orm(m)
        out.sender_name = users.get(m.sender_id, "User")

        parent = parents.get(m.reply_to_id)
        if parent:
            out.reply_to_content = parent.content
            out.reply_to_sender = users.get(parent.sender_id, "User")

        results.append(out)
    return results

@router.post("/send", response_model=ChatMessageOut)
def send_message(
    msg: ChatMessageCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    msg.content = (msg.content or "").strip()
    if not msg.content and not msg.file_url:
        raise HTTPException(status_code=400, detail="Xabar bo'sh bo'lishi mumkin emas")
    if len(msg.content) > 4000:
        raise HTTPException(status_code=400, detail="Xabar juda uzun")
    if msg.message_type not in {"direct", "broadcast"}:
        raise HTTPException(status_code=400, detail="Noto'g'ri xabar turi")
    if msg.message_type == "broadcast" and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Only Superadmin can send broadcast messages")
    
    if msg.message_type == "broadcast":
        msg.recipient_id = None
    elif not msg.recipient_id and current_user.role != "superadmin":
        # Find first superadmin to send message to
        superadmin = db.query(User).filter(
            User.role == "superadmin",
            _active_user_filter()
        ).first()
        if superadmin:
            msg.recipient_id = superadmin.id
        else:
            # Fallback if no superadmin found (should not happen normally)
            raise HTTPException(status_code=503, detail="Super admin topilmadi")
    elif msg.recipient_id:
        recipient = db.query(User).filter(
            User.id == msg.recipient_id,
            _active_user_filter()
        ).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Qabul qiluvchi topilmadi")
        if current_user.role != "superadmin" and recipient.role != "superadmin":
            raise HTTPException(status_code=403, detail="Faqat super admin bilan yozish mumkin")

    new_msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=msg.recipient_id,
        content=msg.content,
        message_type=msg.message_type,
        reply_to_id=msg.reply_to_id,
        file_url=_validate_chat_file_url(msg.file_url)
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    # Add sender name for the response
    res = ChatMessageOut.from_orm(new_msg)
    res.sender_name = current_user.name
    
    # If it's a reply, get original sender name and content
    if msg.reply_to_id:
        parent = db.query(ChatMessage).filter(ChatMessage.id == msg.reply_to_id).first()
        if parent:
            res.reply_to_content = parent.content
            parent_sender = db.query(User).filter(User.id == parent.sender_id).first()
            res.reply_to_sender = parent_sender.name if parent_sender else "User"

    return res

@router.get("/my-messages", response_model=List[ChatMessageOut])
def get_my_messages(
    message_type: Optional[str] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Get messages to me OR messages FROM me OR broadcast messages
    query = db.query(ChatMessage).filter(
        (ChatMessage.recipient_id == current_user.id) | 
        (ChatMessage.sender_id == current_user.id) |
        (ChatMessage.message_type == "broadcast")
    )
    
    if message_type:
        query = query.filter(ChatMessage.message_type == message_type)
        
    messages = query.order_by(ChatMessage.created_at.desc()).limit(100).all()
    
    return _hydrate_messages(db, messages)

class ConversationOut(BaseModel):
    user_id: int
    user_name: str
    user_role: str
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int
    is_last_message_mine: bool

@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Determine which users should be visible to current_user
    if current_user.role == "superadmin":
        # Superadmin sees only active admins and researchers
        visible_users = db.query(User).filter(
            User.id != current_user.id,
            User.role.in_(["admin", "researcher"]),
            _active_user_filter()
        ).all()
    else:
        # Regular users and Admins ONLY see active Superadmins
        visible_users = db.query(User).filter(
            User.role == "superadmin",
            _active_user_filter()
        ).all()
    
    results = []
    for user_obj in visible_users:
        # Get last message between current_user and user_obj
        last_msg = db.query(ChatMessage).filter(
            ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == user_obj.id)) |
            ((ChatMessage.sender_id == user_obj.id) & (ChatMessage.recipient_id == current_user.id))
        ).order_by(ChatMessage.created_at.desc()).first()
        
        # Unread count (messages FROM them TO me)
        unread = db.query(ChatMessage).filter(
            ChatMessage.sender_id == user_obj.id,
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False
        ).count()
        
        # Only show in list if either:
        # 1. They are a superadmin (everyone sees superadmins)
        # 2. CURRENT user is a superadmin (superadmin sees everyone)
        # 3. There is an existing conversation (should be covered by above but for safety)
        
        results.append({
            "user_id": user_obj.id,
            "user_name": user_obj.name,
            "user_role": user_obj.role,
            "last_message": last_msg.content if last_msg else None,
            "last_message_time": last_msg.created_at if last_msg else None,
            "unread_count": unread,
            "is_last_message_mine": last_msg.sender_id == current_user.id if last_msg else False
        })
    
    # Sort by: unread count first, then last message time, then name
    # We use a custom sort key
    def sort_key(x):
        # 1. Unread messages first
        # 2. Most recent messages next
        # 3. Then by name
        unread_val = 1 if x["unread_count"] > 0 else 0
        time_val = x["last_message_time"].timestamp() if x["last_message_time"] else 0
        return (unread_val, time_val)

    results.sort(key=sort_key, reverse=True)
    return results

@router.get("/history/{user_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    user_id: int,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # For superadmin, get history with user_id
    # For normal user, they can only see history with superadmin (user_id must be superadmin or self)
    target_user = db.query(User).filter(
        User.id == user_id,
        _active_user_filter()
    ).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if current_user.role == "superadmin":
        if target_user.role not in ["admin", "researcher"]:
            raise HTTPException(status_code=403, detail="Bu foydalanuvchi chat ro'yxatida mavjud emas")
    elif target_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Faqat super admin bilan yozish mumkin")

    messages = db.query(ChatMessage).filter(
        ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == user_id)) |
        ((ChatMessage.sender_id == user_id) & (ChatMessage.recipient_id == current_user.id))
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return _hydrate_messages(db, messages)

@router.post("/mark-read/{message_id}")
def mark_as_read(
    message_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if msg.recipient_id == current_user.id or msg.message_type == "broadcast":
        msg.is_read = True
        db.commit()
        return {"status": "success"}
    
    raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/mark-all-read")
def mark_all_as_read(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db.query(ChatMessage).filter(
        ChatMessage.recipient_id == current_user.id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}

@router.post("/mark-read/user/{user_id}")
def mark_user_messages_read(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(ChatMessage).filter(
        ChatMessage.recipient_id == current_user.id,
        ChatMessage.sender_id == user_id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}

@router.post("/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Bu turdagi faylga ruxsat berilmagan")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Fayl hajmi 10 MB dan oshmasligi kerak")
    if not content:
        raise HTTPException(status_code=400, detail="Bo'sh fayl yuklanmaydi")

    UPLOAD_DIR = os.path.join("uploads", "chat")
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
        
    return {"file_url": f"/uploads/chat/{unique_filename}"}

@router.post("/typing")
def update_typing_status(
    current_user: User = Depends(get_current_user)
):
    typing_statuses[current_user.id] = {
        "name": current_user.name,
        "timestamp": datetime.now()
    }
    return {"status": "ok"}

@router.get("/typing-status")
def get_typing_status(
    current_user: User = Depends(get_current_user)
):
    # Remove expired statuses (older than 3 seconds)
    now = datetime.now()
    expired = [uid for uid, status in typing_statuses.items() if (now - status["timestamp"]) > timedelta(seconds=3)]
    for uid in expired:
        del typing_statuses[uid]
        
    # Return list of typing users (excluding self)
    return [
        {"id": uid, "name": status["name"]} 
        for uid, status in typing_statuses.items() 
        if uid != current_user.id
    ]
