import React, { useState } from "react";
import type { QueryResponse } from "../types";

export function AnswerCard({ answer }: { answer: QueryResponse }) {
  const [copied, setCopied] = useState(false);

  function copyAnswer() {
    navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Format basic markdown elements: paragraphs and bullets
  function renderFormattedText(text: string) {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} style={{ marginLeft: "20px", marginBottom: "4px" }}>
            {line.substring(2)}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} style={{ height: "8px" }} />;
      }
      return <p key={idx}>{line}</p>;
    });
  }

  return (
    <section className="card answer-card">
      <div className="answer-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Assistant Response
        </h2>
        <button
          type="button"
          className="btn-secondary"
          onClick={copyAnswer}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <div className="answer-body">{renderFormattedText(answer.answer)}</div>

      <div className="latency-bar">
        <div className="metric-pill">
          <span>🔍 Vector Retrieval:</span>
          <strong>{answer.latency.retrieval_ms.toFixed(1)} ms</strong>
        </div>
        <div className="metric-pill">
          <span>⚡ LLM Generation:</span>
          <strong>{answer.latency.llm_ms.toFixed(1)} ms</strong>
        </div>
        <div className="metric-pill">
          <span>⏱️ Total Latency:</span>
          <strong>{answer.latency.total_ms.toFixed(1)} ms</strong>
        </div>
      </div>
    </section>
  );
}


