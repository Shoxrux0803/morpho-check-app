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
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Get messages to me OR messages FROM me OR broadcast messages
    messages = db.query(ChatMessage).filter(
        (ChatMessage.recipient_id == current_user.id) | 
        (ChatMessage.sender_id == current_user.id) |
        (ChatMessage.message_type == "broadcast")
    ).order_by(ChatMessage.created_at.desc()).limit(50).all()
    
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

@router.get("/conversations", response_model=List[ChatMessageOut])
def get_conversations(
    current_user: User = Depends(get_current_superadmin), 
    db: Session = Depends(get_db)
):
    # Only for superadmin to see history with everyone
    messages = db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(100).all()
    
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
