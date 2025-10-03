from __future__ import annotations

from typing import AsyncIterator

import httpx

from ..config import get_settings


async def stream_tts(text: str, voice_id: str = "eleven_multilingual_v2") -> AsyncIterator[bytes]:
    settings = get_settings()
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "voice_settings": {"stability": 0.35, "similarity_boost": 0.75},
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
            headers=headers,
            json=payload,
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes():
                yield chunk
