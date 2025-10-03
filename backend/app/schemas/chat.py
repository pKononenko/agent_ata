from __future__ import annotations

"""Pydantic models for chat resources."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    """Base schema for chat messages."""

    role: str
    content: str
    audio_url: Optional[str] = None


class MessageCreate(MessageBase):
    """Schema used when creating a new message."""


class Message(MessageBase):
    """Schema returned when reading messages from the API."""

    id: str
    created_at: datetime

    class Config:
        orm_mode = True


class ChatBase(BaseModel):
    """Base schema shared across chat operations."""

    title: str = Field(..., example="Brainstorm with Groq")


class ChatCreate(ChatBase):
    """Schema used when creating a new chat."""


class Chat(ChatBase):
    """Schema returned when reading chats from the API."""

    id: str
    created_at: datetime
    messages: list[Message] = Field(default_factory=list)

    class Config:
        orm_mode = True
