import React from "react";

export function LoadingState() {
  return (
    <section className="card loading-skeleton">
      <div className="skeleton-line title" />
      <div className="skeleton-line w-90" />
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-60" />
      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <div className="skeleton-line" style={{ width: "120px", height: "24px", borderRadius: "9999px" }} />
        <div className="skeleton-line" style={{ width: "120px", height: "24px", borderRadius: "9999px" }} />
      </div>
    </section>
  );
}


