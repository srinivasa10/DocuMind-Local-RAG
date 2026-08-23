from app.rag.chunker import RecursiveTextChunker


def test_chunker_bounds_chunks_and_preserves_overlap():
    chunks = RecursiveTextChunker(30, 8).split_text("One short sentence. Two short sentence. Three short sentence.")
    assert len(chunks) > 1
    assert all(len(chunk) <= 38 for chunk in chunks)
    # A non-empty tail remains in the next chunk; boundary whitespace is trimmed.
    assert chunks[0][-6:] in chunks[1]


def test_chunker_rejects_invalid_settings():
    try: RecursiveTextChunker(10, 10)
    except ValueError: pass
    else: raise AssertionError("Expected configuration error")
