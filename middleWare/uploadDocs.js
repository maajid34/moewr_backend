// // 

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads", "docs");
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// Helper to normalize category names
function normalizeCategory(raw) {
  return (raw || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const safeCat = normalizeCategory(req.body.category);
      req.normalizedCategory = safeCat; // 👉 save it for controller
      const dir = path.join(UPLOAD_ROOT, safeCat);
      fs.mkdirSync(dir, { recursive: true });
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

// Small helper: attach a web path ready for saving in DB
function attachWebPath(req, _res, next) {
  if (req.file) {
    const cat = req.normalizedCategory || normalizeCategory(req.body.category);
    req.file.webPath = `uploads/docs/${cat}/${req.file.filename}`;
  }
  next();
}

module.exports = { upload, attachWebPath };


// // middleware/uploadDocs.js
// const multer = require("multer");
// const path = require("path");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// // ---------- ENV you must set ----------
// // R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxx
// // R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxx
// // R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxx
// // R2_BUCKET=moewr-docs
// // R2_PUBLIC_BASE=https://docs.moewr-jubalandstate.so    # your public R2 domain (or custom domain)
// // --------------------------------------

// const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// const s3 = new S3Client({
//   region: "auto",
//   endpoint: R2_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.R2_ACCESS_KEY_ID,
//     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
//   },
// });

// function normalizeCategory(raw) {
//   return (raw || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
// }

// function sanitizeFileName(name) {
//   const ext = path.extname(name).toLowerCase();
//   const base = path
//     .basename(name, ext)
//     .toLowerCase()
//     .replace(/\s+/g, "_")
//     .replace(/[^a-z0-9_.-]/gi, "");
//   return `${base}${ext}`;
// }

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

// // We buffer the file in memory then push to R2
// const upload = multer({
//   storage: multer.memoryStorage(),
//   fileFilter,
//   limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
// });

// /**
//  * Upload the buffered file to Cloudflare R2 and attach:
//  *   req.file.storageKey  -> 'docs/<category>/<filename>'
//  *   req.file.fileUrl     -> '<R2_PUBLIC_BASE>/docs/<category>/<filename>'
//  *   req.normalizedCategory
//  */
// async function uploadToR2(req, _res, next) {
//   try {
//     if (!req.file) return next();

//     const category = normalizeCategory(req.body.category);
//     req.normalizedCategory = category;

//     const cleanedName = sanitizeFileName(req.file.originalname);
//     const ts = Date.now();
//     const key = `docs/${category}/${ts}_${cleanedName}`;

//     await s3.send(
//       new PutObjectCommand({
//         Bucket: process.env.R2_BUCKET,
//         Key: key,
//         Body: req.file.buffer,
//         ContentType: req.file.mimetype,
//         // If your bucket is private, remove ACL and serve with signed URLs instead.
//         ACL: "public-read",
//       })
//     );

//     const publicBase = (process.env.R2_PUBLIC_BASE || "").replace(/\/+$/, "");
//     if (!publicBase) {
//       throw new Error("R2_PUBLIC_BASE is not set");
//     }

//     req.file.storageKey = key; // for future delete/update
//     req.file.fileUrl = `${publicBase}/${key}`; // absolute URL to store in DB

//     next();
//   } catch (err) {
//     next(err);
//   }
// }

// module.exports = { upload, uploadToR2 };
