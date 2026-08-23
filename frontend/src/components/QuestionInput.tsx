import React, { useState } from "react";

const SUGGESTIONS = [
  "What is the annual leave allowance?",
  "What is the policy on expense reimbursement?",
  "Summarize the key requirements mentioned in the document.",
  "How should security incidents or phishing be reported?",
];

interface QuestionInputProps {
  disabled: boolean;
  onAsk: (question: string) => void;
}

export function QuestionInput({ disabled, onAsk }: QuestionInputProps) {
  const [question, setQuestion] = useState("");

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (question.trim().length >= 3 && !disabled) {
      onAsk(question.trim());
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Ask Knowledge Assistant
        </h2>
        <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
          Press <code>Ctrl+Enter</code>
        </span>
      </div>

      <div className="quick-chips">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="chip"
            onClick={() => {
              setQuestion(s);
            }}
            disabled={disabled}
          >
            💡 {s}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div className="textarea-wrapper">
          <textarea
            value={question}
            disabled={disabled}
            placeholder="Type your question grounded in the uploaded documents..."
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            {question.length} / 2000 characters
          </span>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "auto", minWidth: "160px" }}
            disabled={disabled || question.trim().length < 3}
          >
            {disabled ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "pulseDot 1s infinite" }}>
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Searching & Generating…
              </>
            ) : (
              <>
                Ask Assistant
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}


