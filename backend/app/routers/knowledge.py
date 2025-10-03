"""Knowledge base management routes."""

from __future__ import annotations

import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session_factory
from app.models import Chat
from app.schemas.knowledge import KnowledgeItem, KnowledgeItemCreate
from app.storage.vector_store import VectorStoreClient, create_knowledge_item, embed_text

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


async def get_session() -> AsyncIterator[AsyncSession]:
    """Provide a scoped async SQLAlchemy session."""

    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


@router.post("/", response_model=KnowledgeItem)
async def upsert_item(payload: KnowledgeItemCreate) -> KnowledgeItem:
    """Create or update a knowledge item in the vector store."""

    item_id = str(uuid.uuid4())
    return await create_knowledge_item(payload, item_id)


@router.get("/search", response_model=list[KnowledgeItem])
async def search_knowledge(query: str) -> list[KnowledgeItem]:
    """Search the vector store for items similar to the provided query."""

    vector = await embed_text(query)
    client = VectorStoreClient()
    results = await client.query(vector)
    await client.close()
    return results


@router.post("/chat/{chat_id}/remember")
async def remember_chat(chat_id: str, session: AsyncSession = Depends(get_session)) -> KnowledgeItem:
    """Persist all messages from a chat as a single knowledge item."""

    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await session.refresh(chat, attribute_names=["messages"])
    aggregated = "\n".join(message.content for message in chat.messages)
    item = await create_knowledge_item(
        KnowledgeItemCreate(title=f"Chat memory {chat_id}", text=aggregated, tags=["memory"], source="chat"),
        item_id=str(uuid.uuid4()),
    )
    return item
