"""Chat-related API routes."""

from __future__ import annotations

import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session_factory
from app.models import Chat, Message
from app.schemas.chat import Chat as ChatSchema
from app.schemas.chat import ChatCreate, Message as MessageSchema, MessageCreate
from app.services import llm, voice

router = APIRouter(prefix="/chats", tags=["chats"])


async def get_session() -> AsyncIterator[AsyncSession]:
    """Provide a scoped async SQLAlchemy session."""

    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session


@router.get("/", response_model=list[ChatSchema])
async def list_chats(session: AsyncSession = Depends(get_session)) -> list[ChatSchema]:
    """Return all persisted chats ordered by creation time."""

    result = await session.execute(
        select(Chat)
            .options(selectinload(Chat.messages))
            .order_by(Chat.created_at.desc())
    )
    chats = result.scalars().all()
    return [ChatSchema.from_orm(chat) for chat in chats]


@router.post("/", response_model=ChatSchema)
async def create_chat(payload: ChatCreate, session: AsyncSession = Depends(get_session)) -> ChatSchema:
    """Create and persist a new chat."""

    chat = Chat(id=str(uuid.uuid4()), title=payload.title)
    session.add(chat)
    await session.commit()
    await session.refresh(chat)
    return ChatSchema.from_orm(chat)


@router.delete("/{chat_id}", status_code=204, response_class=Response)
async def delete_chat(chat_id: str, session: AsyncSession = Depends(get_session)) -> Response:
    """Delete a chat and all of its messages."""

    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await session.delete(chat)
    await session.commit()
    return Response(status_code=204)


@router.post("/{chat_id}/messages", response_model=MessageSchema)
async def post_message(
    chat_id: str, payload: MessageCreate, session: AsyncSession = Depends(get_session)
) -> MessageSchema:
    """Persist a message belonging to a chat."""

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
    return MessageSchema.from_orm(message)


@router.get("/{chat_id}/messages", response_model=list[MessageSchema])
async def list_messages(
    chat_id: str, session: AsyncSession = Depends(get_session)
) -> list[MessageSchema]:
    """Return all messages for the specified chat ordered chronologically."""

    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    result = await session.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [MessageSchema.from_orm(message) for message in messages]


@router.post("/{chat_id}/stream")
async def stream_completion(chat_id: str, session: AsyncSession = Depends(get_session)) -> StreamingResponse:
    """Stream a completion from the LLM for the specified chat."""

    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    await session.refresh(chat)
    await session.refresh(chat, attribute_names=["messages"])
    history: list[dict[str, str]] = [
        {"role": message.role, "content": message.content}
        for message in sorted(chat.messages, key=lambda m: m.created_at)
    ]

    async def token_stream() -> AsyncIterator[str]:
        async for chunk in llm.generate_response(history):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(token_stream(), media_type="text/event-stream")


@router.post("/{chat_id}/speak")
async def speak_message(
    chat_id: str, payload: MessageCreate, session: AsyncSession = Depends(get_session)
) -> StreamingResponse:
    """Stream ElevenLabs audio for the provided text payload."""

    chat = await session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    async def audio_stream() -> AsyncIterator[bytes]:
        async for audio_chunk in voice.stream_tts(payload.content):
            yield audio_chunk

    headers = {"Content-Disposition": f"inline; filename=chat-{chat_id}.mp3"}
    return StreamingResponse(audio_stream(), media_type="audio/mpeg", headers=headers)
