from __future__ import annotations


class RecursiveTextChunker:
    """Small, transparent recursive splitter using progressively weaker boundaries."""

    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150) -> None:
        if chunk_size <= 0 or not 0 <= chunk_overlap < chunk_size:
            raise ValueError("chunk_overlap must be non-negative and smaller than chunk_size")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> list[str]:
        text = "\n".join(line.rstrip() for line in text.splitlines()).strip()
        if not text:
            return []
        pieces = self._split_recursive(text, ["\n\n", "\n", ". ", " ", ""])
        chunks: list[str] = []
        current = ""
        for piece in pieces:
            remaining = piece
            while remaining:
                capacity = self.chunk_size - len(current)
                if len(remaining) <= capacity:
                    current += remaining
                    break
                current += remaining[:capacity]
                chunks.append(current.strip())
                remaining = remaining[capacity:]
                current = current[-self.chunk_overlap :] if self.chunk_overlap else ""
        if current.strip():
            chunks.append(current.strip())
        return chunks

    def _split_recursive(self, text: str, separators: list[str]) -> list[str]:
        if len(text) <= self.chunk_size or not separators:
            return [text]
        separator = separators[0]
        if not separator:
            return [text[index : index + self.chunk_size] for index in range(0, len(text), self.chunk_size)]
        parts = text.split(separator)
        result: list[str] = []
        for index, part in enumerate(parts):
            item = part + (separator if index < len(parts) - 1 else "")
            result.extend(self._split_recursive(item, separators[1:]) if len(item) > self.chunk_size else [item])
        return result
