# Enterprise Knowledge Assistant — Basic RAG

A free, local-first portfolio project that demonstrates a complete Retrieval-Augmented Generation pipeline: upload public TXT/PDF documents, retrieve semantic evidence from local ChromaDB, generate a grounded answer, and display citations.

## Why RAG?

Language models do not automatically know your current policies. RAG retrieves relevant document chunks at question time and supplies those chunks to the generator. It improves factual grounding, but it does not guarantee truth: retrieval quality, chunking, and prompt design still matter.

## Architecture

React/Vite communicates with FastAPI. The backend extracts page-aware text, recursively splits it, creates local BGE-small embeddings, stores them in local ChromaDB, retrieves top-k cosine-nearest chunks, constructs a grounded prompt, and returns an answer plus source citations. See [the learning guide](docs/architecture.md).

## Resource choices

- **Embeddings:** `BAAI/bge-small-en-v1.5`, local 384-dimensional vectors; small enough for CPU use on a 16 GB Windows laptop.
- **Default generator:** Gemini 2.5 Flash-Lite free tier, selected through `GEMINI_API_KEY`.
- **Offline generator:** Ollama with `llama3.2:3b` Q4; change `LLM_PROVIDER=ollama`.
- **Vector database:** ChromaDB persisted locally in `backend/chroma_db/`.

The default provider sends retrieved excerpts to Gemini. Use the Ollama provider for private/local learning, and do not upload confidential data to the deployed demo.

## Local setup

1. Copy `.env.example` to `backend/.env` and set `GEMINI_API_KEY`. For offline use, set `LLM_PROVIDER=ollama`, install Ollama, and pull `llama3.2:3b`.
2. In one terminal: `cd backend`, create/activate a Python virtual environment, run `pip install -r requirements.txt`, then `uvicorn app.main:app --reload`.
3. In another terminal: `cd frontend`, copy `.env.example` to `.env`, run `npm install`, then `npm run dev`.
4. Upload the public files under `backend/documents/sample/` and ask: “How many annual leave days do employees receive?”

Open API documentation is available at `http://localhost:8000/docs`.

## API

- `GET /health` — service/provider/collection status.
- `POST /documents/ingest` — multipart field `file`; TXT/PDF only, 10 MB maximum.
- `POST /query` — JSON `{ "question": "...", "top_k": 4, "include_trace": false }`.

`distance` in a development trace is a Chroma cosine distance: lower ranks nearer. It is not a percentage or certainty measure.

## Testing and evaluation

Run `cd backend && pytest`. The evaluation corpus is [backend/tests/evaluation_cases.json](backend/tests/evaluation_cases.json). It includes five supported, three unsupported, and two ambiguous prompts. Inspect trace chunks and the prompt before diagnosing an LLM failure.

## Deployment

The free public-demo path is Cloudflare Pages for the frontend and Koyeb Free for FastAPI. It requires card validation on Koyeb and has ephemeral storage, cold starts, no authentication, and no suitable handling for confidential documents. Full steps and caveats are in [docs/deployment.md](docs/deployment.md).

## Limits and roadmap

This is intentionally Basic RAG: English-only, no auth, no conversations, reranking, hybrid search, agents, or cloud vector database. Future learning steps: retrieval evaluation, hybrid search, conversational RAG, multimodal RAG, Graph RAG, and agentic RAG.

