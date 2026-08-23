# Architecture and learning guide

## RAG flow

`document → loader → chunks → embeddings → ChromaDB → query embedding → nearest chunks → prompt → LLM → answer + citations`

1. **Loading** converts TXT into one text unit and PDF into page-numbered text units. PDF page numbers become citation metadata.
2. **Chunking** keeps each prompt fragment focused. The 800-character / 150-character overlap default is a deliberately visible baseline: it usually fits a policy paragraph plus nearby context while avoiding excessive duplication. Test different values against `backend/tests/evaluation_cases.json`.
3. **Embeddings** are 384-number semantic representations made locally by BGE-small. Documents and questions use the same vector space.
4. **ChromaDB** stores chunk ID, text, vector, and metadata locally. It compares the question vector with stored vectors using cosine distance. Distance ranks closeness; it is not confidence or a percentage.
5. **Retrieval** returns the nearest four chunks by default. A poor answer should first be debugged by inspecting retrieved chunks, then the prompt, and only then the LLM output.
6. **Generation** receives only labeled retrieved evidence and an explicit not-found instruction. This reduces hallucinations but cannot eliminate them; irrelevant retrieval can still lead to a bad answer.

## Interview prompts

- Why use embeddings rather than keyword matching?
- Why does chunk size influence recall, precision, and prompt cost?
- What does cosine distance measure, and why is it not a confidence score?
- How do metadata and chunk IDs make RAG answers auditable?
- How would you diagnose a wrong answer before changing models?

