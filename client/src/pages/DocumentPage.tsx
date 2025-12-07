// client/src/pages/DocumentPage.tsx
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Editor from "../components/Editor";

type DocParams = {
  id?: string;
};

const DocumentPage: React.FC = () => {
  const { id } = useParams<DocParams>();
  const [content, setContent] = useState<string>("");
  const [version, setVersion] = useState<number>(0);

  if (!id) {
    return <div style={{ padding: 20 }}>No document id provided</div>;
  }

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Link to="/" style={{ color: "#4f46e5", fontSize: 14 }}>
          ← Home
        </Link>
        <h2 style={{ margin: 0 }}>Document ID: {id}</h2>
      </header>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          padding: 12,
        }}
      >
        <Editor
          docId={id}
          content={content}
          setContent={setContent}
          version={version}
          setVersion={setVersion}
        />
      </div>
    </div>
  );
};

export default DocumentPage;
