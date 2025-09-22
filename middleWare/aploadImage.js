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

// Writable folder on Render
const UPLOAD_DIR = "/tmp/document";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safe);
  }
});

// 👉 Export the multer instance directly
const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = uploadImage;       // <-- export only the instance
