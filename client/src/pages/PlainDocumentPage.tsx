// client/src/pages/PlainDocumentPage.tsx
import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PlainEditor from "../components/PlainEditor";

type DocParams = {
  id?: string;
};

function computeStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const sentences = trimmed
    ? trimmed.split(/[.!?]+/).filter(Boolean).length
    : 0;
  const readMinutes = Math.max(1, Math.ceil(words / 200)); // 200 wpm
  return { words, chars, sentences, readMinutes };
}

const PlainDocumentPage: React.FC = () => {
  const { id } = useParams<DocParams>();
  const [content, setContent] = useState("");

  const stats = useMemo(() => computeStats(content), [content]);

  if (!id) return <div style={{ padding: 20 }}>No id provided</div>;

  return (
    <div style={{ padding: 18, maxWidth: 1120, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/" style={{ color: "#4f46e5", fontSize: 14 }}>
            ← Home
          </Link>
          <div>
            <h2 style={{ margin: 0 }}>{id}</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              Plain text OT editor • best for demonstrating operations.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to={`/rich/${id}`} className="btn-chip">
            Switch to rich view
          </Link>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 1.4fr)",
          gap: 18,
        }}
      >
        <div
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(148,163,184,0.6)",
            padding: 14,
          }}
        >
          <PlainEditor
            docId={id}
            content={content}
            setContent={setContent}
            version={0}
            setVersion={() => {}}
          />
        </div>

        <aside
          style={{
            borderRadius: 16,
            background: "rgba(15,23,42,0.97)",
            border: "1px solid rgba(148,163,184,0.6)",
            padding: 14,
            color: "#e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 15 }}>
            Document stats
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <li>
              <strong>{stats.words}</strong> words
            </li>
            <li>
              <strong>{stats.chars}</strong> characters
            </li>
            <li>
              <strong>{stats.sentences}</strong> sentences
            </li>
            <li>
              ~<strong>{stats.readMinutes}</strong> min read
            </li>
          </ul>
          <p
            style={{
              fontSize: 11,
              marginTop: 10,
              color: "#9ca3af",
            }}
          >
            Open this same document in another tab to see live presence and
            cursor positions.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default PlainDocumentPage;
