// src/pages/AiPlaygroundPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import EditorWithAI from "../components/EditorWithAI";

export default function AiPlaygroundPage() {
  // you can use a fixed docId, it just needs to be some string
  const docId = "ai-playground-doc";

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <div>
          <Link to="/" style={{ fontSize: 13 }}>
            ← Dashboard
          </Link>
          <h2 style={{ marginTop: 6 }}>AI Analyzer Playground</h2>
          <div className="small">
            Type text, click <strong>Analyze Document</strong>, and see
            highlights + findings on the right.
          </div>
        </div>
      </div>

      <EditorWithAI docId={docId} />
    </div>
  );
}
