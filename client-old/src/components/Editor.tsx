// src/components/Editor.tsx
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, setContent }) => {
  return (
    <div style={{ background: "white" }}>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        style={{ height: "300px" }}
      />
    </div>
  );
};

export default Editor;
