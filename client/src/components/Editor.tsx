// src/components/Editor.tsx
import React, { useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { io, Socket } from "socket.io-client";

// quill + cursors
import QuillBase from "quill";
import QuillCursors from "quill-cursors";

// register cursors module
const Quill: any = (ReactQuill as any).Quill || QuillBase;
if (Quill && Quill.register) {
  Quill.register("modules/cursors", QuillCursors);
}

type Props = {
  mode: "personal" | "shared";
  docId: string;
  content: string;
  setContent: (c: string) => void;
  userName?: string;
};

const SOCKET_URL = "http://localhost:5000";

export default function Editor({
  mode,
  docId,
  content,
  setContent,
  userName,
}: Props) {
  const quillRef = useRef<ReactQuill | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // --- SHARED MODE: socket + collab setup ---
  useEffect(() => {
    if (mode !== "shared") return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      // join room + request current doc
      socket.emit("get-document", { docId });
      socket.emit("user-join", { docId, name: userName || "Anonymous" });
    });

    socket.on(
      "load-document",
      ({ content: serverContent, readOnly }: { content: string; readOnly: boolean }) => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        quill.setContents([]);
        quill.clipboard.dangerouslyPasteHTML(serverContent || "");
        setContent(quill.root.innerHTML || "");
        quill.enable(!readOnly);
      }
    );

    socket.on("receive-changes", (delta: any) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      quill.updateContents(delta);
      setContent(quill.root.innerHTML || "");
    });

    socket.on("cursor-update", ({ socketId, range, name, color }: any) => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      const cursors = quill.getModule("cursors");
      if (!cursors) return;

      if (range) {
        cursors.createCursor(socketId, name || "User", color || "#3b82f6");
        cursors.moveCursor(socketId, range);
      } else {
        cursors.removeCursor(socketId);
      }
    });

    // autosave every 2.5s
    const interval = window.setInterval(() => {
      const quill = quillRef.current?.getEditor();
      if (!quill || !socketRef.current) return;
      const html = quill.root.innerHTML;
      socketRef.current.emit("save-document", { docId, content: html });
    }, 2500);

    return () => {
      window.clearInterval(interval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mode, docId, setContent, userName]);

  // --- send cursor position to others (shared) ---
  useEffect(() => {
    if (mode !== "shared") return;
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handler = (range: any) => {
      if (!socketRef.current) return;
      socketRef.current.emit("cursor-position", { docId, range });
    };

    quill.on("selection-change", handler);
    return () => {
      quill.off("selection-change", handler);
    };
  }, [mode, docId]);

  // --- PERSONAL MODE: initialize from `content` once ---
  useEffect(() => {
    if (mode !== "personal") return;

    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // only inject initial content if editor is empty and we have non-empty content
    const isEmpty = (quill.root.innerHTML || "").trim() === "<p><br></p>";
    if (isEmpty && content) {
      quill.setContents([]);
      quill.clipboard.dangerouslyPasteHTML(content);
    }
  }, [mode, content]);

  // --- handle local changes (BOTH personal + shared) ---
  const handleChange = (value: string, delta: any, source: any) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const html = quill.root.innerHTML || "";
    setContent(html);

    if (mode === "shared" && source === "user" && socketRef.current) {
      socketRef.current.emit("send-changes", { docId, delta });
    }
  };

  return (
    <div style={{ height: "100%" }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        defaultValue={content}
        onChange={handleChange}
        placeholder={
          mode === "shared"
            ? "Collaborate in real time..."
            : "Your personal document..."
        }
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "blockquote"],
            ["clean"],
          ],
          cursors: true,
        }}
        formats={[
          "header",
          "bold",
          "italic",
          "underline",
          "strike",
          "list",
          "bullet",
          "link",
          "blockquote",
        ]}
        style={{ height: "100%" }}
      />
    </div>
  );
}
