// src/components/TimelineSlider.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND = "http://localhost:5000";

type Snapshot = {
  version: number;
  content: string;
  createdAt: string;
};

export default function TimelineSlider({
  docId,
  previewSetter,
}: {
  docId: string;
  previewSetter: (content: string | null) => void;
}) {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${BACKEND}/api/history/${docId}`);
        const list: Snapshot[] = res.data?.history || [];
        setHistory(list);
        setSelectedIndex(list.length - 1);
      } catch (err) {
        console.error("history error", err);
      }
    }
    if (docId) load();
  }, [docId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value || "0", 10);
    setSelectedIndex(idx);
    const snap = history[idx];
    if (snap) {
      previewSetter(snap.content);
    } else {
      previewSetter(null);
    }
  };

  if (!history.length) {
    return <div className="small">No history yet.</div>;
  }

  return (
    <div>
      <div className="small" style={{ marginBottom: 4 }}>
        Version {selectedIndex >= 0 ? history[selectedIndex].version : "-"} of{" "}
        {history[history.length - 1]?.version}
      </div>
      <input
        type="range"
        min={0}
        max={history.length - 1}
        value={selectedIndex < 0 ? history.length - 1 : selectedIndex}
        onChange={handleChange}
        style={{ width: "100%" }}
      />
    </div>
  );
}
