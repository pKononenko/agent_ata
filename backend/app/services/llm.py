from __future__ import annotations

"""Groq LLM helper utilities."""

from typing import AsyncIterator, Optional

from contextlib import asynccontextmanager

import httpx

from app.config import get_settings

GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_TRANSCRIBE_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"


def _build_headers(*, accept: str, content_type: str | None = "application/json") -> dict[str, str]:
    """Return default headers for Groq API requests."""

    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY must be configured to use Groq services.")

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Accept": accept,
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _combine_messages(
    messages: list[dict[str, str]], knowledge_snippets: Optional[list[str]]
) -> list[dict[str, str]]:
    """Merge user/assistant history with optional knowledge snippets."""

    merged = []
    if knowledge_snippets:
        merged.append(
            {
                "role": "system",
                "content": "\n".join(snippet for snippet in knowledge_snippets if snippet),
            }
        )

    merged.extend(messages)
    return merged


@asynccontextmanager
async def _groq_stream_client(method: str, url: str, **kwargs):
    """Context manager that raises helpful errors for Groq streaming requests."""

    async with httpx.AsyncClient(timeout=None) as client:
        try:
            async with client.stream(method, url, **kwargs) as response:
                response.raise_for_status()
                yield response
        except httpx.HTTPStatusError as exc:  # pragma: no cover - network errors only
            detail: str
            try:
                payload = await exc.response.aread()
                detail = payload.decode() if payload else exc.response.text
            except Exception:  # noqa: BLE001 - best effort decoding
                detail = "<unable to decode error payload>"

            raise RuntimeError(
                "Groq chat completion request failed with status "
                f"{exc.response.status_code}: {detail}"
            ) from exc


async def generate_response(
    messages: list[dict[str, str]],
    knowledge_snippets: Optional[list[str]] = None,
    stream: bool = True,
) -> AsyncIterator[str]:
    """Stream completion tokens from Groq's chat completion API."""

    if not messages:
        raise ValueError("At least one chat message is required to request a completion.")

    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": _combine_messages(messages, knowledge_snippets),
        "stream": stream,
    }

    headers = _build_headers(accept="text/event-stream")

    async with _groq_stream_client(
        "POST", GROQ_CHAT_ENDPOINT, headers=headers, json=payload
    ) as response:
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

    headers = _build_headers(accept="application/json", content_type=None)
    files = {"file": ("audio", audio_bytes, mime_type)}
    data = {"model": "whisper-large-v3"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                GROQ_TRANSCRIBE_ENDPOINT,
                headers=headers,
                data=data,
                files=files,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:  # pragma: no cover - network errors only
            detail: str
            try:
                body = await exc.response.aread()
                detail = body.decode() if body else exc.response.text
            except Exception:  # noqa: BLE001 - best effort decoding
                detail = "<unable to decode error payload>"
            raise RuntimeError(
                "Groq transcription request failed with status "
                f"{exc.response.status_code}: {detail}"
            ) from exc

        return response.json().get("text", "")
