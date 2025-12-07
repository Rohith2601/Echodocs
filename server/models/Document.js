// server/models/Document.js
const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // allow custom string IDs
    content: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.models.Document || mongoose.model("Document", DocumentSchema);
