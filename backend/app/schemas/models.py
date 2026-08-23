from __future__ import annotations

from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    document: str
    page: int | None = None
    chunk_id: str


class RetrievedChunk(BaseModel):
    text: str
    # Chroma cosine distance: lower values are nearer. It is not a percentage.
    distance: float
    metadata: dict[str, str | int | float | bool | None]


class IngestResponse(BaseModel):
    document_id: str
    filename: str
    chunks_ingested: int
    pages_processed: int
    is_duplicate: bool = False


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    chunks_count: int
    pages_count: int


class DocumentListResponse(BaseModel):
    total_documents: int
    total_chunks: int
    documents: list[DocumentInfo]


class DeleteDocumentResponse(BaseModel):
    success: bool
    document_id: str
    message: str


class ClearDocumentsResponse(BaseModel):
    success: bool
    deleted_chunks: int
    message: str


class QueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    top_k: int | None = Field(default=None, ge=1, le=10)
    include_trace: bool = False
    document_id: str | None = None


class QueryTrace(BaseModel):
    retrieved_chunks: list[RetrievedChunk]
    prompt: str


class LatencyMetrics(BaseModel):
    retrieval_ms: float
    llm_ms: float
    total_ms: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceCitation]
    latency: LatencyMetrics
    trace: QueryTrace | None = None


class HealthResponse(BaseModel):
    status: str
    provider: str
    collection_chunks: int

