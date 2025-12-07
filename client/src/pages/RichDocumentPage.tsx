// client/src/pages/RichDocumentPage.tsx
import { useParams, Link } from "react-router-dom";
import RichEditor from "../components/RichEditor";

export default function RichDocumentPage() {
  const { id } = useParams<{ id?: string }>();
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
              Rich text playground • custom toolbar on top of your real-time
              backend.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to={`/plain/${id}`} className="btn-chip">
            Switch to plain view
          </Link>
        </div>
      </header>

      <div
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(148,163,184,0.6)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <RichEditor docId={id} />
      </div>
    </div>
  );
}
