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


// middleWare/uploadDocs.js
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// -------- utils --------
const allowed = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function normalizeCategory(raw) {
  return (raw || "general").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
}

function makeObjectKey(originalName, category) {
  const folder = `docs/${normalizeCategory(category)}`;
  const ext = (path.extname(originalName) || "").toLowerCase();
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9-_]/gi, "_")
    .slice(0, 60) || "file";
  const rand = crypto.randomBytes(6).toString("hex");
  return `${folder}/${Date.now()}_${base}_${rand}${ext || ".bin"}`;
}

function buildPublicUrl(key) {
  const base = (process.env.R2_PUBLIC_BASE || "").replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET;
  if (base && bucket) {
    return `${base}/${bucket}/${key}`;
  }
  return `/r2/${key}`; // fallback marker si aad u ogaato haddii env qaldan yahay
}

// Accept either R2_* or S3_* variable names
function envOr(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

function createR2Client() {
  const accessKeyId     = envOr("R2_ACCESS_KEY_ID", "S3_ACCESS_KEY");
  const secretAccessKey = envOr("R2_SECRET_ACCESS_KEY", "S3_SECRET_KEY");
  const bucket          = envOr("R2_BUCKET", "S3_BUCKET");

  // You can provide either a full endpoint or an account id
  const endpoint = envOr("S3_ENDPOINT") ||
                   (envOr("R2_ACCOUNT_ID") && `https://${envOr("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`);

  const missing = [];
  if (!accessKeyId)     missing.push("R2_ACCESS_KEY_ID or S3_ACCESS_KEY");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY or S3_SECRET_KEY");
  if (!bucket)          missing.push("R2_BUCKET or S3_BUCKET");
  if (!endpoint)        missing.push("S3_ENDPOINT or R2_ACCOUNT_ID");

  if (missing.length) {
    throw new Error("R2 configuration missing (env vars): " + missing.join(", "));
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  };
}

// -------- multer (memory) --------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.has(file.mimetype)) return cb(null, true);
    cb(new Error("Invalid file type. Only PDF, Word, Excel, PowerPoint allowed."));
  },
});

// -------- push uploaded file to R2 --------
async function uploadToR2(req, _res, next) {
  try {
    req.normalizedCategory = normalizeCategory(req.body?.category);

    // metadata-only updates pass through
    if (!req.file) return next();

    const { client, bucket } = createR2Client();
    const key = makeObjectKey(req.file.originalname || "document", req.normalizedCategory);

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || "application/octet-stream",
    }));

    req.file.storageKey = key;
    req.file.fileUrl = buildPublicUrl(key);
    next();
  } catch (err) {
    next(err);
  }
}

// Optional helper if you want to delete from R2 elsewhere
async function deleteFromR2(storageKey) {
  if (!storageKey) return;
  const { client, bucket } = createR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
}

module.exports = { upload, uploadToR2, deleteFromR2 };
