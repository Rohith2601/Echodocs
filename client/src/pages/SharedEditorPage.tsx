// src/pages/SharedEditorPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Editor from "../components/Editor";
import DocHealth from "../components/DocHealth";
import HeatmapPanel from "../components/HeatmapPanel";
import TimelineSlider from "../components/TimelineSlider";
import ReplayPlayer from "../components/ReplayPlayer";
import FocusMode from "../components/FocusMode";
import ChecklistView from "../components/ChecklistView";
import { io } from "socket.io-client";

const SERVER = "http://localhost:5000";

type DocKind = "personal" | "shared";

type DocMeta = {
  id: string;
  type: DocKind;
  title: string;
  createdAt: string;
  updatedAt: string;
  hasLiveView?: boolean;
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

function upsertDocMeta(partial: DocMeta) {
  const all = readDocIndex();
  const idx = all.findIndex(
    (d) => d.id === partial.id && d.type === partial.type
  );
  const now = new Date().toISOString();
  if (idx === -1) {
    all.push({
      ...partial,
      createdAt: partial.createdAt || now,
      updatedAt: now,
    });
  } else {
    all[idx] = {
      ...all[idx],
      ...partial,
      updatedAt: now,
    };
  }
  window.localStorage.setItem(DOC_INDEX_KEY, JSON.stringify(all));
}

export default function SharedEditorPage() {
  const params = useParams();
  const id = params.id as string | undefined;
  const navigate = useNavigate();

  const generatedId =
    id ||
    `shared-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(
      36
    )}`;

  const [content, setContent] = useState("");
  const [userName, setUserName] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [presence, setPresence] = useState<
    { socketId: string; name: string; color: string }[]
  >([]);
  const [readOnlyNote, setReadOnlyNote] = useState<string>("");

  // redirect /shared -> /shared/<id>
  useEffect(() => {
    if (!id) {
      navigate(`/shared/${generatedId}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // register shared doc in index
  useEffect(() => {
    upsertDocMeta({
      id: generatedId,
      type: "shared",
      title: "Shared doc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [generatedId]);

  // presence listener
  useEffect(() => {
    if (!joined) return;
    const s = io(SERVER);
    s.emit("get-document", { docId: generatedId });
    s.on("load-document", ({ content: serverContent, readOnly }: any) => {
      setContent(serverContent || "");
      if (readOnly) setReadOnlyNote("This document is read-only (view-only).");
    });
    s.on("presence", (users: any[]) => {
      setPresence(users || []);
    });
    return () => {
      s.disconnect();
    };
  }, [joined, generatedId]);

  const handleJoin = () => {
    if (!userName) {
      alert("Please enter your display name for this session");
      return;
    }
    setJoined(true);
  };

  // Convert shared → personal (copy)
  const handleConvertToPersonal = async () => {
    try {
      // fetch latest content from backend
      const res = await fetch(
        `${SERVER}/api/documents/${encodeURIComponent(generatedId)}`
      );
      if (!res.ok) throw new Error("Server " + res.status);
      const data = await res.json();
      const sharedContent = data.content || "";

      const newId =
        "personal-" +
        Math.random().toString(36).slice(2, 9) +
        "-" +
        Date.now().toString(36);

      // store content locally
      window.localStorage.setItem(`personal:${newId}`, sharedContent);

      // register in index
      upsertDocMeta({
        id: newId,
        type: "personal",
        title: "Personal copy of shared",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      navigate(`/personal/${newId}`);
    } catch (err) {
      console.error("convert shared->personal error", err);
      alert(
        "Failed to convert to personal doc. Check server and try again."
      );
    }
  };

  const handleCopyLink = () => {
    const link = window.location.origin + `/shared/${generatedId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => alert("Share link copied: " + link))
      .catch(() => window.prompt("Copy this link:", link));
  };

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
            ← Dashboard
          </Link>
          <h2 style={{ marginTop: 6 }}>
            {generatedId} <span className="small">— Shared</span>
          </h2>
          <div className="small">
            Open the same URL from other browsers to collaborate in real-time.
          </div>
          <div
            className="small"
            style={{ marginTop: 6, color: readOnlyNote ? "#ef4444" : undefined }}
          >
            {readOnlyNote}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!joined ? (
            <>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="tool-input"
              />
              <button className="btn btn-primary" onClick={handleJoin}>
                Join
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {presence.map((p) => (
                  <div
                    key={p.socketId}
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        background: p.color,
                        borderRadius: 999,
                      }}
                    />
                    <div className="small">{p.name}</div>
                  </div>
                ))}
              </div>
              <button className="btn" onClick={handleCopyLink}>
                Copy share link
              </button>
            </>
          )}

          <button className="btn" onClick={handleConvertToPersonal}>
            Convert to personal copy
          </button>
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-card card">
          <div className="toolbar">
            <div className="small">
              Mode: <strong>Shared</strong>
            </div>
            <div style={{ flex: 1 }} />
            <div className="small">Users: {presence.length}</div>
          </div>

          <div className="quill-container">
            <Editor
              mode={joined ? "shared" : "personal"}
              docId={generatedId}
              content={content}
              setContent={setContent}
              userName={userName || "Anonymous"}
            />
          </div>
        </div>

        <aside className="side-panel">
          <div className="panel">
            <h6 className="h6">Document Health</h6>
            <DocHealth content={content} />
          </div>

          <div className="panel">
            <h6 className="h6">Contributions</h6>
            <HeatmapPanel docId={generatedId} />
          </div>

          <div className="panel">
            <h6 className="h6">Time Machine</h6>
            <TimelineSlider docId={generatedId} previewSetter={() => {}} />
          </div>

          <div className="panel">
            <h6 className="h6">Replay</h6>
            <ReplayPlayer docId={generatedId} />
          </div>

          <div className="panel">
            <h6 className="h6">Checklists</h6>
            <ChecklistView content={content} setContent={setContent} />
          </div>

          <div className="panel">
            <h6 className="h6">Focus Mode</h6>
            <FocusMode trackedText={content} />
          </div>
        </aside>
      </div>
    </div>
  );
}
