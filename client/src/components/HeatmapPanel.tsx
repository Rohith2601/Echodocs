// src/components/HeatmapPanel.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND = "http://localhost:5000";

type Contribution = { socketId: string; inserted: number };

export default function HeatmapPanel({ docId }: { docId: string }) {
  const [data, setData] = useState<Contribution[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(
          `${BACKEND}/api/doc/${encodeURIComponent(docId)}/contributions`
        );
        const arr: Contribution[] = res.data?.contributions || [];
        setData(arr);
      } catch (err) {
        console.error("heatmap error", err);
      }
    }
    if (docId) load();
  }, [docId]);

  if (!data.length) {
    return (
      <div className="small" style={{ color: "#64748b" }}>
        No contributions yet. Start typing in the shared editor.
      </div>
    );
  }

  const total =
    data.reduce((sum, d) => sum + (Number(d.inserted) || 0), 0) || 1;

  return (
    <div>
      <div className="small" style={{ marginBottom: 6 }}>
        Approximate contributions by user (per socket).
      </div>
      {data.map((d) => {
        const pct = Math.round(((Number(d.inserted) || 0) / total) * 100);
        return (
          <div key={d.socketId} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700 }}>{d.socketId.slice(0, 6)}</div>
              <div className="small">{pct}%</div>
            </div>
            <div
              style={{
                height: 10,
                background: "#eef2ff",
                borderRadius: 6,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: "#4f46e5",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
