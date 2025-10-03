"""Realtime signalling routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from app.config import get_settings

router = APIRouter(prefix="/realtime", tags=["realtime"])


async def validate_secret(secret: str | None) -> None:
    """Validate an optional shared secret for websocket clients."""

    settings = get_settings()
    if settings.signalling_secret and secret != settings.signalling_secret:
        raise HTTPException(status_code=401, detail="Invalid signalling secret")


@router.websocket("/signalling")
async def signalling_socket(websocket: WebSocket, secret: str | None = None):
    """Echo websocket that validates an optional secret."""

    await validate_secret(secret)
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_text()
            await websocket.send_text(payload)
    except WebSocketDisconnect:
        return
