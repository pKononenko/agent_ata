from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional

import httpx

from ..config import get_settings
from ..schemas.knowledge import KnowledgeItem, KnowledgeItemCreate


@dataclass
class VectorStoreItem:
    id: str
    payload: dict
    vector: list[float]


class VectorStoreClient:
    """Minimal Qdrant-compatible client used for knowledge base storage."""

    def __init__(self, collection: str = "knowledge_items"):
        self.settings = get_settings()
        self.collection = collection
        self.base_url = self.settings.vector_store_url.replace("qdrant://", "http://")
        self._http = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def ensure_collection(self, vector_size: int = 1536):
        try:
            await self._http.put(
                f"/collections/{self.collection}",
                json={
                    "name": self.collection,
                    "vectors": {"size": vector_size, "distance": "Cosine"},
                },
            )
        except httpx.HTTPStatusError:
            pass

    async def upsert(self, items: Iterable[VectorStoreItem]):
        await self._http.put(
            f"/collections/{self.collection}/points",
            json={
                "points": [
                    {"id": item.id, "payload": item.payload, "vector": item.vector}
                    for item in items
                ]
            },
        )

    async def query(self, text_vector: list[float], limit: int = 4) -> list[KnowledgeItem]:
        response = await self._http.post(
            f"/collections/{self.collection}/points/search",
            json={"vector": text_vector, "limit": limit, "with_payload": True},
        )
        response.raise_for_status()
        results = response.json().get("result", [])
        items: list[KnowledgeItem] = []
        for entry in results:
            payload = entry.get("payload", {})
            items.append(
                KnowledgeItem(
                    id=str(entry["id"]),
                    title=payload.get("title", "Untitled"),
                    text=payload.get("text", ""),
                    tags=payload.get("tags", []),
                    source=payload.get("source"),
                    created_at=datetime.fromisoformat(payload.get("created_at")),
                )
            )
        return items

    async def close(self):
        await self._http.aclose()


async def embed_text(text: str) -> list[float]:
    """Placeholder embedding using Groq LLM embedding endpoint."""
    settings = get_settings()
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"} if settings.groq_api_key else {}
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
    vector = await embed_text(payload.text)
    created_at = datetime.utcnow().isoformat()
    client = VectorStoreClient()
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
                    "created_at": created_at,
                },
                vector=vector,
            )
        ]
    )
    await client.close()
    return KnowledgeItem(
        id=item_id,
        title=payload.title,
        text=payload.text,
        tags=payload.tags,
        source=payload.source,
        created_at=datetime.fromisoformat(created_at),
    )
