from __future__ import annotations

from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """Model boundary: only this class knows about sentence-transformers."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5") -> None:
        self.model = SentenceTransformer(model_name, device="cpu")

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()

    def embed_query(self, question: str) -> list[float]:
        # BGE models recommend query instruction for maximum similarity retrieval accuracy
        formatted_query = f"Represent this sentence for searching relevant passages: {question.strip()}"
        return self.model.encode([formatted_query], normalize_embeddings=True, show_progress_bar=False)[0].tolist()

