// src/pages/PersonalEditorPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Editor from "../components/Editor";
import DocHealth from "../components/DocHealth";
import ChecklistView from "../components/ChecklistView";
import FocusMode from "../components/FocusMode";
import TimelineSlider from "../components/TimelineSlider";
import HeatmapPanel from "../components/HeatmapPanel";
import ReplayPlayer from "../components/ReplayPlayer";
import axiosClient from "../api/axiosClient";

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

export default function PersonalEditorPage() {
  // accept both :id and :docId, to be safe
  const params = useParams<{ id?: string; docId?: string }>();
  const routeId = params.id || params.docId;
  const navigate = useNavigate();

  const generatedId =
    routeId ||
    `personal-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(
      36
    )}`;

  const [content, setContent] = useState<string>("");
  const [version, setVersion] = useState<number>(0); // kept for compatibility
  const [sharedViewId, setSharedViewId] = useState<string | null>(null);

  // If URL has no id, redirect /personal -> /personal/<generatedId>
  useEffect(() => {
    if (!routeId) {
      navigate(`/personal/${generatedId}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from localStorage, register in index
  useEffect(() => {
    const key = `personal:${generatedId}`;
    const stored = window.localStorage.getItem(key);
    if (stored != null) {
      setContent(stored);
    }
    upsertDocMeta({
      id: generatedId,
      type: "personal",
      title: "Personal doc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [generatedId]);

  const handleSave = () => {
    window.localStorage.setItem(`personal:${generatedId}`, content);
    upsertDocMeta({
      id: generatedId,
      type: "personal",
      title: "Personal doc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    alert("Saved locally.");
  };

  // 🔗 Create live read-only view via backend API (uses axiosClient, NOT localhost)
  const handleCreateShareLink = async () => {
    try {
      const res = await axiosClient.post("/api/share-personal", {
        docId: generatedId,
        content,
      });

      const idFromServer = res.data?.id as string | undefined;
      if (!idFromServer) throw new Error("No id from server");

      setSharedViewId(idFromServer);

      const link = `${window.location.origin}/view/${idFromServer}`;
      try {
        await navigator.clipboard.writeText(link);
        alert("Read-only live view link copied:\n\n" + link);
      } catch {
        window.prompt("Copy this link:", link);
      }

      upsertDocMeta({
        id: generatedId,
        type: "personal",
        title: "Personal doc",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasLiveView: true,
      });
    } catch (err) {
      console.error("share error", err);
      alert(
        "Failed to create share link. Please check that the backend URL is correct."
      );
    }
  };

  // ♻️ Keep shared view updated (live-ish) using backend API
  useEffect(() => {
    if (!sharedViewId) return;
    const handle = setTimeout(() => {
      axiosClient
        .post("/api/share-personal/update", {
          id: sharedViewId,
          content,
        })
        .catch((err) => console.error("update share error", err));
    }, 600);
    return () => clearTimeout(handle);
  }, [content, sharedViewId]);

  // 🔁 Convert personal → shared collaborative doc
  const handleConvertToShared = async () => {
    try {
      const res = await axiosClient.post(
        "/api/create-shared-from-personal",
        { content }
      );
      const sharedId = res.data?.id as string | undefined;
      if (!sharedId) throw new Error("no sharedId");

      upsertDocMeta({
        id: sharedId,
        type: "shared",
        title: "Shared from personal",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      navigate(`/shared/${sharedId}`);
    } catch (err) {
      console.error("convert error", err);
      alert(
        "Failed to convert to shared doc. Check backend is reachable from the frontend."
      );
    }
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
            {generatedId} <span className="small">— Personal</span>
          </h2>
          <div className="small">
            Private editor stored locally. Share a live view or convert to a
            full shared doc.
          </div>
          {sharedViewId && (
            <div className="small" style={{ marginTop: 4 }}>
              Live view: <code>/view/{sharedViewId}</code>
            </div>
          )}
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-card card">
          <div className="toolbar">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="small">
                Mode: <strong>Personal</strong>
              </div>
              <button className="btn" onClick={handleCreateShareLink}>
                Live view link (read-only)
              </button>
              <button className="btn" onClick={handleConvertToShared}>
                Convert to shared doc
              </button>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>

          <div className="quill-container">
            <Editor
              mode="personal"
              docId={generatedId}
              content={content}
              setContent={setContent}
            />
          </div>
        </div>

        <aside className="side-panel">
          <div className="panel">
            <h6 className="h6">Document Health</h6>
            <DocHealth content={content} />
          </div>
          <div className="panel">
            <h6 className="h6">Checklists</h6>
            <ChecklistView content={content} setContent={setContent} />
          </div>
          <div className="panel">
            <h6 className="h6">Focus Mode</h6>
            <FocusMode trackedText={content} />
          </div>
          <div className="panel">
            <h6 className="h6">History (Time Machine)</h6>
            <TimelineSlider docId={generatedId} previewSetter={() => {}} />
          </div>
          <div className="panel">
            <h6 className="h6">Contribution Heatmap</h6>
            <HeatmapPanel docId={generatedId} />
          </div>
          <div className="panel">
            <h6 className="h6">Replay</h6>
            <ReplayPlayer docId={generatedId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
