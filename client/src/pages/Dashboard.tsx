// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type DocKind = "personal" | "shared";

type DocMeta = {
  id: string;
  type: DocKind;
  title: string;
  createdAt: string;
  updatedAt: string;
  hasLiveView?: boolean; // for personal docs that have /view link
};

const DOC_INDEX_KEY = "docIndex";

function readDocIndex(): DocMeta[] {
  try {
    const raw = window.localStorage.getItem(DOC_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeDocIndex(docs: DocMeta[]) {
  window.localStorage.setItem(DOC_INDEX_KEY, JSON.stringify(docs));
}

export default function Dashboard() {
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setDocs(readDocIndex());
  }, []);

  const refreshDocs = () => setDocs(readDocIndex());

  const handleNewPersonal = () => {
    const id =
      "personal-" +
      Math.random().toString(36).slice(2, 9) +
      "-" +
      Date.now().toString(36);
    const now = new Date().toISOString();
    const next = [
      ...readDocIndex(),
      {
        id,
        type: "personal",
        title: "Untitled personal",
        createdAt: now,
        updatedAt: now,
      },
    ];
    writeDocIndex(next);
    setDocs(next);
    navigate(`/personal/${id}`);
  };

  const handleNewShared = () => {
    const id =
      "shared-" +
      Math.random().toString(36).slice(2, 9) +
      "-" +
      Date.now().toString(36);
    const now = new Date().toISOString();
    const next = [
      ...readDocIndex(),
      {
        id,
        type: "shared",
        title: "Untitled shared",
        createdAt: now,
        updatedAt: now,
      },
    ];
    writeDocIndex(next);
    setDocs(next);
    navigate(`/shared/${id}`);
  };

  const personalDocs = docs.filter((d) => d.type === "personal");
  const sharedDocs = docs.filter((d) => d.type === "shared");

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div>
          <h1>Collaborative Notes</h1>
          <div className="small">
            Personal & shared docs with live views and collaboration.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={handleNewPersonal}>
            + New personal doc
          </button>
          <button className="btn" onClick={handleNewShared}>
            + New shared doc
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* PERSONAL DOCS */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Personal docs</h3>
            <button
              className="btn"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={refreshDocs}
            >
              Refresh
            </button>
          </div>
          {personalDocs.length === 0 ? (
            <div className="small" style={{ color: "#64748b" }}>
              No personal docs yet. Create one to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {personalDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="card"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid rgba(15,23,42,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {doc.title || doc.id}
                      </div>
                      <div className="small">
                        ID: <code>{doc.id}</code>
                      </div>
                    </div>
                    <div className="small" style={{ textAlign: "right" }}>
                      <div>Updated: {formatTime(doc.updatedAt)}</div>
                      <div>
                        Live view:{" "}
                        <span style={{ fontWeight: 600 }}>
                          {doc.hasLiveView ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn"
                      onClick={() => navigate(`/personal/${doc.id}`)}
                    >
                      Open
                    </button>
                    <button
                      className="btn"
                      onClick={() => navigate(`/shared/${doc.id}`)}
                    >
                      Open as shared (if converted)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SHARED DOCS */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Shared docs</h3>
            <button
              className="btn"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={refreshDocs}
            >
              Refresh
            </button>
          </div>
          {sharedDocs.length === 0 ? (
            <div className="small" style={{ color: "#64748b" }}>
              No shared docs yet. Create one or convert a personal doc.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sharedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="card"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid rgba(15,23,42,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {doc.title || doc.id}
                      </div>
                      <div className="small">
                        ID: <code>{doc.id}</code>
                      </div>
                    </div>
                    <div className="small" style={{ textAlign: "right" }}>
                      <div>Updated: {formatTime(doc.updatedAt)}</div>
                      <div>
                        Status:{" "}
                        <span style={{ fontWeight: 600 }}>Collaborative</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/shared/${doc.id}`)}
                    >
                      Open (shared)
                    </button>
                    <button
                      className="btn"
                      onClick={() => navigate(`/personal/${doc.id}`)}
                    >
                      Open as personal copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link to="/personal/new" className="small">
          → Quick: new personal doc
        </Link>{" "}
        ·{" "}
        <Link to="/shared/new" className="small">
          new shared doc
        </Link>
      </div>
      
      <div style={{ marginTop: 16 }}>
        <Link to="/ai" className="small">
        Try AI analyzer playground</Link>
      </div>

    </div>
  );
}
