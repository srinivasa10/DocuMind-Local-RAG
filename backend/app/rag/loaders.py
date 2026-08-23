from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader


@dataclass(frozen=True)
class PageText:
    page: int | None
    text: str


def extract_text(path: Path) -> list[PageText]:
    suffix = path.suffix.lower()
    if suffix == ".txt":
        return [PageText(page=None, text=path.read_text(encoding="utf-8", errors="replace"))]
    if suffix == ".pdf":
        reader = PdfReader(str(path))
        return [PageText(page=index + 1, text=page.extract_text() or "") for index, page in enumerate(reader.pages)]
    raise ValueError("Only .txt and .pdf files are supported")

