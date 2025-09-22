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


const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Render allows writing only in /tmp
const UPLOAD_DIR = "/tmp/document";

// Make sure the folder exists at runtime
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);                   // <-- write to /tmp/uploads
  },
  filename: (_req, file, cb) => {
    // sanitize and make name unique
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safe);
  }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }    // 10MB limit
});

module.exports = { uploadImage, UPLOAD_DIR };
