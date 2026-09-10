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
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

// Multer: keep file in memory
// const uploadBuffer = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
//   fileFilter: (req, file, cb) => {
//     const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
//     ok.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images allowed (jpeg/png/webp/gif)"));
//   },
// });

const uploadBuffer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only images allowed"));
  },
});

// const s3 = new S3Client({
//   region: "auto", // R2 uses "auto"
//   endpoint: process.env.S3_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.S3_ACCESS_KEY,
//     secretAccessKey: process.env.S3_SECRET_KEY,
//   },
// });

let s3;
function storageClient() {
  if (s3) return s3;
  const endpoint = process.env.S3_ENDPOINT || (process.env.R2_ACCOUNT_ID && `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('Storage is not configured');
  s3 = new S3Client({ region: 'auto', endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  return s3;
}




function makeObjectKey(originalName, folder = "uploads") {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const base = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, "_").slice(0, 50);
  const rand = crypto.randomBytes(6).toString("hex");
  return `${folder}/${Date.now()}_${base}_${rand}${ext}`;
}

async function putImageToR2(buffer, mimeType, key, bucket = process.env.S3_BUCKET) {
  if (!bucket) throw new Error('Storage bucket is not configured');
  await storageClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
}

// Build a public URL for the uploaded key.
// Preferred: use your custom domain (S3_PUBLIC_BASE).
// Fallback: temporary “r2.dev” URL if you enabled Public Access & Static Site on the bucket.
function buildPublicUrl(key) {
  if (process.env.S3_PUBLIC_BASE) return `${process.env.S3_PUBLIC_BASE}/${key}`;
  // Fallback pattern (replace with your actual public base if different):
  // e.g. https://pub-<bucketid>.r2.dev/<key>
  return `/r2/${key}`; // placeholder so you see when S3_PUBLIC_BASE is missing
}

async function deleteObjectFromR2(key, bucket) {
  return storageClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
async function getObjectFromR2(key, bucket) {
  return storageClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}
module.exports = {
  uploadBuffer,
  makeObjectKey,
  putImageToR2,
  buildPublicUrl,
  deleteObjectFromR2,
  getObjectFromR2,
};
