from __future__ import annotations

import json
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session_factory
from ..models import Chat, Message
from ..schemas.chat import Chat as ChatSchema
from ..schemas.chat import ChatCreate, Message as MessageSchema, MessageCreate
from ..services import llm, voice
from ..storage.vector_store import embed_text

router = APIRouter(prefix="/chats", tags=["chats"])


async def get_session() -> AsyncIterator[AsyncSession]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


@router.get("/", response_model=list[ChatSchema])
async def list_chats(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Chat))
    return result.scalars().all()


@router.post("/", response_model=ChatSchema)
async def create_chat(payload: ChatCreate, session: AsyncSession = Depends(get_session)):
    chat = Chat(id=str(uuid.uuid4()), title=payload.title)
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return chat


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(chat_id: str, session: AsyncSession = Depends(get_session)):
    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await session.delete(chat)
    await session.commit()


@router.post("/{chat_id}/messages", response_model=MessageSchema)
async def post_message(chat_id: str, payload: MessageCreate, session: AsyncSession = Depends(get_session)):
    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    message = Message(
        id=str(uuid.uuid4()),
        chat_id=chat_id,
        role=payload.role,
        content=payload.content,
        audio_url=payload.audio_url,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


@router.post("/{chat_id}/stream")
async def stream_completion(chat_id: str, session: AsyncSession = Depends(get_session)):
    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    await session.refresh(chat)
    await session.refresh(chat, attribute_names=["messages"])
    history = [
        {"role": message.role, "content": message.content}
        for message in sorted(chat.messages, key=lambda m: m.created_at)
    ]

    async def token_stream():
        async for chunk in llm.generate_response(history):
            yield chunk

    return StreamingResponse(token_stream(), media_type="text/event-stream")


@router.post("/{chat_id}/speak")
async def speak_message(chat_id: str, payload: MessageCreate, session: AsyncSession = Depends(get_session)):
    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    async def audio_stream():
        async for audio_chunk in voice.stream_tts(payload.content):
            yield audio_chunk

    headers = {"Content-Disposition": f"inline; filename=chat-{chat_id}.mp3"}
    return StreamingResponse(audio_stream(), media_type="audio/mpeg", headers=headers)
