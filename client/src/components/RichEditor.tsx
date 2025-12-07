// client/src/components/RichEditor.tsx
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./rich-editor.css";

interface RichEditorProps {
  docId: string;
}

type PresenceStatus = "connected" | "disconnected" | "saving";

const FONT_FAMILIES = [
  {
    label: "System",
    value:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  },
  { label: "Serif", value: "'Georgia', serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
  { label: "Mono", value: "'Courier New', Courier, monospace" },
  { label: "Inter", value: "'Inter', system-ui, -apple-system" },
];

const RichEditor: React.FC<RichEditorProps> = ({ docId }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const saveTimeout = useRef<number | null>(null);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].value);
  const [fontSize, setFontSize] = useState(16);
  const [status, setStatus] = useState<PresenceStatus>("disconnected");
  const [connected, setConnected] = useState(false);

  // Apply typography to editable root
  useEffect(() => {
    if (ref.current) {
      ref.current.style.fontFamily = fontFamily;
      ref.current.style.fontSize = `${fontSize}px`;
    }
  }, [fontFamily, fontSize]);

  // connect socket and load initial content
  useEffect(() => {
    const s = io("http://localhost:4000");
    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      setStatus("connected");
    });
    s.on("disconnect", () => {
      setConnected(false);
      setStatus("disconnected");
    });

    s.emit("join-document", { documentId: docId }, (initial: string) => {
      if (ref.current) {
        ref.current.innerHTML = initial || "";
      }
    });

    // listen for rich updates from other clients
    s.on("rich-update", (html: string) => {
      if (ref.current) {
        const sel = window.getSelection();
        const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

        ref.current.innerHTML = html || "";

        if (range && sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(range);
          } catch {
            // ignore
          }
        }
      }
    });

    return () => {
      s.disconnect();
    };
  }, [docId]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleLocalChange();
  };

  const handleLocalChange = () => {
    if (!socketRef.current || !ref.current) return;
    const html = ref.current.innerHTML;
    socketRef.current.emit("rich-broadcast", html);
    scheduleSave(html);
  };

  const onInput = () => handleLocalChange();

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleLocalChange();
  };

  const scheduleSave = (html: string) => {
    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }
    setStatus("saving");
    saveTimeout.current = window.setTimeout(() => {
      if (!socketRef.current) return;
      socketRef.current.emit(
        "save-rich",
        { documentId: docId, html },
        () => {
          setStatus(connected ? "connected" : "disconnected");
        }
      );
    }, 1200);
  };

  const statusText =
    status === "saving"
      ? "Saving…"
      : connected
      ? "Connected"
      : "Disconnected";

  const statusColor =
    status === "saving"
      ? "#f59e0b"
      : connected
      ? "#10b981"
      : "#ef4444";

  return (
    <div className="rich-editor-root">
      <div className="toolbar">
        <div className="toolbar-row">
          <select
            className="tool-select"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            className="tool-select"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          >
            <option value={14}>14</option>
            <option value={16}>16</option>
            <option value={18}>18</option>
            <option value={20}>20</option>
            <option value={24}>24</option>
          </select>

          <button className="tool" onClick={() => exec("bold")}>
            <b>B</b>
          </button>
          <button className="tool" onClick={() => exec("italic")}>
            <i>I</i>
          </button>
          <button className="tool" onClick={() => exec("underline")}>
            <u>U</u>
          </button>

          <button className="tool" onClick={() => exec("justifyLeft")}>
            ⬅
          </button>
          <button className="tool" onClick={() => exec("justifyCenter")}>
            ⬌
          </button>
          <button className="tool" onClick={() => exec("justifyRight")}>
            ➡
          </button>

          <input
            type="color"
            className="tool-color"
            onChange={(e) => exec("foreColor", e.target.value)}
            title="Text color"
          />

          <button className="tool" onClick={() => exec("insertUnorderedList")}>
            • List
          </button>
          <button className="tool" onClick={() => exec("insertOrderedList")}>
            1. List
          </button>

          <div className="toolbar-status">
            <span
              className="status-dot"
              style={{ background: statusColor }}
            />
            <span className="status-text">{statusText}</span>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="rich-editable"
        contentEditable
        onInput={onInput}
        onPaste={onPaste}
        suppressContentEditableWarning
        spellCheck
        data-placeholder="Start writing… (supports bold, fonts, colors, alignment)"
      />
    </div>
  );
};

export default RichEditor;
