from __future__ import annotations

import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.config import get_settings
from app.schemas.models import (
    ClearDocumentsResponse,
    DeleteDocumentResponse,
    DocumentListResponse,
    HealthResponse,
    IngestResponse,
    QueryRequest,
    QueryResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def get_pipeline(request: Request):
    return request.app.state.pipeline


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    pipeline = get_pipeline(request)
    return HealthResponse(
        status="ok",
        provider=get_settings().llm_provider,
        collection_chunks=pipeline.store.get_collection_stats()["chunks"],
    )


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(request: Request) -> DocumentListResponse:
    return await get_pipeline(request).list_documents()


@router.delete("/documents/{document_id}", response_model=DeleteDocumentResponse)
async def delete_document(request: Request, document_id: str) -> DeleteDocumentResponse:
    return await get_pipeline(request).delete_document(document_id)


@router.delete("/documents", response_model=ClearDocumentsResponse)
async def clear_documents(request: Request) -> ClearDocumentsResponse:
    return await get_pipeline(request).clear_all()


@router.post("/documents/ingest", response_model=IngestResponse)
async def ingest_document(request: Request, file: UploadFile = File(...)) -> IngestResponse:
    settings = get_settings()
    if not file.filename or Path(file.filename).suffix.lower() not in {".txt", ".pdf"}:
        raise HTTPException(415, "Only TXT and PDF files are supported")
    payload = await file.read()
    if not payload:
        raise HTTPException(422, "Uploaded file is empty")
    if len(payload) > settings.max_upload_bytes:
        raise HTTPException(413, "Uploaded file exceeds the 10 MB limit")
    safe_name = Path(file.filename).name
    destination = settings.documents_path / f"{uuid4().hex}_{safe_name}"
    destination.write_bytes(payload)
    try:
        result = await get_pipeline(request).ingest(destination, safe_name)
        logger.info(
            "ingested document request_id=%s filename=%s chunks=%s duplicate=%s",
            request.state.request_id,
            safe_name,
            result.chunks_ingested,
            result.is_duplicate,
        )
        return result
    except Exception as exc:
        destination.unlink(missing_ok=True)
        logger.exception("ingestion failed request_id=%s", request.state.request_id)
        raise HTTPException(422, f"Unable to ingest document: {exc}") from exc


@router.post("/query", response_model=QueryResponse)
async def query(request: Request, body: QueryRequest) -> QueryResponse:
    try:
        result = await get_pipeline(request).query(
            body.question,
            body.top_k,
            body.include_trace and get_settings().debug_trace,
            body.document_id,
        )
        logger.info(
            "query request_id=%s doc_id=%s retrieval_ms=%.1f llm_ms=%.1f",
            request.state.request_id,
            body.document_id,
            result.latency.retrieval_ms,
            result.latency.llm_ms,
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("query failed request_id=%s", request.state.request_id)
        raise HTTPException(
            503,
            f"The answer provider is unavailable or encountered an error: {exc}",
        ) from exc

