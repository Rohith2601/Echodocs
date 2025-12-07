// src/pages/DocumentPage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Editor from "../components/Editor";

type DocParams = {
  id: string;
};

const DocumentPage: React.FC = () => {
  const { id } = useParams<DocParams>();
  const [content, setContent] = useState<string>("Loading...");

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:4000/documents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content ?? "");
      })
      .catch((err) => {
        console.error("Failed to fetch document", err);
        setContent("Error loading document");
      });
  }, [id]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Document ID: {id}</h2>
      <Editor content={content} setContent={setContent} />
    </div>
  );
};

export default DocumentPage;
