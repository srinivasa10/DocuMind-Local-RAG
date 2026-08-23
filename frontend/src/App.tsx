import React, { useEffect, useState } from "react";
import { ChatArea } from "./components/ChatArea";
import { DocumentList } from "./components/DocumentList";
import { DocumentUpload } from "./components/DocumentUpload";
import {
  askQuestion,
  clearAllDocuments,
  deleteDocument,
  fetchHealth,
  listDocuments,
} from "./services/api";
import type {
  ChatMessage,
  DocumentInfo,
  HealthResponse,
  IngestResponse,
} from "./types";

export default function App() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [trace, setTrace] = useState(false);
  const [topK, setTopK] = useState(4);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load existing documents & backend health on mount
  async function refreshData() {
    setDocLoading(true);
    try {
      const [healthRes, docsRes] = await Promise.all([
        fetchHealth().catch(() => null),
        listDocuments().catch(() => ({ total_documents: 0, total_chunks: 0, documents: [] })),
      ]);
      if (healthRes) setHealth(healthRes);
      setDocuments(docsRes.documents);
      setTotalChunks(docsRes.total_chunks);
    } catch {
      // Graceful error ignore
    } finally {
      setDocLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  function handleDocumentIngested(_: IngestResponse) {
    refreshData();
  }

  async function handleDeleteDocument(documentId: string) {
    setDocLoading(true);
    setError("");
    try {
      await deleteDocument(documentId);
      if (selectedDocId === documentId) {
        setSelectedDocId(null);
      }
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDocLoading(false);
    }
  }

  async function handleClearAll() {
    setDocLoading(true);
    setError("");
    try {
      await clearAllDocuments();
      setDocuments([]);
      setTotalChunks(0);
      setSelectedDocId(null);
      setMessages([]);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear knowledge base");
    } finally {
      setDocLoading(false);
    }
  }

  async function handleSendMessage(questionText: string) {
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: questionText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    setError("");

    try {
      const res = await askQuestion(questionText, trace, topK, selectedDocId);
      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: res.answer,
        response: res,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Query request failed";
      setError(errorMsg);
      const assistantErrorMsg: ChatMessage = {
        id: `assistant_err_${Date.now()}`,
        role: "assistant",
        content: `⚠️ Error generating answer: ${errorMsg}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, assistantErrorMsg]);
    } finally {
      setBusy(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-badge">
          <span className="status-dot" />
          {health ? `${health.provider.toUpperCase()} ENGINE · ${totalChunks} VECTORS INDEXED` : "LOCAL-FIRST RAG SYSTEM"}
        </div>
        <h1 className="app-title">Enterprise Knowledge Assistant</h1>
        <p className="app-subtitle">
          Ask questions strictly grounded in your enterprise documents with verified citations and inspectable vector retrieval traces.
        </p>
      </header>

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginLeft: "auto", padding: "2px 8px", fontSize: "0.75rem" }}
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Knowledge Management + ChatGPT Chat Interface */}
      <div className="dashboard-grid">
        {/* Left Column: Knowledge Management */}
        <div>
          <DocumentUpload onIngested={handleDocumentIngested} />
          <DocumentList
            documents={documents}
            totalChunks={totalChunks}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
            onDelete={handleDeleteDocument}
            onClearAll={handleClearAll}
            loading={docLoading}
          />
        </div>

        {/* Right Column: ChatGPT Conversational Stream */}
        <div>
          <ChatArea
            messages={messages}
            busy={busy}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            trace={trace}
            onToggleTrace={setTrace}
            topK={topK}
            onTopKChange={setTopK}
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
          />
        </div>
      </div>
    </div>
  );
}



