from __future__ import annotations

"""SQLAlchemy ORM models used by the application."""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Chat(Base):
    """A persisted conversation between the user and the assistant."""

    __tablename__ = "chats"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    messages: Mapped[list[Message]] = relationship(
        "Message",
        back_populates="chat",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Message(Base):
    """A single message exchanged within a chat."""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    chat_id: Mapped[str] = mapped_column(String, ForeignKey("chats.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    chat: Mapped[Chat] = relationship("Chat", back_populates="messages", lazy="selectin")
