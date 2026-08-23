from __future__ import annotations

from app.schemas.models import RetrievedChunk


NOT_FOUND_ANSWER = "I couldn't find this information in the provided documents."


def build_prompt(question: str, chunks: list[RetrievedChunk]) -> str:
    context = "\n\n---\n\n".join(
        f"SOURCE: {chunk.metadata.get('source', 'unknown')}\n"
        f"PAGE: {chunk.metadata.get('page', 'not applicable')}\n"
        f"CHUNK ID: {chunk.metadata.get('chunk_id', 'unknown')}\n\n"
        f"CONTENT:\n{chunk.text}"
        for chunk in chunks
    )
    return f"""You are an intelligent enterprise knowledge assistant. Answer the user's question clearly, thoroughly, and accurately based strictly on the provided context excerpts from uploaded documents.

Instructions:
- Base your answers strictly on the facts and details in the provided context.
- If the question asks for a summary, overview, purpose, or explanation of the document or topics within it, synthesize the key information from the provided excerpts.
- If the provided context does not contain any relevant information to answer the question, reply with: "{NOT_FOUND_ANSWER}"
- Structure your answer with clear markdown (bullet points, bold key terms) for high readability.
- Speak naturally about the document facts without referencing internal technical details like chunk IDs or "the context".

CONTEXT:
{context}

QUESTION: {question}
ANSWER:"""

