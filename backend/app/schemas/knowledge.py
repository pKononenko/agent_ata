from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KnowledgeItemCreate(BaseModel):
    title: str
    text: str
    tags: list[str] = []
    source: Optional[str] = None


class KnowledgeItem(BaseModel):
    id: str
    title: str
    text: str
    tags: list[str]
    source: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
