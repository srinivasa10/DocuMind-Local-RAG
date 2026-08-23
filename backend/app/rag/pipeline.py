import asyncio
import hashlib
import time
from pathlib import Path

from app.rag.chunker import RecursiveTextChunker
from app.rag.loaders import extract_text
from app.rag.prompt import NOT_FOUND_ANSWER, build_prompt
from app.rag.vector_store import ChromaVectorStore
from app.schemas.models import (
    ClearDocumentsResponse,
    DeleteDocumentResponse,
    DocumentInfo,
    DocumentListResponse,
    IngestResponse,
    LatencyMetrics,
    QueryResponse,
    QueryTrace,
    RetrievedChunk,
    SourceCitation,
)
from app.services.llm import LLMService


class RAGPipeline:
    def __init__(self, store: ChromaVectorStore, chunker: RecursiveTextChunker, llm: LLMService, default_top_k: int) -> None:
        self.store, self.chunker, self.llm, self.default_top_k = store, chunker, llm, default_top_k

    def _sync_ingest(self, file_path: Path, original_name: str) -> IngestResponse:
        # Deterministic document ID based on file content for deduplication
        file_bytes = file_path.read_bytes()
        document_id = hashlib.sha256(file_bytes).hexdigest()[:16]

        # Check if already present
        existing_docs = self.store.list_documents()
        for doc in existing_docs:
            if doc["document_id"] == document_id:
                return IngestResponse(
                    document_id=document_id,
                    filename=original_name,
                    chunks_ingested=doc["chunks_count"],
                    pages_processed=doc["pages_count"],
                    is_duplicate=True,
                )

        pages = extract_text(file_path)
        ids: list[str] = []
        texts: list[str] = []
        metadatas: list[dict] = []

        for page_text in pages:
            for chunk_index, text in enumerate(self.chunker.split_text(page_text.text)):
                stable = hashlib.sha256(f"{document_id}:{page_text.page}:{chunk_index}:{text}".encode()).hexdigest()[:16]
                ids.append(stable)
                texts.append(text)
                metadatas.append({"source": original_name, "page": page_text.page or 0, "chunk_id": stable, "document_id": document_id})

        if not texts:
            raise ValueError("The document did not contain extractable text")

        self.store.add_documents(ids, texts, metadatas)
        return IngestResponse(
            document_id=document_id,
            filename=original_name,
            chunks_ingested=len(texts),
            pages_processed=len(pages),
            is_duplicate=False,
        )

    async def ingest(self, file_path: Path, original_name: str) -> IngestResponse:
        return await asyncio.to_thread(self._sync_ingest, file_path, original_name)

    async def query(self, question: str, top_k: int | None, include_trace: bool, document_id: str | None = None) -> QueryResponse:
        started = time.perf_counter()
        k = top_k or self.default_top_k
        chunks = await asyncio.to_thread(self.store.search, question, k, document_id)
        retrieval_ms = (time.perf_counter() - started) * 1000

        prompt = build_prompt(question, chunks)
        llm_started = time.perf_counter()
        answer = NOT_FOUND_ANSWER if not chunks else await self.llm.generate(prompt)
        llm_ms = (time.perf_counter() - llm_started) * 1000

        seen: set[tuple[str, int | None, str]] = set()
        sources: list[SourceCitation] = []
        for chunk in chunks:
            source = str(chunk.metadata.get("source", "unknown"))
            page = int(chunk.metadata.get("page", 0)) or None
            chunk_id = str(chunk.metadata.get("chunk_id", "unknown"))
            key = (source, page, chunk_id)
            if key not in seen:
                seen.add(key)
                sources.append(SourceCitation(document=source, page=page, chunk_id=chunk_id))

        total_ms = (time.perf_counter() - started) * 1000
        return QueryResponse(
            answer=answer.strip(),
            sources=sources,
            latency=LatencyMetrics(retrieval_ms=retrieval_ms, llm_ms=llm_ms, total_ms=total_ms),
            trace=QueryTrace(retrieved_chunks=chunks, prompt=prompt) if include_trace else None,
        )

    async def list_documents(self) -> DocumentListResponse:
        docs = await asyncio.to_thread(self.store.list_documents)
        total_chunks = sum(d["chunks_count"] for d in docs)
        return DocumentListResponse(
            total_documents=len(docs),
            total_chunks=total_chunks,
            documents=[DocumentInfo(**d) for d in docs],
        )

    async def delete_document(self, document_id: str) -> DeleteDocumentResponse:
        await asyncio.to_thread(self.store.delete_document, document_id)
        return DeleteDocumentResponse(
            success=True,
            document_id=document_id,
            message=f"Document {document_id} removed successfully",
        )

    async def clear_all(self) -> ClearDocumentsResponse:
        deleted = await asyncio.to_thread(self.store.clear_all)
        return ClearDocumentsResponse(
            success=True,
            deleted_chunks=deleted,
            message=f"Cleared {deleted} chunks from knowledge base",
        )

