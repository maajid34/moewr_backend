// // 

// const path = require("path");
// const fs = require("fs");
// const multer = require("multer");

// const UPLOAD_ROOT = path.join(__dirname, "..", "uploads", "docs");
// fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// // Helper to normalize category names
// function normalizeCategory(raw) {
//   return (raw || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     try {
//       const safeCat = normalizeCategory(req.body.category);
//       req.normalizedCategory = safeCat; // 👉 save it for controller
//       const dir = path.join(UPLOAD_ROOT, safeCat);
//       fs.mkdirSync(dir, { recursive: true });
//       cb(null, dir);
//     } catch (err) {
//       cb(err);
//     }
//   },
//   filename: (_req, file, cb) => {
//     try {
//       const ext = path.extname(file.originalname).toLowerCase();
//       const base = path
//         .basename(file.originalname, ext)
//         .replace(/\s+/g, "_")
//         .replace(/[^a-z0-9_-]/gi, "");
//       cb(null, `${Date.now()}_${base}${ext}`);
//     } catch (err) {
//       cb(err);
//     }
//   },
// });

// const allowed = new Set([
//   "application/pdf",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   "application/vnd.ms-excel",
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   "application/vnd.ms-powerpoint",
//   "application/vnd.openxmlformats-officedocument.presentationml.presentation",
// ]);

// const fileFilter = (_req, file, cb) => {
//   if (allowed.has(file.mimetype)) return cb(null, true);
//   cb(new Error("Invalid file type. Only PDF, Word, Excel, PowerPoint allowed."));
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 25 * 1024 * 1024 },
// });

// // Small helper: attach a web path ready for saving in DB
// function attachWebPath(req, _res, next) {
//   if (req.file) {
//     const cat = req.normalizedCategory || normalizeCategory(req.body.category);
//     req.file.webPath = `uploads/docs/${cat}/${req.file.filename}`;
//   }
//   next();
// }

// module.exports = { upload, attachWebPath };


const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Render’s writable root
const UPLOAD_ROOT = path.join("/tmp", "uploads", "docs");
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// --- helper to normalize category ---
function normalizeCategory(raw) {
  return (raw || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const safeCat = normalizeCategory(req.body.category);
      req.normalizedCategory = safeCat;
      const dir = path.join(UPLOAD_ROOT, safeCat);
      fs.mkdirSync(dir, { recursive: true });     // safe inside /tmp
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_-]/gi, "");
      cb(null, `${Date.now()}_${base}${ext}`);
    } catch (err) {
      cb(err);
    }
  },
});

const allowed = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const fileFilter = (_req, file, cb) => {
  if (allowed.has(file.mimetype)) return cb(null, true);
  cb(new Error("Invalid file type. Only PDF, Word, Excel, PowerPoint allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Helper to attach a web path (for DB)
function attachWebPath(req, _res, next) {
  if (req.file) {
    const cat = req.normalizedCategory || normalizeCategory(req.body.category);
    // build a path you can later serve or upload to cloud
    req.file.webPath = `/uploads/docs/${cat}/${req.file.filename}`;
  }
  next();
}

module.exports = { upload, attachWebPath, UPLOAD_ROOT };
