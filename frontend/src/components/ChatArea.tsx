import React, { useEffect, useRef, useState } from "react";
import type { ChatMessage, DocumentInfo, RetrievedChunk } from "../types";

const SUGGESTIONS = [
  {
    id: "title",
    text: "What is the title and objective of the document?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    colorClass: "purple",
  },
  {
    id: "summary",
    text: "Summarize the key findings and requirements.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    colorClass: "teal",
  },
  {
    id: "policies",
    text: "What are the main policies and procedures mentioned?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    colorClass: "blue",
  },
  {
    id: "conclusions",
    text: "What are the conclusions or next steps outlined?",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    colorClass: "amber",
  },
];

interface ChatAreaProps {
  messages: ChatMessage[];
  busy: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  trace: boolean;
  onToggleTrace: (val: boolean) => void;
  topK: number;
  onTopKChange: (val: number) => void;
  documents: DocumentInfo[];
  selectedDocId: string | null;
  onSelectDoc: (val: string | null) => void;
}

export function ChatArea({
  messages,
  busy,
  onSendMessage,
  onClearChat,
  trace,
  onToggleTrace,
  topK,
  onTopKChange,
  documents = [],
  selectedDocId,
  onSelectDoc,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<RetrievedChunk | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const safeDocs = Array.isArray(documents) ? documents : [];
  const activeDoc = safeDocs.find((d) => d.document_id === selectedDocId);

  // Auto-scroll to bottom on new messages or busy state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length >= 3 && !busy) {
      onSendMessage(trimmed);
      setInput(""); // Clear input area immediately on send
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // If Ctrl+Enter or Shift+Enter, allow inserting a newline
    if ((e.ctrlKey || e.shiftKey) && e.key === "Enter") {
      return;
    }
    // If Enter pressed alone, send message
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

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
        return <div key={idx} style={{ height: "6px" }} />;
      }
      return <p key={idx} style={{ marginBottom: "6px" }}>{line}</p>;
    });
  }

  return (
    <section className="card chat-container-futuristic">
      {/* Knowledge Chat Header with Neon Line, Document Scope Filter & Top-K Slider */}
      <div className="chat-header-bar">
        <div className="chat-title-group">
          <div className="chat-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="chat-title-text-wrap">
            <h2 className="chat-title-heading">Knowledge Chat</h2>
            <div className="chat-title-neon-bar" />
          </div>
        </div>

        <div className="chat-header-actions">
          {/* Document Scope Filter Dropdown */}
          <div className="doc-scope-selector-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-teal)" strokeWidth="2.2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <select
              className="doc-scope-select"
              value={selectedDocId || "ALL"}
              onChange={(e) => onSelectDoc(e.target.value === "ALL" ? null : e.target.value)}
              title="Filter retrieval search to a specific document"
            >
              <option value="ALL">All Documents ({safeDocs.length})</option>
              {safeDocs.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  📄 {d.filename} ({d.chunks_count} chunks)
                </option>
              ))}
            </select>
          </div>


          {messages.length > 0 && (
            <button
              type="button"
              className="btn-clear-chat"
              onClick={onClearChat}
              title="Clear conversation"
            >
              Clear Chat
            </button>
          )}

          {/* Futuristic Top-K Control */}
          <div className="topk-futuristic-control">
            <span className="topk-label">
              Top-K: <strong>{topK}</strong>
            </span>
            <div className="slider-glow-wrapper">
              <input
                type="range"
                min="1"
                max="8"
                value={topK}
                onChange={(e) => onTopKChange(Number(e.target.value))}
                className="topk-slider"
                title={`Top-K retrieved vector chunks: ${topK}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="chat-messages-scroll">
        {messages.length === 0 ? (
          <div className="chat-welcome-futuristic">
            {/* Animated AI Glowing Orb with Orbital Rings and Particles */}
            <div className="ai-orb-container">
              {/* Particle Stars */}
              <div className="orb-particle particle-1" />
              <div className="orb-particle particle-2" />
              <div className="orb-particle particle-3" />
              <div className="orb-particle particle-4" />

              {/* Orbit Ellipse Rings */}
              <div className="orb-orbit ring-outer" />
              <div className="orb-orbit ring-inner" />

              {/* Glowing Core Orb */}
              <div className="ai-orb-core">
                <div className="orb-glass-shine" />
                <div className="orb-inner-glow" />
                <div className="orb-lightning-bolt">⚡</div>
              </div>
            </div>

            {/* Welcome Title */}
            <h3 className="welcome-heading">
              How can <span className="gradient-highlight">I help with your</span> documents today?
            </h3>
            <p className="welcome-subtext">
              Ask any question grounded in your uploaded knowledge base. The assistant provides verified evidence, citations, and exact references.
            </p>

            {/* 4 Interactive Category Cards (2x2 Grid) */}
            <div className="futuristic-suggestions-grid">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`futuristic-card ${s.colorClass}`}
                  onClick={() => {
                    setInput(s.text);
                    textareaRef.current?.focus();
                  }}
                >
                  <div className={`card-icon-box ${s.colorClass}`}>
                    {s.icon}
                  </div>
                  <span className="card-question-text">{s.text}</span>
                  <div className="card-arrow-indicator">→</div>
                  <div className={`card-bottom-glow ${s.colorClass}`} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-message-row ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === "user" ? (
                  <span title="You">👤</span>
                ) : (
                  <span title="Knowledge Assistant">⚡</span>
                )}
              </div>

              <div className="chat-bubble">
                <div className="chat-bubble-header">
                  <span className="chat-sender-name">
                    {msg.role === "user" ? "You" : "Enterprise Assistant"}
                  </span>
                  {msg.role === "assistant" && (
                    <button
                      type="button"
                      className="btn-icon-copy"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="chat-bubble-text">{renderFormattedText(msg.content)}</div>

                {/* Assistant metadata: latencies & citations */}
                {msg.response && (
                  <>
                    {/* Latency bar */}
                    <div className="chat-latency-bar">
                      <span className="latency-item">
                        🔍 Vector Retrieval: <strong>{msg.response.latency.retrieval_ms.toFixed(1)} ms</strong>
                      </span>
                      <span className="latency-item">
                        ⚡ LLM Generation: <strong>{msg.response.latency.llm_ms.toFixed(1)} ms</strong>
                      </span>
                      <span className="latency-item">
                        ⏱️ Total Latency: <strong>{msg.response.latency.total_ms.toFixed(1)} ms</strong>
                      </span>
                    </div>

                    {/* Sources */}
                    {msg.response.sources && msg.response.sources.length > 0 && (
                      <div className="chat-sources-section">
                        <div className="sources-title">
                          📑 Grounded Sources ({msg.response.sources.length}):
                        </div>
                        <div className="chat-sources-tags">
                          {msg.response.sources.map((s) => {
                            const matched = msg.response?.trace?.retrieved_chunks?.find(
                              (c) => String(c.metadata?.chunk_id) === s.chunk_id
                            );
                            const distance = matched?.distance;
                            const matchPercent = distance !== undefined
                              ? Math.max(0, Math.min(100, Math.round((1 - distance) * 100)))
                              : null;

                            return (
                              <button
                                key={s.chunk_id}
                                type="button"
                                className="source-tag-btn"
                                onClick={() => matched && setSelectedChunk(matched)}
                                title={matched ? "Click to preview chunk excerpt" : undefined}
                              >
                                <span>📄 {s.document}</span>
                                {s.page ? <span className="source-tag-page">p.{s.page}</span> : null}
                                {matchPercent !== null && (
                                  <span className="source-tag-match">{matchPercent}% match</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Trace Inspector */}
                    {msg.response.trace && (
                      <details className="chat-trace-details">
                        <summary>🔍 Inspect Retrieval Trace & Prompt</summary>
                        <pre>
                          <strong>PROMPT:</strong>
                          {"\n"}
                          {msg.response.trace.prompt}
                          {"\n\n"}
                          <strong>CHUNKS:</strong>
                          {"\n"}
                          {JSON.stringify(msg.response.trace.retrieved_chunks, null, 2)}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator when awaiting answer */}
        {busy && (
          <div className="chat-message-row assistant">
            <div className="chat-avatar">⚡</div>
            <div className="chat-bubble chat-typing-bubble">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span style={{ fontSize: "0.82rem", color: "#38bdf8" }}>
                Searching knowledge base & generating grounded response…
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chunk Preview Modal / Drawer */}
      {selectedChunk && (
        <div className="chunk-preview-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
              SOURCE CHUNK PREVIEW: {String(selectedChunk.metadata?.source || "")} (ID: {String(selectedChunk.metadata?.chunk_id || "")})
            </span>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "2px 8px", fontSize: "0.72rem" }}
              onClick={() => setSelectedChunk(null)}
            >
              Close
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#e2e8f0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
            "{selectedChunk.text}"
          </p>
        </div>
      )}

      {/* Futuristic Floating Pill-Shaped Chat Input Bar */}
      <div className="floating-chat-input-wrapper">
        {activeDoc && (
          <div className="active-scope-pill-banner">
            <span className="scope-pill-icon">🎯</span>
            <span className="scope-pill-text">
              Grounded strictly in: <strong>{activeDoc.filename}</strong>
            </span>
            <button
              type="button"
              className="btn-clear-scope"
              onClick={() => onSelectDoc(null)}
              title="Clear filter and search all documents"
            >
              Search All (✕)
            </button>
          </div>
        )}

        <div className="pill-input-box">
          <textarea
            ref={textareaRef}
            value={input}
            disabled={busy}
            placeholder={
              activeDoc
                ? `Ask a question specifically about "${activeDoc.filename}"...`
                : "Ask your question..."
            }
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="pill-send-btn"
            disabled={busy || input.trim().length < 3}
            onClick={() => handleSend()}
            title="Send question (Enter)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="chat-input-trust-footer">
          <span className="trust-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Responses are grounded in your uploaded documents
          </span>
          <span className="bullet-sep">•</span>
          <span className="trust-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            100% Secure & Private
          </span>
        </div>
      </div>
    </section>
  );
}

