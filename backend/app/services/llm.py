from __future__ import annotations

"""Groq LLM helper utilities."""

from typing import AsyncIterator, Optional

import httpx
from openai import APIStatusError, AsyncOpenAI, OpenAIError

from app.config import get_settings

GROQ_TRANSCRIBE_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"

_chat_client: AsyncOpenAI | None = None


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


def _get_chat_client() -> AsyncOpenAI:
    """Return a lazily instantiated Groq-compatible OpenAI client."""

    global _chat_client

    if _chat_client is None:
        settings = get_settings()
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY must be configured to use Groq services.")

        _chat_client = AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    return _chat_client


async def generate_response(
    messages: list[dict[str, str]],
    knowledge_snippets: Optional[list[str]] = None,
    stream: bool = True,
) -> AsyncIterator[str]:
    """Stream completion tokens from Groq's chat completion API."""

    if not messages:
        raise ValueError("At least one chat message is required to request a completion.")

    client = _get_chat_client()
    request_messages = _combine_messages(messages, knowledge_snippets)

    try:
        if stream:
            completion = await client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=request_messages,
                stream=True,
            )
        else:
            completion = await client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=request_messages,
                stream=False,
            )
    except APIStatusError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        raise RuntimeError(
            "Groq chat completion request failed with status "
            f"{exc.status_code}: {detail}"
        ) from exc
    except OpenAIError as exc:  # pragma: no cover - network errors only
        raise RuntimeError(f"Groq chat completion request failed: {exc}") from exc

    if not stream:
        message = completion.choices[0].message.content if completion.choices else ""
        if message:
            yield message
        return

    try:
        async for chunk in completion:
            yield chunk.model_dump_json(exclude_none=True)
    finally:
        await completion.aclose()


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
