from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Enterprise Knowledge Assistant"
    llm_provider: str = "gemini"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    chroma_path: Path = BACKEND_DIR / "chroma_db"
    documents_path: Path = BACKEND_DIR / "documents" / "uploads"
    collection_name: str = "enterprise_knowledge"
    chunk_size: int = 1200
    chunk_overlap: int = 200
    top_k: int = 8
    max_upload_bytes: int = 25 * 1024 * 1024
    # Supported universal file extensions
    supported_extensions: list[str] = [
        ".pdf", ".docx", ".xlsx", ".xls", ".csv", ".tsv",
        ".pptx", ".txt", ".md", ".markdown", ".json",
        ".yaml", ".yml", ".html", ".xml", ".log", ".rst",
        ".png", ".jpg", ".jpeg", ".webp",
    ]
    # NoDecode lets users provide the documented comma-separated .env value
    # instead of Pydantic's default JSON-list syntax.
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173", "http://localhost:3000", "*"]
    debug_trace: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            if value.strip() == "*":
                return ["*"]
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("llm_provider")
    @classmethod
    def validate_provider(cls, value: str) -> str:
        value = value.lower()
        if value not in {"gemini", "ollama"}:
            raise ValueError("LLM_PROVIDER must be gemini or ollama")
        return value


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    settings.documents_path.mkdir(parents=True, exist_ok=True)
    return settings
