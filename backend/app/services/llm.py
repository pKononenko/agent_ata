from __future__ import annotations

"""Groq LLM helper utilities."""

from typing import AsyncIterator, Optional

import httpx

from app.config import get_settings

GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TRANSCRIBE_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"


async def generate_response(
    messages: list[dict[str, str]],
    knowledge_snippets: Optional[list[str]] = None,
    stream: bool = True,
) -> AsyncIterator[str]:
    """Stream completion tokens from Groq's chat completion API."""

    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY must be configured to stream responses.")

    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    system_messages = (
        [
            {
                "role": "system",
                "content": "\n".join(knowledge_snippets or []),
            }
        ]
        if knowledge_snippets
        else []
    )
    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": system_messages + messages,
        "stream": stream,
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", GROQ_CHAT_ENDPOINT, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                payload_line = line.removeprefix("data:").strip()
                if payload_line == "[DONE]":
                    break
                if payload_line:
                    yield payload_line


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """Transcribe audio bytes using Groq's Whisper endpoint."""

    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY must be configured to transcribe audio.")

    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    files = {"file": ("audio", audio_bytes, mime_type)}
    data = {"model": "whisper-large-v3"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            GROQ_TRANSCRIBE_ENDPOINT,
            headers=headers,
            data=data,
            files=files,
        )
        response.raise_for_status()
        return response.json().get("text", "")
