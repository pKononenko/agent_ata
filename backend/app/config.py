from functools import lru_cache
from typing import List

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
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

    allowed_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])

    signalling_secret: str = Field(
        "", description="Optional shared secret to authenticate WebRTC signalling clients.", env="SIGNALLING_SECRET"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("allowed_origins", pre=True)
    def _split_origins(cls, value: str | List[str]):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
