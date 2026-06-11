# morphocheck_backend/models/chat.py

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)

from .base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )  # if null, it's a broadcast
    reply_to_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    content = Column(Text, nullable=False)
    file_url = Column(Text, nullable=True)
    reaction = Column(String(8), nullable=True)
    message_type = Column(
        String(50), default="direct", index=True
    )  # "direct" or "broadcast"
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    __table_args__ = (
        Index(
            "ix_chat_messages_sender_recipient_created",
            "sender_id",
            "recipient_id",
            "created_at",
        ),
        Index(
            "ix_chat_messages_recipient_sender_read",
            "recipient_id",
            "sender_id",
            "is_read",
        ),
        Index("ix_chat_messages_type_created", "message_type", "created_at"),
    )
