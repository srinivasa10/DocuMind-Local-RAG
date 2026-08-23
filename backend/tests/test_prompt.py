from app.rag.prompt import NOT_FOUND_ANSWER, build_prompt
from app.schemas.models import RetrievedChunk


def test_prompt_labels_evidence_and_grounding_rule():
    prompt = build_prompt("What is leave?", [RetrievedChunk(text="20 days", distance=0.1, metadata={"source": "leave.txt", "page": 2, "chunk_id": "x"})])
    assert "SOURCE: leave.txt" in prompt and "PAGE: 2" in prompt and NOT_FOUND_ANSWER in prompt

