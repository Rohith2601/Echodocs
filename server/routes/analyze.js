// server/routes/analyze.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

// Attempt to load a Mongoose Document model if present.
// If not present, fall back to an in-memory store to avoid crashing.
let Document;
let usingMongoose = false;
try {
  Document = require("../models/Document");
  usingMongoose = true;
  console.log("[analyze.js] Using Document model (mongoose).");
} catch (e) {
  console.warn("[analyze.js] models/Document not found — using in-memory fallback.");
  const memory = {};
  Document = {
    async findById(id) {
      if (!memory[id]) return null;
      return { _id: id, content: memory[id] };
    },
    async findByIdAndUpdate(id, payload, opts) {
      memory[id] = payload.content;
      return { _id: id, content: memory[id] };
    },
    async create(payload) {
      memory[payload._id] = payload.content || "";
      return { _id: payload._id, content: memory[payload._id] };
    },
  };
}

// Configure AI service URL (adjust via env if needed)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/analyze-document";

/**
 * PUT /:id/content
 * Body: { content: string }
 * Saves the plain text content for the document on the server side
 * (useful to keep server copy in sync with what Quill shows)
 */
router.put("/:id/content", async (req, res) => {
  const id = req.params.id;
  const content = typeof req.body?.content === "string" ? req.body.content : "";

  try {
    // If using mongoose model, update DB.
    if (usingMongoose && Document.findByIdAndUpdate) {
      await Document.findByIdAndUpdate(id, { content }, { upsert: true, new: true });
    } else if (Document && Document.findByIdAndUpdate) {
      // in-memory fallback already implements findByIdAndUpdate
      await Document.findByIdAndUpdate(id, { content }, { upsert: true, new: true });
    } else {
      // safety net
      console.warn("[analyze.js] No persistence available; content stored nowhere persistent.");
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /:id/content error:", err);
    return res.status(500).json({ error: "save_failed", details: err?.message || String(err) });
  }
});

/**
 * POST /:id/analyze
 * Body: { text?: string }
 * If text is supplied it is forwarded to AI service; otherwise server tries to load saved content.
 * Returns: { zones: [...] } where each zone has startOffset/endOffset etc.
 */
router.post("/:id/analyze", async (req, res) => {
  const id = req.params.id;
  try {
    let text = typeof req.body?.text === "string" ? req.body.text : undefined;

    if (text === undefined) {
      // fallback to server copy (DB or memory)
      const doc = await Document.findById(id);
      text = doc ? doc.content || "" : "";
    }

    // Build payload for AI service
    const payload = {
      documentId: id,
      text: text || "",
      sections: req.body?.sections || [],
    };

    // Forward to AI service
    const aiResp = await axios.post(AI_SERVICE_URL, payload, { timeout: 120000 });
    const zones = aiResp.data?.zones ?? [];

    // Clamp and sanitize zones so frontend can't crash on bad offsets
    const length = (text || "").length;
    const safeZones = (Array.isArray(zones) ? zones : []).map((z) => {
      const start = Math.max(0, Math.min(Number(z.startOffset) || 0, length));
      const end = Math.max(start, Math.min(Number(z.endOffset) || start, length));
      return {
        id: z.id || `${z.type || "zone"}-${start}-${end}`,
        type: z.type || "unknown",
        startOffset: start,
        endOffset: end,
        message: z.message || "",
        confidence: typeof z.confidence === "number" ? z.confidence : 0,
        relatedOffsets: Array.isArray(z.relatedOffsets) ? z.relatedOffsets : [],
      };
    });

    return res.json({ zones: safeZones });
  } catch (err) {
    console.error("POST /:id/analyze error:", err?.message || err);
    return res.status(500).json({ error: "analysis_failed", details: err?.message || String(err) });
  }
});

module.exports = router;
