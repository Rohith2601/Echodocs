// src/components/EditorWithAI.tsx
import { useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axiosClient from "../api/axiosClient";

type Zone = {
  id: string;
  type: string;
  startOffset: number;
  endOffset: number;
  message: string;
  confidence: number;
  relatedOffsets?: { start: number; end: number }[];
};

function colorForType(t: string) {
  switch (t) {
    case "todo":
      return "#fef3c7"; // yellow-ish
    case "repetition":
      return "#fee2e2"; // red-ish
    case "contradiction":
      return "#fce7f3"; // pink-ish
    default:
      return "#e0f2fe"; // blue-ish
  }
}

export default function EditorWithAI({ docId }: { docId: string }) {
  const quillRef = useRef<ReactQuill | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastLength, setLastLength] = useState(0);

  const clearHighlights = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    try {
      quill.formatText(0, quill.getLength(), "background", false);
    } catch {
      // ignore
    }
  };

  const applyZones = (zlist: Zone[]) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    clearHighlights();
    const plain = quill.getText();
    const maxLen = plain.length;

    zlist.forEach((z) => {
      const start = Math.max(0, Math.min(z.startOffset, maxLen));
      const end = Math.max(0, Math.min(z.endOffset, maxLen));
      const len = Math.max(0, end - start);
      if (!len) return;
      const color = colorForType(z.type);
      try {
        quill.formatText(start, len, "background", color);
      } catch (err) {
        console.warn("formatText failed", err);
      }
    });
  };

  const analyze = async () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) {
      alert("Editor not ready yet");
      return;
    }
    const text = quill.getText(); // plain text
    setLastLength(text.length);
    setLoading(true);
    setZones([]);

    try {
      // 1) save content (keeps backend + AI text in sync)
      await axiosClient.put(
        `/api/documents/${encodeURIComponent(docId)}/content`,
        { content: text }
      );

      // 2) call analyze endpoint
      const res = await axiosClient.post(
        `/api/documents/${encodeURIComponent(docId)}/analyze`,
        { text }
      );

      const returnedZones: Zone[] = res.data?.zones || [];
      setZones(returnedZones);
      applyZones(returnedZones);
    } catch (err) {
      console.error("Analyze error", err);
      alert(
        "Analysis failed. Make sure the backend and ai_service are reachable from this frontend."
      );
    } finally {
      setLoading(false);
    }
  };

  const jumpToZone = (z: Zone) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const start = Math.max(0, z.startOffset);
    const len = Math.max(0, z.endOffset - z.startOffset);
    try {
      quill.setSelection(start, len);
      const leaf = quill.getLeaf(start)[0];
      if (leaf && (leaf as any).domNode) {
        (leaf as any).domNode.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    } catch (err) {
      console.warn("jumpTo error", err);
    }
  };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <button
            className="btn btn-primary"
            onClick={analyze}
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Analyze Document"}
          </button>
          <span className="small" style={{ color: "#64748b" }}>
            current length: {lastLength}
          </span>
        </div>
        <div style={{ height: "60vh" }}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            style={{ height: "100%" }}
            placeholder="Type some text, add TODOs, repeat sentences, then click Analyze…"
          />
        </div>
      </div>

      <aside style={{ width: 320 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>AI Findings</div>
        {zones.length === 0 ? (
          <div className="small" style={{ color: "#64748b" }}>
            No issues found yet. Click <strong>Analyze Document</strong> to run
            detectors.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {zones.map((z) => (
              <div
                key={z.id}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1px solid rgba(15,23,42,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{z.type}</span>
                  <span className="small">
                    {Math.round((z.confidence || 0) * 100)}%
                  </span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  {z.message}
                </div>
                <button
                  className="btn"
                  style={{ fontSize: 12, padding: "4px 8px" }}
                  onClick={() => jumpToZone(z)}
                >
                  Jump to text
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
