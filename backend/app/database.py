from __future__ import annotations

"""Database session and engine management helpers."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import get_settings

Base = declarative_base()
_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _create_engine() -> None:
    """Initialise the global SQLAlchemy engine and session factory."""

    global _engine, _session_factory
    settings = get_settings()
    _engine = create_async_engine(settings.database_url, echo=settings.debug, future=True)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return a lazily instantiated async session factory."""

    global _session_factory
    if _session_factory is None:
        _create_engine()
    assert _session_factory is not None
    return _session_factory


@asynccontextmanager
async def lifespan(app) -> AsyncIterator[None]:
    """Manage engine lifecycle for FastAPI."""

    from app import models  # noqa: F401  # Ensure models are registered with SQLAlchemy metadata.

    _create_engine()
    try:
        if _engine is not None:
            async with _engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
        yield
    finally:
        if _engine is not None:
            await _engine.dispose()
