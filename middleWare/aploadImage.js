// const multer = require("multer")



// const storeImage = multer.diskStorage({
//     destination: (req,file,cb) =>{
//         cb(null,"document")
//     },
//     filename: (req,file,cb)=>{
//         cb(null,file.originalname)
//     }
// })

// const uploadImage = multer({
//     storage:storeImage
// })

// module.exports = uploadImage


// utils/uploadR2.js
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const multer = require("multer");
// const crypto = require("crypto");
// const path = require("path");

// // Multer: keep file in memory
// // const uploadBuffer = multer({
// //   storage: multer.memoryStorage(),
// //   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
// //   fileFilter: (req, file, cb) => {
// //     const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// //     ok.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images allowed (jpeg/png/webp/gif)"));
// //   },
// // });

// const uploadBuffer = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
//   fileFilter: (req, file, cb) => {
//     const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
//     ok.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images allowed"));
//   },
// });

// const s3 = new S3Client({
//   region: "auto", // R2 uses "auto"
//   endpoint: process.env.S3_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.S3_ACCESS_KEY,
//     secretAccessKey: process.env.S3_SECRET_KEY,
//   },
// });

// function makeObjectKey(originalName, folder = "uploads") {
//   const ext = path.extname(originalName).toLowerCase() || ".jpg";
//   const base = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, "_").slice(0, 50);
//   const rand = crypto.randomBytes(6).toString("hex");
//   return `${folder}/${Date.now()}_${base}_${rand}${ext}`;
// }

// async function putImageToR2(buffer, mimeType, key) {
//   await s3.send(new PutObjectCommand({
//     Bucket: process.env.S3_BUCKET,
//     Key: key,
//     Body: buffer,
//     ContentType: mimeType,
//   }));
// }

// // Build a public URL for the uploaded key.
// // Preferred: use your custom domain (S3_PUBLIC_BASE).
// // Fallback: temporary “r2.dev” URL if you enabled Public Access & Static Site on the bucket.
// function buildPublicUrl(key) {
//   if (process.env.S3_PUBLIC_BASE) return `${process.env.S3_PUBLIC_BASE}/${key}`;
//   // Fallback pattern (replace with your actual public base if different):
//   // e.g. https://pub-<bucketid>.r2.dev/<key>
//   return `/r2/${key}`; // placeholder so you see when S3_PUBLIC_BASE is missing
// }

// module.exports = {
//   uploadBuffer,
//   makeObjectKey,
//   putImageToR2,
//   buildPublicUrl,
// };


// middleWare/r2BufferUpload.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

// ---------- Multer (memory) ----------
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images allowed"));
  },
});

const uploadDocs = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const ok = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]);
    ok.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only PDF/Word/Excel/PowerPoint allowed"));
  },
});

// ---------- R2 client ----------
const s3 = new S3Client({
  region: "auto", // R2 uses "auto"
  endpoint: process.env.S3_ENDPOINT, // e.g. https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

// ---------- utils ----------
function makeObjectKey(originalName, folder = "uploads") {
  const ext = (path.extname(originalName) || "").toLowerCase();
  const base =
    path
      .basename(originalName, ext)
      .replace(/[^a-z0-9-_]/gi, "_")
      .slice(0, 60) || "file";
  const rand = crypto.randomBytes(6).toString("hex");
  return `${folder}/${Date.now()}_${base}_${rand}${ext || ".bin"}`;
}

// Public URL: prefer R2 public-dev (or your custom domain) and include bucket
function buildPublicUrl(key) {
  const base = (process.env.R2_PUBLIC_BASE || process.env.S3_PUBLIC_BASE || "").replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET;
  if (base && bucket) return `${base}/${bucket}/${key}`;
  // Fallback marker (tells you env is missing/misconfigured)
  return `/r2/${key}`;
}

// Low-level upload
async function putToR2(buffer, mimeType, key) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType || "application/octet-stream",
    })
  );
}

// ---------- middleware helper ----------
// Call this AFTER multer (uploadImages.single("file") or uploadDocs.single("file"))
async function uploadToR2AndTag(req, _res, next) {
  try {
    if (!req.file) return next(); // metadata-only request
    const folder = req.body?.folder || "uploads"; // or "docs/<category>" if you like
    const key = makeObjectKey(req.file.originalname || "file", folder);

    await putToR2(req.file.buffer, req.file.mimetype, key);

    // Tag the request so your controller can store them
    req.file.storageKey = key;
    req.file.webPath = key;                 // <-- raw key for DB
    req.file.fileUrl = buildPublicUrl(key); // <-- public URL for clients

    // Helpful one-time log
    console.log("R2 UPLOADED:", {
      bucket: process.env.S3_BUCKET,
      key,
      url: req.file.fileUrl,
    });

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // multer instances (use the one you need)
  uploadImages,
  uploadDocs,

  // helpers (if you need them elsewhere)
  makeObjectKey,
  buildPublicUrl,
  putToR2,

  // main middleware to use after multer
  uploadToR2AndTag,
};
