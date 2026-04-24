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

@router.post("/send", response_model=ChatMessageOut)
def send_message(
    msg: ChatMessageCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if msg.message_type == "broadcast" and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Only Superadmin can send broadcast messages")
    
    if not msg.recipient_id and current_user.role != "superadmin":
        # Find first superadmin to send message to
        superadmin = db.query(User).filter(User.role == "superadmin").first()
        if superadmin:
            msg.recipient_id = superadmin.id
        else:
            # Fallback if no superadmin found (should not happen normally)
            pass

    new_msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=msg.recipient_id,
        content=msg.content,
        message_type=msg.message_type,
        reply_to_id=msg.reply_to_id,
        file_url=msg.file_url
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
    
    # Add sender names and reply info
    results = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        out = ChatMessageOut.from_orm(m)
        out.sender_name = sender.name if sender else "System"
        
        if m.reply_to_id:
            parent = db.query(ChatMessage).filter(ChatMessage.id == m.reply_to_id).first()
            if parent:
                out.reply_to_content = parent.content
                parent_sender = db.query(User).filter(User.id == parent.sender_id).first()
                out.reply_to_sender = parent_sender.name if parent_sender else "User"
                
        results.append(out)
        
    return results

class ConversationOut(BaseModel):
    user_id: int
    user_name: str
    user_role: str
    last_message: str
    last_message_time: datetime
    unread_count: int
    is_last_message_mine: bool

@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_superadmin), 
    db: Session = Depends(get_db)
):
    # Get all users who have sent/received messages to/from superadmin
    # We want to find unique "other" users
    
    # Find all unique user IDs that interacted with current_user
    # Messages TO me
    to_me = db.query(ChatMessage.sender_id).filter(ChatMessage.recipient_id == current_user.id).distinct()
    # Messages FROM me
    from_me = db.query(ChatMessage.recipient_id).filter(ChatMessage.sender_id == current_user.id).filter(ChatMessage.recipient_id.isnot(None)).distinct()
    
    interacted_user_ids = set([r[0] for r in to_me.all()] + [r[0] for r in from_me.all()])
    
    results = []
    for uid in interacted_user_ids:
        user_obj = db.query(User).filter(User.id == uid).first()
        if not user_obj: continue
        
        # Get last message
        last_msg = db.query(ChatMessage).filter(
            ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == uid)) |
            ((ChatMessage.sender_id == uid) & (ChatMessage.recipient_id == current_user.id))
        ).order_by(ChatMessage.created_at.desc()).first()
        
        if not last_msg: continue
        
        # Get unread count (messages FROM them TO me)
        unread = db.query(ChatMessage).filter(
            ChatMessage.sender_id == uid,
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False
        ).count()
        
        results.append({
            "user_id": user_obj.id,
            "user_name": user_obj.name,
            "user_role": user_obj.role,
            "last_message": last_msg.content,
            "last_message_time": last_msg.created_at,
            "unread_count": unread,
            "is_last_message_mine": last_msg.sender_id == current_user.id
        })
    
    # Sort by last message time
    results.sort(key=lambda x: x["last_message_time"], reverse=True)
    return results

@router.get("/history/{user_id}", response_model=List[ChatMessageOut])
def get_chat_history(
    user_id: int,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # For superadmin, get history with user_id
    # For normal user, they can only see history with superadmin (user_id must be superadmin or self)
    
    messages = db.query(ChatMessage).filter(
        ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == user_id)) |
        ((ChatMessage.sender_id == user_id) & (ChatMessage.recipient_id == current_user.id))
    ).order_by(ChatMessage.created_at.asc()).all()
    
    # Add sender names
    results = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        out = ChatMessageOut.from_orm(m)
        out.sender_name = sender.name if sender else "User"
        
        if m.reply_to_id:
            parent = db.query(ChatMessage).filter(ChatMessage.id == m.reply_to_id).first()
            if parent:
                out.reply_to_content = parent.content
                parent_sender = db.query(User).filter(User.id == parent.sender_id).first()
                out.reply_to_sender = parent_sender.name if parent_sender else "User"
        
        results.append(out)
        
    return results

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
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    return {"file_url": f"/uploads/{unique_filename}"}

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
