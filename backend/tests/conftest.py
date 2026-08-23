import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from app.rag.pipeline import RAGPipeline
from app.rag.chunker import RecursiveTextChunker
from app.schemas.models import RetrievedChunk


class FakeStore:
    def __init__(self) -> None:
        self.added = []

    def add_documents(self, ids, texts, metadatas):
        self.added.extend(zip(ids, texts, metadatas))

    def search(self, question, top_k, document_id=None):
        if document_id and document_id != "doc":
            return []
        return [RetrievedChunk(text="Employees receive 20 paid annual-leave days per calendar year.", distance=0.12, metadata={"source": "leave_policy.txt", "page": 0, "chunk_id": "abc", "document_id": "doc"})]

    def list_documents(self):
        return [{"document_id": "doc", "filename": "leave_policy.txt", "chunks_count": 1, "pages_count": 1}]

    def delete_document(self, document_id: str):
        self.added = [item for item in self.added if item[2].get("document_id") != document_id]

    def clear_all(self):
        count = len(self.added)
        self.added.clear()
        return count


class FakeLLM:
    async def generate(self, prompt: str) -> str: return "Employees receive 20 paid annual-leave days per calendar year."


@pytest.fixture
def pipeline(): return RAGPipeline(FakeStore(), RecursiveTextChunker(80, 10), FakeLLM(), 4)

