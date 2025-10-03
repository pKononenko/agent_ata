from __future__ import annotations

from typing import AsyncIterator, Optional

import httpx

from ..config import get_settings


async def generate_response(
    messages: list[dict[str, str]],
    knowledge_snippets: Optional[list[str]] = None,
    stream: bool = True,
) -> AsyncIterator[str]:
    """Stream completion tokens from Groq's chat completion API."""

    settings = get_settings()
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"} if settings.groq_api_key else {}
    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": messages
        + (
            [
                {
                    "role": "system",
                    "content": "\n".join(knowledge_snippets or []),
                }
            ]
            if knowledge_snippets
            else []
        ),
        "stream": stream,
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", "https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    line = line.removeprefix("data:").strip()
                    if line == "[DONE]":
                        break
                    yield line


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    settings = get_settings()
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"} if settings.groq_api_key else {}
    files = {"file": ("audio", audio_bytes, mime_type)}
    data = {"model": "whisper-large-v3"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers=headers,
            data=data,
            files=files,
        )
        response.raise_for_status()
        return response.json().get("text", "")
