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

        # Find document header (first non-empty line of page 1) for context enrichment
        doc_header = ""
        if pages and pages[0].text:
            first_lines = [line.strip() for line in pages[0].text.splitlines() if line.strip()]
            if first_lines:
                doc_header = first_lines[0][:100]

        for page_text in pages:
            page_num = page_text.page or 1
            raw_chunks = self.chunker.split_text(page_text.text)
            for chunk_index, text in enumerate(raw_chunks):
                stable = hashlib.sha256(f"{document_id}:{page_num}:{chunk_index}:{text}".encode()).hexdigest()[:16]
                
                # Context-enriched chunk text: attaches document title, page, and header
                prefix_parts = [f"Document: {original_name}"]
                if doc_header and doc_header != original_name:
                    prefix_parts.append(f"Header: {doc_header}")
                if page_text.page:
                    prefix_parts.append(f"Page: {page_num}")
                
                context_prefix = f"[{' | '.join(prefix_parts)}]\n"
                enriched_text = f"{context_prefix}{text}"

                ids.append(stable)
                texts.append(enriched_text)
                metadatas.append({
                    "source": original_name,
                    "page": page_num,
                    "chunk_id": stable,
                    "document_id": document_id,
                })

        if not texts:
            from app.config import get_settings
            settings = get_settings()
            if not settings.gemini_api_key:
                raise ValueError(
                    "No extractable text found. This document appears to be scanned or image-based. "
                    "Set GEMINI_API_KEY in your .env file to enable automatic OCR for scanned PDFs and image documents."
                )
            raise ValueError(
                "No extractable text found. The document may be corrupted, password-protected, or contain "
                "only non-textual content that could not be processed."
            )

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

