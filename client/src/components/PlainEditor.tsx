// src/components/PlainEditor.tsx
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface PlainEditorProps {
  docId: string;
  content: string;
  setContent: (value: string) => void;
  version: number;
  setVersion: (v: number) => void;
}

// Simple clientId (for debug logs, not used for auth)
const CLIENT_ID = Math.random().toString(36).slice(2);

type PresenceUser = { userId: string; name: string };

const PlainEditor: React.FC<PlainEditorProps> = ({
  docId,
  content,
  setContent,
  version,
  setVersion,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const lastTextRef = useRef<string>("");
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, number>>(
    {}
  );

  // 1️⃣ Connect and load document
  useEffect(() => {
    const s = io("http://localhost:4000");
    setSocket(s);

    console.log("Connecting socket for docId:", docId);

    s.emit(
      "get-document",
      docId,
      (data: { content: string; version: number }) => {
        console.log(
          "Loaded from server:",
          data.content.slice(0, 50),
          "v=",
          data.version
        );
        setContent(data.content);
        setVersion(data.version);
        lastTextRef.current = data.content;
      }
    );

    return () => {
      console.log("Disconnecting socket for docId:", docId);
      s.disconnect();
    };
  }, [docId, setContent, setVersion]);

  // 2️⃣ Listen for operations, presence, and cursor updates
  useEffect(() => {
    if (!socket) return;

    const handleApplyOp = (payload: { op: any; version: number }) => {
      const { op, version: newVersion } = payload;
      console.log("apply-operation from server:", op, "-> v=", newVersion);

      let text = lastTextRef.current;

      if (op.type === "insert") {
        const { index, text: inserted } = op;
        text = text.slice(0, index) + inserted + text.slice(index);
      } else if (op.type === "delete") {
        const { index, length } = op;
        text = text.slice(0, index) + text.slice(index + length);
      } else {
        console.warn("Unsupported op type:", op.type);
      }

      lastTextRef.current = text;
      setContent(text);
      setVersion(newVersion);
    };

    const handlePresence = (list: PresenceUser[]) => {
      console.log("Presence:", list);
      setPresence(list);
    };

    const handleCursorUpdate = (payload: { userId: string; index: number }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: payload.index,
      }));
    };

    socket.on("apply-operation", handleApplyOp);
    socket.on("presence", handlePresence);
    socket.on("cursor-update", handleCursorUpdate);

    return () => {
      socket.off("apply-operation", handleApplyOp);
      socket.off("presence", handlePresence);
      socket.off("cursor-update", handleCursorUpdate);
    };
  }, [socket, setContent, setVersion]);

  // 🔧 Compute simple insert/delete operations

  function computeInsertOp(oldText: string, newText: string) {
    if (newText.length <= oldText.length) return null;

    let start = 0;
    while (
      start < oldText.length &&
      start < newText.length &&
      oldText[start] === newText[start]
    ) {
      start++;
    }

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;

    while (
      oldEnd >= start &&
      newEnd >= start &&
      oldText[oldEnd] === newText[newEnd]
    ) {
      oldEnd--;
      newEnd--;
    }

    const inserted = newText.slice(start, newEnd + 1);

    return {
      type: "insert" as const,
      index: start,
      text: inserted,
      baseVersion: version,
      clientId: CLIENT_ID,
    };
  }

  function computeDeleteOp(oldText: string, newText: string) {
    if (newText.length >= oldText.length) return null;

    let start = 0;
    while (
      start < oldText.length &&
      start < newText.length &&
      oldText[start] === newText[start]
    ) {
      start++;
    }

    let oldEnd = oldText.length - 1;
    let newEnd = newText.length - 1;

    while (
      oldEnd >= start &&
      newEnd >= start &&
      oldText[oldEnd] === newText[newEnd]
    ) {
      oldEnd--;
      newEnd--;
    }

    const length = oldEnd - start + 1;

    return {
      type: "delete" as const,
      index: start,
      length,
      baseVersion: version,
      clientId: CLIENT_ID,
    };
  }

  const sendCursor = (index: number) => {
    if (!socket) return;
    socket.emit("cursor-update", index);
  };

  // 3️⃣ Local change → compute op + send
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const oldText = lastTextRef.current;

    // Update local text
    lastTextRef.current = newText;
    setContent(newText);

    // Cursor position
    sendCursor(e.target.selectionStart);

    if (!socket) return;

    let op: any = null;

    if (newText.length > oldText.length) {
      op = computeInsertOp(oldText, newText);
    } else if (newText.length < oldText.length) {
      op = computeDeleteOp(oldText, newText);
    } else {
      console.log("Complex change (same length), skipping op.");
      return;
    }

    if (!op) {
      console.log("Could not compute simple insert/delete op, skipping.");
      return;
    }

    console.log("Sending operation:", op);
    socket.emit("send-operation", op, (ack: { version: number }) => {
      console.log("Server ack, new version:", ack.version);
      setVersion(ack.version);
    });
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    sendCursor(target.selectionStart);
  };

  return (
    <div className="editor-wrapper">
      <div className="editor-card">
        <textarea
          className="editor-textarea"
          value={content}
          onChange={handleChange}
          onSelect={handleSelect}
          placeholder="Start typing here… Open this doc in another tab to see real-time collaboration."
        />
        <div className="editor-footer">
          <span>Version {version}</span>
          <span>{content.length} characters</span>
        </div>
      </div>

      <div className="presence-panel">
        <h3>Live collaborators</h3>
        {presence.length === 0 ? (
          <p className="presence-empty">Only you are here right now.</p>
        ) : (
          <ul className="presence-list">
            {presence.map((u) => (
              <li key={u.userId} className="presence-item">
                <div className="presence-avatar">
                  {u.name
                    .split("-")
                    .pop()
                    ?.slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="presence-info">
                  <span className="presence-name">{u.name}</span>
                  {remoteCursors[u.userId] !== undefined && (
                    <span className="presence-cursor">
                      cursor at {remoteCursors[u.userId]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="presence-hint">
          Tip: open this same doc in another tab to see presence update.
        </p>
      </div>
    </div>
  );
};

export default PlainEditor;
