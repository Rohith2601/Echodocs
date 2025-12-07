// server/index.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ===== MongoDB connection =====
const MONGO_URI = "mongodb://127.0.0.1:27017/realtime-docs";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===== Document schema/model =====
const documentSchema = new mongoose.Schema(
  {
    _id: String, // docId
    content: { type: String, default: "" },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);

async function findOrCreateDocument(id) {
  if (!id) return null;
  const existing = await Document.findById(id);
  if (existing) return existing;
  return await Document.create({ _id: id, content: "", version: 0 });
}

// ===== Presence tracking (in memory) =====
// Map<docId, Map<userId, { userId, name }>>
const docPresence = new Map();

function addUserToDocPresence(docId, user) {
  if (!docPresence.has(docId)) {
    docPresence.set(docId, new Map());
  }
  const m = docPresence.get(docId);
  m.set(user.userId, user);
}

function removeUserFromDocPresence(docId, userId) {
  const m = docPresence.get(docId);
  if (!m) return;
  m.delete(userId);
}

function getDocPresence(docId) {
  const m = docPresence.get(docId);
  if (!m) return [];
  return Array.from(m.values());
}

// ===== Optional REST endpoint for debug =====
app.get("/documents/:id", async (req, res) => {
  const { id } = req.params;
  const doc = await findOrCreateDocument(id);
  res.json({ id: doc._id, content: doc.content, version: doc.version });
});

// ===== HTTP + Socket.io server =====
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ===== Socket.io logic =====
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 1️⃣ Client asks for document content + version
  socket.on("get-document", async (documentId, callback) => {
    console.log("get-document for", documentId);
    const doc = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.documentId = documentId;

    // Add this user to presence
    const userId = socket.id; // you can replace with real userId later
    const user = { userId, name: `User-${userId.slice(-4)}` };
    addUserToDocPresence(documentId, user);

    // Broadcast updated presence
    const presenceList = getDocPresence(documentId);
    io.to(documentId).emit("presence", presenceList);

    console.log(
      "Loaded content from DB:",
      (doc.content || "").slice(0, 50),
      "v=",
      doc.version
    );

    // Send content + version back to this client
    callback({ content: doc.content, version: doc.version });
  });
  // Accept full-HTML saves from rich editor, persist to DB and broadcast
socket.on("save-rich", async (html, ack) => {
  const docId = socket.documentId;
  if (!docId) return;
  try {
    // save to mongo
    await Document.findByIdAndUpdate(docId, { content: html, version: (await Document.findById(docId)).version + 1 });
    // broadcast to others
    socket.to(docId).emit("rich-update", html);
    if (ack) ack({ ok: true });
  } catch (err) {
    console.error("save-rich error:", err);
    if (ack) ack({ ok: false, error: String(err) });
  }
});

// Also listen for a lightweight event to immediately broadcast to others (without persisting)
socket.on("rich-broadcast", (html) => {
  const docId = socket.documentId;
  if (!docId) return;
  socket.to(docId).emit("rich-update", html);
});

  // 2️⃣ Client sends a text operation (insert/delete)
  // op = { type: "insert" | "delete", index, text? , length?, baseVersion, clientId }
  socket.on("send-operation", async (op, ack) => {
    const docId = socket.documentId;
    if (!docId) return;
    console.log("Incoming operation for", docId, op);

    const doc = await findOrCreateDocument(docId);
    let { content, version } = doc;

    // ⚠️ Simplified: we ignore baseVersion and just apply to latest content
    // (OT-lite; concurrent edits might be a bit messy but okay for demo)
    if (op.type === "insert") {
      const { index, text } = op;
      content = content.slice(0, index) + text + content.slice(index);
    } else if (op.type === "delete") {
      const { index, length } = op;
      content = content.slice(0, index) + content.slice(index + length);
    } else {
      console.warn("Unsupported op type:", op.type);
    }

    version += 1;
    await Document.findByIdAndUpdate(docId, { content, version });

    console.log(
      "Applied op. New content:",
      content.slice(0, 50),
      "v=",
      version
    );

    // Ack back to sender with new version
    if (ack) ack({ version });

    // Broadcast to others
    socket.to(docId).emit("apply-operation", {
      op,
      version,
    });
  });

  // 3️⃣ Cursor updates
  socket.on("cursor-update", (index) => {
    const docId = socket.documentId;
    if (!docId) return;
    const userId = socket.id;
    socket.to(docId).emit("cursor-update", { userId, index });
  });

  // 4️⃣ Disconnect: update presence
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const docId = socket.documentId;
    const userId = socket.id;
    if (docId) {
      removeUserFromDocPresence(docId, userId);
      const presenceList = getDocPresence(docId);
      io.to(docId).emit("presence", presenceList);
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server + Socket.io listening on http://localhost:${PORT}`);
});
