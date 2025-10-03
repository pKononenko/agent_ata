from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from ..config import get_settings

router = APIRouter(prefix="/realtime", tags=["realtime"])


async def validate_secret(secret: str | None):
    settings = get_settings()
    if settings.signalling_secret and secret != settings.signalling_secret:
        raise HTTPException(status_code=401, detail="Invalid signalling secret")


@router.websocket("/signalling")
async def signalling_socket(websocket: WebSocket, secret: str | None = None):
    await websocket.accept()
    try:
        await validate_secret(secret)
        while True:
            payload = await websocket.receive_text()
            await websocket.send_text(payload)
    except WebSocketDisconnect:
        return
