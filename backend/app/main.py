from __future__ import annotations

"""Application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import lifespan
from app.routers import chats, knowledge, realtime

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chats.router)
app.include_router(knowledge.router)
app.include_router(realtime.router)


@app.get("/")
async def root() -> dict[str, str]:
    """Simple health-check endpoint."""

    return {"status": "ok", "name": settings.app_name}
