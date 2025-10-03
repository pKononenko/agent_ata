from __future__ import annotations

"""Voice synthesis utilities."""

from typing import AsyncIterator

import httpx

from app.config import get_settings

ELEVENLABS_TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"


async def stream_tts(text: str, voice_id: str = "eleven_multilingual_v2") -> AsyncIterator[bytes]:
    """Stream audio bytes for the provided text using ElevenLabs."""

    settings = get_settings()
    if not settings.elevenlabs_api_key:
        raise RuntimeError("ELEVENLABS_API_KEY must be configured to stream audio.")

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
            ELEVENLABS_TTS_ENDPOINT.format(voice_id=voice_id),
            headers=headers,
            json=payload,
        ) as response:
            response.raise_for_status()
            async for chunk in response.aiter_bytes():
                yield chunk
