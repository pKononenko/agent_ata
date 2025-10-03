"""Application configuration utilities."""

from functools import lru_cache
from typing import Iterable, List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the FastAPI application."""

    app_name: str = "Groq ElevenLabs Multimodal Chat"
    debug: bool = False

    database_url: str = Field(
        "sqlite+aiosqlite:///./chat.db",
        description="SQLAlchemy connection URL for chat history storage.",
    )

    vector_store_url: str = Field(
        "qdrant://localhost:6333",
        description="Connection URL to the vector store used for knowledge base embeddings.",
    )

    groq_api_key: str = Field("", description="API key for Groq LLM + STT services.")
    elevenlabs_api_key: str = Field("", description="API key for ElevenLabs text-to-speech streaming.")

    allowed_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"],
        description="Origins permitted to access the API via CORS.",
    )

    signalling_secret: str = Field(
        "",
        description="Optional shared secret to authenticate WebRTC signalling clients.",
        env="SIGNALLING_SECRET",
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("allowed_origins", mode="before")
    def _split_origins(cls, value: Union[str, Iterable[str]]) -> List[str]:
        """Support comma-separated origins while keeping list inputs untouched."""

        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return list(value)


@lru_cache
def get_settings() -> Settings:
    """Return a cached instance of :class:`Settings`."""

    return Settings()
