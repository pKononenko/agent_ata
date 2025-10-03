from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    role: str
    content: str
    audio_url: Optional[str] = None


class MessageCreate(MessageBase):
    pass


class Message(MessageBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True


class ChatBase(BaseModel):
    title: str = Field(..., example="Brainstorm with Groq")


class ChatCreate(ChatBase):
    pass


class Chat(ChatBase):
    id: str
    created_at: datetime
    messages: list[Message] = []

    class Config:
        orm_mode = True
