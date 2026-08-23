import React, { useState } from "react";
import type { QueryResponse, RetrievedChunk } from "../types";

export function SourceList({ answer }: { answer: QueryResponse }) {
  const [selectedChunk, setSelectedChunk] = useState<RetrievedChunk | null>(null);

  if (!answer.sources || answer.sources.length === 0) {
    return null;
  }

  // Find matching trace chunks for rich preview if available
  const traceChunks = answer.trace?.retrieved_chunks || [];

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Cited Sources ({answer.sources.length})
        </h2>
        <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
          Grounded Ground-Truth Evidence
        </span>
      </div>

      <div className="sources-grid">
        {answer.sources.map((source) => {
          const matchedChunk = traceChunks.find(
            (c) => String(c.metadata?.chunk_id) === source.chunk_id
          );
          const distance = matchedChunk?.distance;
          // Cosine distance is usually 0.0 to 1.0; closer to 0 is better.
          const similarityScore =
            distance !== undefined ? Math.max(0, Math.min(100, Math.round((1 - distance) * 100))) : null;

          return (
            <div
              key={source.chunk_id}
              className="source-item"
              onClick={() => matchedChunk && setSelectedChunk(matchedChunk)}
              style={{ cursor: matchedChunk ? "pointer" : "default" }}
              title={matchedChunk ? "Click to view retrieved chunk excerpt" : undefined}
            >
              <div className="source-doc">
                📄 {source.document}
              </div>
              <div className="source-details">
                {source.page ? `Page ${source.page} · ` : ""}Chunk <code>{source.chunk_id}</code>
              </div>

              {similarityScore !== null && (
                <div className="distance-bar-wrapper">
                  <span>Match: {similarityScore}%</span>
                  <div className="distance-bar">
                    <div className="distance-fill" style={{ width: `${similarityScore}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedChunk && (
        <div
          style={{
            marginTop: "16px",
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid var(--border-focus)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-cyan)" }}>
              Excerpt for Chunk {String(selectedChunk.metadata?.chunk_id || "")}
            </span>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "2px 8px", fontSize: "0.75rem" }}
              onClick={() => setSelectedChunk(null)}
            >
              Close
            </button>
          </div>
          <p style={{ fontSize: "0.88rem", color: "#e2e8f0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
            "{selectedChunk.text}"
          </p>
        </div>
      )}
    </section>
  );
}


