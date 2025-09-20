const mongoose = require("mongoose");

const documentFileSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    filename: { type: String, required: true },   // actual saved filename
    path: { type: String, required: true },       // file path or URL
    mimetype: { type: String, trim: true },       // "application/pdf", "application/vnd.ms-excel"
    size: { type: Number },                       // file size in bytes
    category: { type: String, trim: true },       // e.g., "tenders", "reports"
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentFile", documentFileSchema);
