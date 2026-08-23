from __future__ import annotations

import logging
from typing import Protocol

logger = logging.getLogger(__name__)


class EmbeddingService(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...
    def embed_query(self, question: str) -> list[float]: ...


class GeminiEmbeddingService:
    """Ultra-lightweight cloud embeddings (< 35 MB RAM), ideal for free tier cloud hosting like Render."""

    def __init__(self, api_key: str, model: str = "gemini-embedding-001") -> None:
        from google import genai

        self.client = genai.Client(api_key=api_key)
        self.model = model

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        embeddings: list[list[float]] = []
        batch_size = 20
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = self.client.models.embed_content(
                model=self.model,
                contents=batch,
            )
            for emb in response.embeddings:
                embeddings.append(emb.values)
        return embeddings

    def embed_query(self, question: str) -> list[float]:
        response = self.client.models.embed_content(
            model=self.model,
            contents=[question.strip()],
        )
        return response.embeddings[0].values


class LocalEmbeddingService:
    """Local offline embedding service using sentence-transformers (for local development)."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5") -> None:
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name, device="cpu")

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()

    def embed_query(self, question: str) -> list[float]:
        formatted_query = f"Represent this sentence for searching relevant passages: {question.strip()}"
        return self.model.encode([formatted_query], normalize_embeddings=True, show_progress_bar=False)[0].tolist()

