export interface SourceCitation {
  document: string;
  page: number | null;
  chunk_id: string;
}

export interface RetrievedChunk {
  text: string;
  distance: number;
  metadata: Record<string, string | number | boolean | null>;
}

export interface QueryResponse {
  answer: string;
  sources: SourceCitation[];
  latency: {
    retrieval_ms: number;
    llm_ms: number;
    total_ms: number;
  };
  trace?: {
    retrieved_chunks: RetrievedChunk[];
    prompt: string;
  } | null;
}

export interface IngestResponse {
  document_id: string;
  filename: string;
  chunks_ingested: number;
  pages_processed: number;
  is_duplicate?: boolean;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  chunks_count: number;
  pages_count: number;
}

export interface DocumentListResponse {
  total_documents: number;
  total_chunks: number;
  documents: DocumentInfo[];
}

export interface DeleteDocumentResponse {
  success: boolean;
  document_id: string;
  message: string;
}

export interface ClearDocumentsResponse {
  success: boolean;
  deleted_chunks: number;
  message: string;
}

export interface HealthResponse {
  status: string;
  provider: string;
  collection_chunks: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: QueryResponse;
  timestamp: Date;
  error?: boolean;
}



