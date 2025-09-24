// const DocumentFile = require("../../modules/assesmentsModule/assessmentModule");

// const API_BASE = process.env.API_BASE || "https://moewr-backend.onrender.com";

// // helper: attach fileUrl to a doc (plain object)
// function withFileUrl(doc) {
//   const d = doc.toObject ? doc.toObject() : doc;
//   return {
//     ...d,
//     fileUrl: d.path ? `${API_BASE}/${d.path}` : null,
//   };
// }

// // ✅ Create
// const createDocument = async (req, res) => {
//   try {
//     // normalized by middleware; falls back safely
//     const category =
//       req.normalizedCategory ||
//       (req.body.category || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

//     const webPath = req.file ? (req.file.webPath || null) : null;

//     const doc = await DocumentFile.create({
//       title: req.body.title,
//       description: req.body.description,
//       category,
//       filename: req.file?.filename || null,
//       path: webPath,                   // ✅ web-relative: uploads/docs/<cat>/<filename>
//       mimetype: req.file?.mimetype || null,
//       size: req.file?.size || null,
//     });

//     res.status(201).json({ success: true, data: withFileUrl(doc) });
//   } catch (err) {
//     console.error("Create error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Read all
// const getDocuments = async (_req, res) => {
//   try {
//     const docs = await DocumentFile.find().sort({ createdAt: -1 });
//     res.json({ success: true, data: docs.map(withFileUrl) });
//   } catch (err) {
//     console.error("Read error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Read single
// const getDocumentById = async (req, res) => {
//   try {
//     const doc = await DocumentFile.findById(req.params.id);
//     if (!doc) return res.status(404).json({ success: false, message: "Not found" });
//     res.json({ success: true, data: withFileUrl(doc) });
//   } catch (err) {
//     console.error("Read single error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Update
// const updateDocument = async (req, res) => {
//   try {
//     const update = {
//       title: req.body.title,
//       description: req.body.description,
//     };

//     // If category is provided, normalize it exactly like middleware
//     if (req.body.category) {
//       update.category = (req.normalizedCategory ||
//         req.body.category.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_"));
//     }

//     // If a new file is uploaded, refresh file fields + path
//     if (req.file) {
//       const cat =
//         update.category ||
//         req.normalizedCategory ||
//         (req.body.category || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

//       update.filename = req.file.filename;
//       update.mimetype = req.file.mimetype;
//       update.size = req.file.size;
//       update.path = req.file.webPath || `uploads/docs/${cat}/${req.file.filename}`; // ✅ web path
//     }

//     // NOTE: If only the category changes and no new file uploaded,
//     // we keep the old `path` so links don't break (file not moved on disk).
//     const doc = await DocumentFile.findByIdAndUpdate(req.params.id, update, { new: true });
//     if (!doc) return res.status(404).json({ success: false, message: "Not found" });

//     res.json({ success: true, data: withFileUrl(doc) });
//   } catch (err) {
//     console.error("Update error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ✅ Delete
// const deleteDocument = async (req, res) => {
//   try {
//     const doc = await DocumentFile.findByIdAndDelete(req.params.id);
//     if (!doc) return res.status(404).json({ success: false, message: "Not found" });
//     res.json({ success: true, message: "Document deleted" });
//   } catch (err) {
//     console.error("Delete error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// module.exports = {
//   createDocument,
//   getDocuments,
//   getDocumentById,
//   updateDocument,
//   deleteDocument,
// };


// controllers/assessments/document.controller.js
const path = require("path");
const DocumentFile = require("../../modules/assesmentsModule/assessmentModule");

// Optional: delete from R2 on record delete
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
const R2_BUCKET = process.env.S3_BUCKET || process.env.R2_BUCKET;

// Base used to build public URLs in responses (no DB change)
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE || process.env.R2_PUBLIC_BASE || "").replace(/\/+$/, "");

// ---------------- helpers ----------------
function normalizeCategory(raw) {
  return (raw || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
}

// Build a public URL for clients from a stored path (R2 key or legacy path)
function toFileUrl(doc) {
  const d = doc?.toObject ? doc.toObject() : doc || {};
  if (!d?.path) return d;
  // If path already looks like a full URL, just expose it
  if (/^https?:\/\//i.test(d.path)) {
    return { ...d, fileUrl: d.path };
  }
  // Otherwise, prepend PUBLIC_BASE if available
  if (PUBLIC_BASE) {
    return { ...d, fileUrl: `${PUBLIC_BASE}/${d.path.replace(/^\/+/, "")}` };
  }
  // Fall back to exposing the raw path only
  return { ...d, fileUrl: d.path };
}

// If the stored path is a raw key (not a URL), use it as the R2 Key
function extractR2KeyFromPath(p) {
  if (!p || /^https?:\/\//i.test(p)) return null;
  return p.replace(/^\/+/, "");
}

// ---------------- CRUD ----------------

/** Create */
const createDocument = async (req, res) => {
  try {
    const category = normalizeCategory(req.normalizedCategory || req.body.category);

    // From middleware (R2):
    // - req.file.filename  (basename)
    // - req.file.webPath   (R2 key)
    // - req.file.fileUrl   (public URL if configured)
    // For schema: filename & path are required.
    const filename =
      req.file?.filename ||
      (req.file?.webPath ? path.basename(req.file.webPath) : null) ||
      (req.file?.originalname || null);

    const storedPath =
      req.file?.webPath ||          // preferred: key like 'uploads/docs/<cat>/...pdf'
      req.file?.fileUrl ||          // fallback: full URL if that’s what you prefer to store
      null;

    if (!filename || !storedPath) {
      return res.status(400).json({ success: false, message: "File is required." });
    }

    const doc = await DocumentFile.create({
      title: req.body.title,
      description: req.body.description,
      category,
      filename,
      path: storedPath,                    // <- REQUIRED BY SCHEMA
      mimetype: req.file?.mimetype || null,
      size: req.file?.size || null,
    });

    res.status(201).json({ success: true, data: toFileUrl(doc) });
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** Read all */
const getDocuments = async (_req, res) => {
  try {
    const docs = await DocumentFile.find().sort({ createdAt: -1 });
    res.json({ success: true, data: docs.map(toFileUrl) });
  } catch (err) {
    console.error("Read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** Read single */
const getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentFile.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: toFileUrl(doc) });
  } catch (err) {
    console.error("Read single error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** Update (optionally replace file) */
const updateDocument = async (req, res) => {
  try {
    const update = {
      title: req.body.title,
      description: req.body.description,
    };

    if (req.body.category) {
      update.category = normalizeCategory(req.normalizedCategory || req.body.category);
    }

    // If a new file uploaded, overwrite file fields
    if (req.file) {
      update.filename =
        req.file.filename ||
        (req.file.webPath ? path.basename(req.file.webPath) : req.file.originalname);

      update.path = req.file.webPath || req.file.fileUrl; // keep schema happy
      update.mimetype = req.file.mimetype;
      update.size = req.file.size;

      if (!update.filename || !update.path) {
        return res.status(400).json({ success: false, message: "File is required." });
      }
    }

    const doc = await DocumentFile.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: toFileUrl(doc) });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** Delete (record + try to remove R2 object if path is a key) */
const deleteDocument = async (req, res) => {
  try {
    const doc = await DocumentFile.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const key = extractR2KeyFromPath(doc.path);
    if (key && R2_BUCKET) {
      try {
        await R2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      } catch (e) {
        console.warn("R2 object delete failed:", e?.message || e);
      }
    }

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
