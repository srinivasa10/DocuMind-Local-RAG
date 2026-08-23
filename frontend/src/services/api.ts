import type {
  ClearDocumentsResponse,
  DeleteDocumentResponse,
  DocumentListResponse,
  HealthResponse,
  IngestResponse,
  QueryResponse,
} from "../types";

const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Server error" }));
    throw new Error(body.detail || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return parse(await fetch(`${baseUrl}/health`));
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return parse(await fetch(`${baseUrl}/documents`));
}

export async function deleteDocument(documentId: string): Promise<DeleteDocumentResponse> {
  return parse(await fetch(`${baseUrl}/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" }));
}

export async function clearAllDocuments(): Promise<ClearDocumentsResponse> {
  return parse(await fetch(`${baseUrl}/documents`, { method: "DELETE" }));
}

export async function ingestDocument(file: File): Promise<IngestResponse> {
  const form = new FormData();
  form.append("file", file);
  return parse(await fetch(`${baseUrl}/documents/ingest`, { method: "POST", body: form }));
}

export async function askQuestion(
  question: string,
  includeTrace: boolean,
  topK?: number,
  documentId?: string | null
): Promise<QueryResponse> {
  return parse(
    await fetch(`${baseUrl}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        include_trace: includeTrace,
        top_k: topK,
        document_id: documentId || null,
      }),
    })
  );
}


