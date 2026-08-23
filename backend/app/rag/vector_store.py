from __future__ import annotations

from typing import Protocol

import chromadb

from app.schemas.models import RetrievedChunk


class Embeddings(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, question: str) -> list[float]: ...


class ChromaVectorStore:
    def __init__(self, path: str, collection_name: str, embeddings: Embeddings) -> None:
        self.embeddings = embeddings
        self.client = chromadb.PersistentClient(path=path)
        self.collection = self.create_collection(collection_name)

    def create_collection(self, name: str):
        return self.client.get_or_create_collection(name=name, metadata={"hnsw:space": "cosine"})

    def add_documents(self, ids: list[str], texts: list[str], metadatas: list[dict]) -> None:
        embeddings = self.embeddings.embed_documents(texts)
        try:
            self.collection.upsert(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
        except Exception as exc:
            if "dimension" in str(exc).lower():
                # Stale collection with previous embedding dimensions; reset and recreate cleanly
                name = self.collection.name
                try:
                    self.client.delete_collection(name)
                except Exception:
                    pass
                self.collection = self.create_collection(name)
                self.collection.upsert(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
            else:
                raise

    def get_document_intro(self, document_id: str | None = None) -> list[RetrievedChunk]:
        where = {"document_id": document_id} if document_id else None
        try:
            results = self.collection.get(where=where, limit=2, include=["documents", "metadatas"])
            docs = results.get("documents", []) or []
            metas = results.get("metadatas", []) or []
            return [
                RetrievedChunk(text=text, distance=0.0, metadata=meta or {})
                for text, meta in zip(docs, metas)
            ]
        except Exception:
            return []

    def search(self, question: str, top_k: int, document_id: str | None = None) -> list[RetrievedChunk]:
        if self.collection.count() == 0:
            return []
        try:
            query_params: dict = {
                "query_embeddings": [self.embeddings.embed_query(question)],
                "n_results": min(top_k, self.collection.count()),
            }
            if document_id:
                query_params["where"] = {"document_id": document_id}
            result = self.collection.query(**query_params)
        except Exception as exc:
            if "dimension" in str(exc).lower():
                return []
            raise
        documents = result.get("documents", [[]])[0]
        distances = result.get("distances", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        chunks = [
            RetrievedChunk(text=text, distance=float(distance), metadata=metadata)
            for text, distance, metadata in zip(documents, distances, metadatas)
        ]

        # For overview, title, or summary questions, ensure opening page (Page 1) is present
        q_lower = question.lower()
        title_keywords = {"title", "name", "about", "overview", "summary", "summarize", "author", "topic", "subject", "purpose", "document"}
        is_meta_query = any(kw in q_lower for kw in title_keywords)
        has_page_1 = any(c.metadata.get("page") in (1, 0, None) for c in chunks)

        if is_meta_query and not has_page_1:
            intro_chunks = self.get_document_intro(document_id)
            existing_texts = {c.text for c in chunks}
            for intro in intro_chunks:
                if intro.text not in existing_texts:
                    chunks.insert(0, intro)
                    break

        return chunks

    def delete_document(self, document_id: str) -> None:
        self.collection.delete(where={"document_id": document_id})

    def list_documents(self) -> list[dict]:
        if self.collection.count() == 0:
            return []
        data = self.collection.get(include=["metadatas"])
        metadatas = data.get("metadatas") or []
        docs: dict[str, dict] = {}
        for meta in metadatas:
            if not meta:
                continue
            doc_id = str(meta.get("document_id", "unknown"))
            source = str(meta.get("source", "untitled"))
            page = meta.get("page")
            if doc_id not in docs:
                docs[doc_id] = {
                    "document_id": doc_id,
                    "filename": source,
                    "chunks_count": 0,
                    "pages": set(),
                }
            docs[doc_id]["chunks_count"] += 1
            if page:
                docs[doc_id]["pages"].add(page)

        return [
            {
                "document_id": d["document_id"],
                "filename": d["filename"],
                "chunks_count": d["chunks_count"],
                "pages_count": max(len(d["pages"]), 1),
            }
            for d in docs.values()
        ]

    def clear_all(self) -> int:
        count = self.collection.count()
        if count > 0:
            name = self.collection.name
            self.client.delete_collection(name)
            self.collection = self.create_collection(name)
        return count

    def get_collection_stats(self) -> dict[str, int]:
        return {"chunks": self.collection.count()}

