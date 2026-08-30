import React, { useEffect, useState } from "react";
import type { DocumentInfo } from "../types";

interface DocumentListProps {
  documents: DocumentInfo[];
  totalChunks: number;
  selectedDocId: string | null;
  onSelectDoc: (documentId: string | null) => void;
  onDelete: (documentId: string) => void;
  onClearAll: () => void;
  loading?: boolean;
}

export function DocumentList({
  documents = [],
  totalChunks,
  selectedDocId,
  onSelectDoc,
  onDelete,
  onClearAll,
  loading = false,
}: DocumentListProps) {
  const safeDocs = Array.isArray(documents) ? documents : [];
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Auto-reset confirmation state after 4 seconds if not confirmed
  useEffect(() => {
    if (confirmingClear) {
      const timer = setTimeout(() => setConfirmingClear(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmingClear]);

  function handleClearClick() {
    if (confirmingClear) {
      setConfirmingClear(false);
      onClearAll();
    } else {
      setConfirmingClear(true);
    }
  }

  return (
    <section className="card card-sidebar">
      <div className="card-header">
        <h2 className="card-title">
          <div className="title-icon-circle cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          Indexed Documents
        </h2>
        {safeDocs.length > 0 && (
          <button
            type="button"
            className={`btn-pill-danger ${confirmingClear ? "confirming-pulse" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClearClick();
            }}
            disabled={loading}
            title={confirmingClear ? "Click again to confirm clearing all knowledge" : "Clear all indexed documents"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {confirmingClear ? "Confirm Clear All?" : "Clear All"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: "12px" }}>
        <span>Documents: <strong style={{ color: "#38bdf8" }}>{safeDocs.length}</strong></span>
        <span>Total Chunks: <strong style={{ color: "#34d399" }}>{totalChunks}</strong></span>
      </div>

      {safeDocs.length === 0 ? (
        <div className="empty-docs-box">
          <p>No documents indexed yet. Upload any document above to build your knowledge base.</p>
        </div>
      ) : (
        <div className="document-list-futuristic">
          {safeDocs.map((doc) => {
            const ext = doc.filename.split(".").pop()?.toUpperCase() || "DOC";
            const isPdf = ext === "PDF";
            const isSelected = selectedDocId === doc.document_id;

            return (
              <div
                key={doc.document_id}
                className={`doc-glass-row ${isSelected ? "scoped-active" : ""}`}
                onClick={() => onSelectDoc(isSelected ? null : doc.document_id)}
                title={isSelected ? "Click to clear document filter (Search All)" : "Click to scope queries to this document only"}
              >
                {/* Mini 3D badge */}
                <div className={`mini-doc-badge ${isPdf ? "pdf" : "txt"}`}>
                  <span className="mini-badge-corner" />
                  <span className="mini-badge-label">{ext}</span>
                </div>

                <div className="doc-main-info">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="doc-main-title" title={doc.filename}>
                      {doc.filename}
                    </span>
                    {isSelected && (
                      <span className="scoped-badge">Scoped</span>
                    )}
                  </div>
                  <span className="doc-sub-meta">
                    Indexed • {doc.chunks_count} chunk{doc.chunks_count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="doc-actions-wrap" onClick={(e) => e.stopPropagation()}>
                  {/* Status indicator */}
                  <div className="status-check-circle" title="Indexed & Searchable">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    className="btn-delete-row"
                    title={`Delete ${doc.filename}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.document_id);
                    }}
                    disabled={loading}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {documents.length > 0 && selectedDocId && (
        <button
          type="button"
          className="btn-reset-scope"
          onClick={() => onSelectDoc(null)}
        >
          <span>🎯 Scoped to 1 document</span>
          <span style={{ textDecoration: "underline", color: "var(--neon-teal)" }}>Search All Documents</span>
        </button>
      )}
    </section>
  );
}


