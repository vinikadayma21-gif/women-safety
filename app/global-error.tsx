"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SafeCity Global Error Caught]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0a0d14",
          color: "#f1f5f9",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "520px",
            width: "90%",
            backgroundColor: "#131823",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <AlertTriangle size={28} color="#f87171" aria-hidden="true" style={{ flexShrink: 0 }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#f87171" }}>
                SafeCity Application Error
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
                The application encountered an unexpected error:
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#0a0d14",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "14px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#fca5a5",
              wordBreak: "break-word",
              maxHeight: "220px",
              overflowY: "auto",
              marginBottom: "20px",
              whiteSpace: "pre-wrap",
            }}
          >
            {error?.message || "Unknown error occurred"}
            {error?.stack && (
              <div style={{ marginTop: "10px", color: "#64748b", fontSize: "11px" }}>
                {error.stack}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => reset()}
              style={{
                flex: 1,
                padding: "10px 16px",
                backgroundColor: "#10b981",
                color: "#0a0d14",
                border: "none",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                padding: "10px 16px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                color: "#e2e8f0",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
