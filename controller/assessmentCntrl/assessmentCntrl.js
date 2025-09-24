const DocumentFile = require("../../modules/assesmentsModule/assessmentModule");

const API_BASE = process.env.API_BASE || "https://moewr-backend.onrender.com";

// helper: attach fileUrl to a doc (plain object)
function withFileUrl(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    ...d,
    fileUrl: d.path ? `${API_BASE}/${d.path}` : null,
  };
}

// ✅ Create
const createDocument = async (req, res) => {
  try {
    // normalized by middleware; falls back safely
    const category =
      req.normalizedCategory ||
      (req.body.category || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

    const webPath = req.file ? (req.file.webPath || null) : null;

    const doc = await DocumentFile.create({
      title: req.body.title,
      description: req.body.description,
      category,
      filename: req.file?.filename || null,
      path: webPath,                   // ✅ web-relative: uploads/docs/<cat>/<filename>
      mimetype: req.file?.mimetype || null,
      size: req.file?.size || null,
    });

    res.status(201).json({ success: true, data: withFileUrl(doc) });
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Read all
const getDocuments = async (_req, res) => {
  try {
    const docs = await DocumentFile.find().sort({ createdAt: -1 });
    res.json({ success: true, data: docs.map(withFileUrl) });
  } catch (err) {
    console.error("Read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Read single
const getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentFile.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: withFileUrl(doc) });
  } catch (err) {
    console.error("Read single error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update
const updateDocument = async (req, res) => {
  try {
    const update = {
      title: req.body.title,
      description: req.body.description,
    };

    // If category is provided, normalize it exactly like middleware
    if (req.body.category) {
      update.category = (req.normalizedCategory ||
        req.body.category.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_"));
    }

    // If a new file is uploaded, refresh file fields + path
    if (req.file) {
      const cat =
        update.category ||
        req.normalizedCategory ||
        (req.body.category || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

      update.filename = req.file.filename;
      update.mimetype = req.file.mimetype;
      update.size = req.file.size;
      update.path = req.file.webPath || `uploads/docs/${cat}/${req.file.filename}`; // ✅ web path
    }

    // NOTE: If only the category changes and no new file uploaded,
    // we keep the old `path` so links don't break (file not moved on disk).
    const doc = await DocumentFile.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: withFileUrl(doc) });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete
const deleteDocument = async (req, res) => {
  try {
    const doc = await DocumentFile.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
