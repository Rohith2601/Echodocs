import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Editor from "../components/Editor";
import TimelineSlider from "../components/TimelineSlider";
import HeatmapPanel from "../components/HeatmapPanel";
import axiosClient from "../api/axiosClient";

const PersonalEditorPage = () => {
  const { docId } = useParams<{ docId: string }>();

  const [content, setContent] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) return;
    // If you ever persist personal docs on the backend,
    // you can fetch initial content here.
  }, [docId]);

  const handleCreateShareLink = async () => {
    if (!docId) {
      alert("No document id found.");
      return;
    }

    try {
      const res = await axiosClient.post("/api/share-personal", {
        docId,
        content,
      });

      const viewId: string = res.data.id;
      const url = `${window.location.origin}/view/${viewId}`;

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied to clipboard!");
      } catch {
        setShareStatus("Link created. Copy it manually from below.");
      }

      setShareUrl(url);
    } catch (err) {
      console.error("share error", err);
      setShareStatus(
        "Failed to create share link. Please check backend is running."
      );
      alert(
        "Failed to create share link. Please check backend is running."
      );
    }
  };

  if (!docId) {
    return <div style={{ padding: 24 }}>No document id in the URL.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <header
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Personal doc</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            {docId}
          </h1>
          {shareUrl && (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Read-only link:{" "}
              <a href={shareUrl} target="_blank" rel="noreferrer">
                {shareUrl}
              </a>
            </div>
          )}
          {shareStatus && (
            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>
              {shareStatus}
            </div>
          )}
        </div>

        <button
          onClick={handleCreateShareLink}
          style={{
            padding: "8px 14px",
            fontSize: 14,
            borderRadius: 999,
            border: "1px solid #4f46e5",
            background: "#4f46e5",
            color: "white",
            cursor: "pointer",
          }}
        >
          Share read-only link
        </button>
      </header>

      {/* Main layout: editor + sidebar */}
      <main
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          background: "#f9fafb",
        }}
      >
        <section
          style={{
            flex: 1,
            minWidth: 0,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              height: "100%",
              boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
              overflow: "hidden",
            }}
          >
            <Editor
              docId={docId}
              isShared={false}
              readOnly={false}
              content={content}
              setContent={setContent}
            />
          </div>
        </section>

        <aside
          style={{
            width: 320,
            borderLeft: "1px solid #e5e7eb",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "#f3f4f6",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 10,
              padding: 10,
              boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 6px 0",
              }}
            >
              Version timeline
            </h3>
            <TimelineSlider docId={docId} />
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 10,
              padding: 10,
              boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
              flex: 1,
              minHeight: 0,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 6px 0",
              }}
            >
              Contribution heatmap
            </h3>
            <HeatmapPanel docId={docId} />
          </div>
        </aside>
      </main>
    </div>
  );
};

export default PersonalEditorPage;
