import React, { useEffect, useRef, useState } from "react";
import { ingestDocument } from "../services/api";
import type { IngestResponse } from "../types";

export function DocumentUpload({ onIngested }: { onIngested: (result: IngestResponse) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [indexingStep, setIndexingStep] = useState(0);
  const [error, setError] = useState("");
  const [acknowledgement, setAcknowledgement] = useState<IngestResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoDismissTimerRef = useRef<number | null>(null);

  // Cycle animated indexing status steps while busy
  useEffect(() => {
    if (!busy) {
      setIndexingStep(0);
      return;
    }
    const interval = window.setInterval(() => {
      setIndexingStep((prev) => (prev + 1) % 3);
    }, 1400);
    return () => clearInterval(interval);
  }, [busy]);

  // Auto-dismiss the acknowledgement toast after 5 seconds
  useEffect(() => {
    if (!acknowledgement) return;

    if (autoDismissTimerRef.current) {
      window.clearTimeout(autoDismissTimerRef.current);
    }

    autoDismissTimerRef.current = window.setTimeout(() => {
      setAcknowledgement(null);
    }, 5000);

    return () => {
      if (autoDismissTimerRef.current) {
        window.clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [acknowledgement]);

  function handleFileSelect(selectedFile: File | undefined) {
    if (!selectedFile) return;
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "pdf") {
      setError("Please select a valid .txt or .pdf file.");
      setFile(null);
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10 MB maximum upload size.");
      setFile(null);
      return;
    }
    setError("");
    setAcknowledgement(null);
    setFile(selectedFile);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError("");
    setAcknowledgement(null);
    try {
      const result = await ingestDocument(file);
      onIngested(result);
      // Trigger animated acknowledgement toast
      setAcknowledgement(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const indexingStepMessages = [
    "Extracting text & metadata...",
    "Chunking & generating vector embeddings...",
    "Storing vectors in ChromaDB collection...",
  ];

  return (
    <>
      {/* Floating Animated Acknowledgement Toast (Top-Right) */}
      {acknowledgement && (
        <aside
          className="acknowledgement-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="toast-glow-border" />
          <div className="toast-content-wrapper">
            <div className="toast-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="toast-text-area">
              <div className="toast-title">
                {acknowledgement.is_duplicate ? "Knowledge Synchronized" : "Document Successfully Indexed"}
              </div>
              <div className="toast-subtext">
                <strong>{acknowledgement.filename}</strong> · {acknowledgement.chunks_ingested} chunk{acknowledgement.chunks_ingested !== 1 ? "s" : ""}
                {acknowledgement.pages_processed ? ` (${acknowledgement.pages_processed} page${acknowledgement.pages_processed !== 1 ? "s" : ""})` : ""}
              </div>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => setAcknowledgement(null)}
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
          {/* Animated 5s countdown bar */}
          <div className="toast-progress-bar" />
        </aside>
      )}

      <section className="card card-sidebar">
        <div className="card-header">
          <h2 className="card-title">
            <div className="title-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            Ingest Knowledge
          </h2>
          <span className="pill-badge-teal">TXT & PDF</span>
        </div>

        <p className="card-desc">
          Upload policy documents, handbooks, or guides to expand the assistant's knowledge base.
        </p>

        {/* Dropzone with Floating 3D badges */}
        <div
          className={`dropzone-futuristic ${isDragging ? "active" : ""} ${busy ? "busy-indexing" : ""}`}
          onDragOver={(e) => {
            if (busy) return;
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            if (busy) return;
            e.preventDefault();
            setIsDragging(false);
            handleFileSelect(e.dataTransfer.files[0]);
          }}
          onClick={() => {
            if (!busy) fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            disabled={busy}
            style={{ display: "none" }}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {/* Floating TXT Badge */}
          <div className="floating-badge txt-badge" title="Text files supported">
            <div className="badge-corner" />
            <span className="badge-type">TXT</span>
            <div className="badge-lines">
              <span />
              <span />
            </div>
          </div>

          {/* Central Glowing Upload Cloud */}
          <div className="cloud-icon-wrapper">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {/* Floating PDF Badge */}
          <div className="floating-badge pdf-badge" title="PDF documents supported">
            <div className="badge-corner" />
            <span className="badge-type">PDF</span>
            <div className="badge-lines">
              <span />
              <span />
            </div>
          </div>

          <p className="dropzone-title">Click or drag & drop a file here</p>
          <p className="dropzone-subtitle">Supports .txt and text-searchable .pdf (Up to 10MB)</p>
        </div>

        {file && !busy && (
          <div className="selected-file-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
              <span style={{ fontSize: "1.1rem" }}>📄</span>
              <span className="selected-file-name" title={file.name}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              className="btn-cancel-file"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Live Animated Indexing State Banner */}
        {busy && (
          <div className="indexing-live-banner">
            <div className="indexing-spinner">
              <div className="spinner-ring" />
              <span className="spinner-bolt">⚡</span>
            </div>
            <div className="indexing-info">
              <div className="indexing-heading">Indexing Knowledge...</div>
              <div className="indexing-step-text">
                {indexingStepMessages[indexingStep]}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button
              type="button"
              className="btn-cancel-file"
              style={{ marginLeft: "auto" }}
              onClick={() => setError("")}
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="button"
          className="btn-gradient-cta"
          disabled={!file || busy}
          onClick={submit}
        >
          {busy ? (
            <>
              <span className="btn-spinner-icon" />
              <span>Vectorizing Chunks…</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Ingest into Knowledge Base</span>
            </>
          )}
        </button>
      </section>
    </>
  );
}




