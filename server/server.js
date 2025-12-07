// server/server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT"],
  })
);
app.use(express.json({ limit: "2mb" }));

const server = http.createServer(app);

// In-memory data
const documents = {};
const presence = {};

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/analyze-document";

function newId(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function pickColor(seed) {
  const palette = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#7c3aed",
  ];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(s) % palette.length];
}

// ===== Socket.IO real-time =====
io.on("connection", (socket) => {
  console.log("[io] connect", socket.id);

  socket.on("get-document", ({ docId }) => {
    if (!docId) return;

    if (!documents[docId]) {
      documents[docId] = {
        content: "",
        readOnly: false,
        version: 0,
        history: [
          {
            version: 0,
            content: "",
            createdAt: new Date().toISOString(),
          },
        ],
        ops: [],
        contributions: {},
      };
    }

    socket.join(docId);

    socket.emit("load-document", {
      content: documents[docId].content,
      readOnly: !!documents[docId].readOnly,
      version: documents[docId].version,
    });

    presence[docId] = presence[docId] || {};
    socket.emit("presence", Object.values(presence[docId]));
  });

  socket.on("user-join", ({ docId, name }) => {
    if (!docId) return;
    presence[docId] = presence[docId] || {};
    presence[docId][socket.id] = {
      socketId: socket.id,
      name: name || "Anonymous",
      color: pickColor(socket.id),
    };
    io.in(docId).emit("presence", Object.values(presence[docId]));
  });

  socket.on("send-changes", ({ docId, delta }) => {
    if (!docId || delta == null) return;
    const doc = documents[docId];
    if (doc && doc.readOnly) return;

    socket.to(docId).emit("receive-changes", delta);

    if (!documents[docId]) {
      documents[docId] = {
        content: "",
        readOnly: false,
        version: 0,
        history: [],
        ops: [],
        contributions: {},
      };
    }
    documents[docId].ops.push({
      socketId: socket.id,
      delta,
      timestamp: new Date().toISOString(),
    });

    if (delta && Array.isArray(delta.ops)) {
      let inserted = 0;
      for (const op of delta.ops) {
        if (op.insert && typeof op.insert === "string") {
          inserted += op.insert.length;
        }
      }
      if (inserted > 0) {
        const contrib = documents[docId].contributions;
        contrib[socket.id] = (contrib[socket.id] || 0) + inserted;
      }
    }
  });

  socket.on("cursor-position", ({ docId, range }) => {
    if (!docId) return;
    const user = presence[docId] && presence[docId][socket.id];
    io.in(docId).except(socket.id).emit("cursor-update", {
      socketId: socket.id,
      range,
      name: user ? user.name : "Anon",
      color: user ? user.color : "#3b82f6",
    });
  });

  socket.on("save-document", ({ docId, content }) => {
    if (!docId) return;
    documents[docId] =
      documents[docId] || {
        content: "",
        readOnly: false,
        version: 0,
        history: [],
        ops: [],
        contributions: {},
      };

    documents[docId].content = content || "";
    const nextVersion = (documents[docId].version || 0) + 1;
    documents[docId].version = nextVersion;
    documents[docId].history = documents[docId].history || [];
    documents[docId].history.push({
      version: nextVersion,
      content: documents[docId].content,
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("disconnecting", () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (presence[room] && presence[room][socket.id]) {
        delete presence[room][socket.id];
        io.in(room).emit("presence", Object.values(presence[room]));
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("[io] disconnect", socket.id);
  });
});

// ===== REST: docs, history, ops, contributions =====

app.post("/api/share-personal", (req, res) => {
  try {
    const { docId, content } = req.body;
    const viewId = newId("view-");

    documents[viewId] = {
      content: content || "",
      readOnly: true,
      version: 0,
      history: [
        {
          version: 0,
          content: content || "",
          createdAt: new Date().toISOString(),
        },
      ],
      ops: [],
      contributions: {},
    };

    return res.json({ id: viewId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/share-personal/update", (req, res) => {
  try {
    const { id, content } = req.body;
    const doc = documents[id];
    if (!doc || !doc.readOnly) {
      return res.status(404).json({ error: "not_found" });
    }

    doc.content = content || "";
    const nextVersion = (doc.version || 0) + 1;
    doc.version = nextVersion;
    doc.history = doc.history || [];
    doc.history.push({
      version: nextVersion,
      content: doc.content,
      createdAt: new Date().toISOString(),
    });

    return res.json({ ok: true, version: nextVersion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/documents/:id", (req, res) => {
  const id = req.params.id;
  const doc = documents[id];
  if (!doc) return res.status(404).json({ error: "not_found" });

  return res.json({
    id,
    readOnly: !!doc.readOnly,
    version: doc.version || 0,
    content: doc.content || "",
  });
});

app.get("/api/history/:id", (req, res) => {
  const id = req.params.id;
  const doc = documents[id];
  if (!doc) return res.status(404).json({ error: "not_found" });
  return res.json({ history: doc.history || [] });
});

app.get("/api/ops/:id", (req, res) => {
  const id = req.params.id;
  const doc = documents[id];
  if (!doc) return res.status(404).json({ error: "not_found" });
  return res.json({ ops: doc.ops || [] });
});

app.get("/api/doc/:id/contributions", (req, res) => {
  const id = req.params.id;
  const doc = documents[id];
  if (!doc) return res.status(404).json({ error: "not_found" });
  const contributions = doc.contributions || {};
  const arr = Object.entries(contributions).map(([socketId, inserted]) => ({
    socketId,
    inserted,
  }));
  return res.json({ contributions: arr });
});

app.post("/api/create-shared-from-personal", (req, res) => {
  try {
    const { content } = req.body;
    const sharedId = newId("shared-");

    documents[sharedId] = {
      content: content || "",
      readOnly: false,
      version: 0,
      history: [
        {
          version: 0,
          content: content || "",
          createdAt: new Date().toISOString(),
        },
      ],
      ops: [],
      contributions: {},
    };

    return res.json({ id: sharedId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ===== AI routes =====

app.put("/api/documents/:id/content", (req, res) => {
  const id = req.params.id;
  const content = req.body?.content ?? "";

  try {
    if (!documents[id]) {
      documents[id] = {
        content: "",
        readOnly: false,
        version: 0,
        history: [],
        ops: [],
        contributions: {},
      };
    }
    documents[id].content = content;
    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/documents/:id/content error", err);
    return res.status(500).json({ error: "save_failed" });
  }
});

app.post("/api/documents/:id/analyze", async (req, res) => {
  const id = req.params.id;
  try {
    const textFromBody = req.body?.text;
    const text =
      typeof textFromBody === "string"
        ? textFromBody
        : documents[id]?.content || "";

    const payload = {
      documentId: id,
      text,
      sections: [],
    };

    const aiRes = await axios.post(AI_SERVICE_URL, payload, {
      timeout: 120000,
    });
    const zones = aiRes.data?.zones ?? [];

    const length = (text || "").length;
    const safeZones = zones.map((z) => {
      const start = Math.max(
        0,
        Math.min(Number(z.startOffset) || 0, length)
      );
      const end = Math.max(
        start,
        Math.min(Number(z.endOffset) || start, length)
      );
      return {
        id: z.id || `${z.type || "zone"}-${start}-${end}`,
        type: z.type || "unknown",
        startOffset: start,
        endOffset: end,
        message: z.message || "",
        confidence:
          typeof z.confidence === "number" ? z.confidence : 0.0,
        relatedOffsets: Array.isArray(z.relatedOffsets)
          ? z.relatedOffsets
          : [],
      };
    });

    return res.json({ zones: safeZones });
  } catch (err) {
    console.error(
      "POST /api/documents/:id/analyze error",
      err?.message || err
    );
    return res.status(500).json({
      error: "analysis_failed",
      details: err?.message || "unknown",
    });
  }
});

// Simple health check & root for Render and manual testing
app.get("/", (req, res) => {
  res.send("Echodocs backend is running ✅");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// ===== Start server on 5000 =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
