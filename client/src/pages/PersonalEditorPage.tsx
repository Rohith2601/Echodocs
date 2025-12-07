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


const BACKEND_URL = "http://localhost:5000";
const FRONTEND_URL = "http://localhost:3000";

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
  const params = useParams();
  const id = params.id as string | undefined;
  const navigate = useNavigate();

  const generatedId =
    id ||
    `personal-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(
      36
    )}`;

  const [content, setContent] = useState<string>("");
  const [version, setVersion] = useState<number>(0);
  const [sharedViewId, setSharedViewId] = useState<string | null>(null);

  // Redirect /personal -> /personal/<id>
  useEffect(() => {
    if (!id) {
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
    // register basic meta
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

  // Create live read-only view (/view/:id) like before
  const handleCreateShareLink = async () => {
  try {
    const res = await axiosClient.post("/api/share-personal", {
      docId,
      content,
    });

    const viewId = res.data.id;
    const url = `${window.location.origin}/view/${viewId}`;
    await navigator.clipboard.writeText(url);
    setShareUrl(url);
    setShareStatus("Link copied!");
  } catch (err) {
    console.error(err);
    setShareStatus(
      "Failed to create share link. Please check backend is running."
    );
  }
};

      // mark hasLiveView in doc index
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
        "Failed to create share link. Make sure `node server.js` is running on port 5000."
      );
    }
  };

  // Keep shared-view updated (live-ish)
  useEffect(() => {
    if (!sharedViewId) return;
    const handle = setTimeout(() => {
      fetch(`${BACKEND_URL}/api/share-personal/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sharedViewId, content }),
      }).catch((err) => console.error("update share error", err));
    }, 600);
    return () => clearTimeout(handle);
  }, [content, sharedViewId]);

  // Convert personal → shared doc (full collaborative)
  const handleConvertToShared = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/create-shared-from-personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Server " + res.status);
      const data = await res.json();
      const sharedId = data.id as string | undefined;
      if (!sharedId) throw new Error("no sharedId");

      // register shared doc in index
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
        "Failed to convert to shared doc. Check server and try again."
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
