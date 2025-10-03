from __future__ import annotations

"""Pydantic models for knowledge base resources."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class KnowledgeItemCreate(BaseModel):
    """Schema used when creating a knowledge item."""

    title: str
    text: str
    tags: list[str] = Field(default_factory=list)
    source: Optional[str] = None


class KnowledgeItem(BaseModel):
    """Schema returned for persisted knowledge items."""

    id: str
    title: str
    text: str
    tags: list[str]
    source: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
