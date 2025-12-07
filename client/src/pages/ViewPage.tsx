// src/pages/ViewPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000";

type DocResponse = {
  id: string;
  readOnly: boolean;
  version: number;
  content: string;
};

export default function ViewPage() {
  const params = useParams();
  const id = params.id as string | undefined;

  const [content, setContent] = useState<string>("");
  const [version, setVersion] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadOnce() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/documents/${encodeURIComponent(id)}`
        );
        if (!res.ok) throw new Error("Server " + res.status);
        const data = (await res.json()) as DocResponse;
        if (!cancelled) {
          setContent(data.content || "");
          setVersion(data.version || 0);
          setError(null);
        }
      } catch (err) {
        console.error("view load error", err);
        if (!cancelled) {
          setError("Document not found or server offline.");
        }
      }
    }

    loadOnce();
    const interval = setInterval(loadOnce, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <Link to="/" style={{ fontSize: 13 }}>
            ← Home
          </Link>
          <h2 style={{ marginTop: 6 }}>
            View: {id} <span className="small">— Read-only</span>
          </h2>
          <div className="small">
            This is a live read-only view. You cannot edit here.
          </div>
          <div className="small" style={{ marginTop: 4 }}>
            Version: {version}
          </div>
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-card card">
          <div className="toolbar">
            <div className="small">
              Mode: <strong>Viewer</strong> (updates every second)
            </div>
          </div>

          <div
            style={{
              padding: 16,
              minHeight: 300,
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.08)",
              background: "#ffffff",
              overflowY: "auto",
            }}
          >
            {error ? (
              <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>
            ) : (
              <div
                style={{ fontSize: 14, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{
                  __html: content || "<p><em>Empty</em></p>",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
