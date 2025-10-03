from __future__ import annotations

"""Vector store integration helpers."""

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

import httpx

from app.config import get_settings
from app.schemas.knowledge import KnowledgeItem, KnowledgeItemCreate


@dataclass
class VectorStoreItem:
    """Simple representation of a point stored in the vector database."""

    id: str
    payload: dict
    vector: list[float]


class VectorStoreClient:
    """Minimal Qdrant-compatible client used for knowledge base storage."""

    def __init__(self, collection: str = "knowledge_items"):
        self.settings = get_settings()
        self.collection = collection
        raw_url = self.settings.vector_store_url
        if raw_url.startswith("qdrant+https://"):
            raw_url = raw_url.replace("qdrant+https://", "https://", 1)
        elif raw_url.startswith("qdrant://"):
            raw_url = raw_url.replace("qdrant://", "http://", 1)
        self.base_url = raw_url
        self._http = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def ensure_collection(self, vector_size: int = 1536):
        """Create the collection if it does not already exist."""

        response = await self._http.put(
            f"/collections/{self.collection}",
            json={
                "name": self.collection,
                "vectors": {"size": vector_size, "distance": "Cosine"},
            },
        )
        if response.status_code not in (200, 201, 409):
            response.raise_for_status()

    async def upsert(self, items: Iterable[VectorStoreItem]):
        """Insert or update vector store items."""

        response = await self._http.put(
            f"/collections/{self.collection}/points",
            json={
                "points": [
                    {"id": item.id, "payload": item.payload, "vector": item.vector}
                    for item in items
                ]
            },
        )
        response.raise_for_status()

    async def query(self, text_vector: list[float], limit: int = 4) -> list[KnowledgeItem]:
        """Query the collection for similar vectors."""

        response = await self._http.post(
            f"/collections/{self.collection}/points/search",
            json={"vector": text_vector, "limit": limit, "with_payload": True},
        )
        response.raise_for_status()
        results = response.json().get("result", [])
        items: list[KnowledgeItem] = []
        for entry in results:
            payload = entry.get("payload", {})
            created_at_raw = payload.get("created_at")
            try:
                created_at = datetime.fromisoformat(created_at_raw) if created_at_raw else datetime.utcnow()
            except ValueError:
                created_at = datetime.utcnow()
            items.append(
                KnowledgeItem(
                    id=str(entry["id"]),
                    title=payload.get("title", "Untitled"),
                    text=payload.get("text", ""),
                    tags=payload.get("tags", []),
                    source=payload.get("source"),
                    created_at=created_at,
                )
            )
        return items

    async def close(self) -> None:
        """Close the underlying HTTP client."""

        await self._http.aclose()


async def embed_text(text: str) -> list[float]:
    """Create an embedding vector using Groq's embedding endpoint."""

    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY must be configured to embed text.")

    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/embeddings",
            headers=headers,
            json={"input": text, "model": "text-embedding-3-large"},
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["embedding"]


async def create_knowledge_item(payload: KnowledgeItemCreate, item_id: str) -> KnowledgeItem:
    """Persist a knowledge item and return the stored representation."""

    vector = await embed_text(payload.text)
    timestamp = datetime.utcnow()
    client = VectorStoreClient()
    try:
        await client.ensure_collection(vector_size=len(vector))
        await client.upsert(
            [
                VectorStoreItem(
                    id=item_id,
                    payload={
                        "title": payload.title,
                        "text": payload.text,
                        "tags": payload.tags,
                        "source": payload.source,
                        "created_at": timestamp.isoformat(),
                    },
                    vector=vector,
                )
            ]
        )
    finally:
        await client.close()
    return KnowledgeItem(
        id=item_id,
        title=payload.title,
        text=payload.text,
        tags=payload.tags,
        source=payload.source,
        created_at=timestamp,
    )
