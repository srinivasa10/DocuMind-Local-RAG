from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router
from app.config import get_settings
from app.rag.chunker import RecursiveTextChunker
from app.rag.pipeline import RAGPipeline
from app.rag.vector_store import ChromaVectorStore
from app.services.embedding import EmbeddingService
from app.services.llm import GeminiProvider, LocalOllamaProvider

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    embedding = EmbeddingService()
    store = ChromaVectorStore(str(settings.chroma_path), settings.collection_name, embedding)
    if settings.llm_provider == "gemini":
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
        llm = GeminiProvider(settings.gemini_api_key, settings.gemini_model)
    else:
        llm = LocalOllamaProvider(settings.ollama_base_url, settings.ollama_model)
    app.state.pipeline = RAGPipeline(store, RecursiveTextChunker(settings.chunk_size, settings.chunk_overlap), llm, settings.top_k)
    yield


app = FastAPI(title="Enterprise Knowledge Assistant", version="1.0.0", lifespan=lifespan)
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request.state.request_id = request.headers.get("X-Request-ID", uuid4().hex)
    started = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = request.state.request_id
    response.headers["X-Response-Time-Ms"] = f"{(time.perf_counter() - started) * 1000:.1f}"
    return response


logger = logging.getLogger("app.main")


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.exception("unhandled server exception request_id=%s: %s", req_id, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}", "request_id": req_id},
    )


app.include_router(router)

