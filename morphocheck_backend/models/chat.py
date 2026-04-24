# morphocheck_backend/models/chat.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func
from .base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True) # if null, it's a broadcast
    reply_to_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    content = Column(Text, nullable=False)
    file_url = Column(Text, nullable=True)
    message_type = Column(String(50), default="direct", index=True) # "direct" or "broadcast"
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
