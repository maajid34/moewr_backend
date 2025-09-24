// const express = require("express");
// const router = express.Router();

// const {
//   createDocument,
//   getDocuments,
//   getDocumentById,
//   updateDocument,
//   deleteDocument,
// } = require("../../controller/assessmentCntrl/assessmentCntrl");

// const { upload, attachWebPath } = require("../../middleWare/uploadDocs");

// // ✅ Create (upload + metadata)
// router.post(
//   "/createAssess/DocumentFile",
//   upload.single("file"),
//   attachWebPath,
//   createDocument
// );

// // ✅ Read all
// router.get("/ReadAssess/DocumentFile", getDocuments);

// // ✅ Read single
// router.get("/ReadAssess/DocumentFile/:id", getDocumentById);

// // ✅ Update (replace file or just metadata)
// router.put(
//   "/UpdateAssess/DocumentFile/:id",
//   upload.single("file"),
//   attachWebPath,
//   updateDocument
// );

// // ✅ Delete
// router.delete("/DeleteAssess/DocumentFile/:id", deleteDocument);

// module.exports = router;



// routes/assessmentDocs.js
// routes/assessment/assessment.routes.js
const express = require("express");
const router = express.Router();

const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require("../../controller/assessmentCntrl/assessmentCntrl");

// R2-aware middleware (in-memory multer + type/size checks + upload to R2)
// -> upload.single("file") parses the file
// -> uploadToR2 puts it in R2 and sets req.file.webPath & req.file.fileUrl
const { upload, uploadToR2 } = require("../../middleWare/uploadDocs");

// Create (metadata + optional file)
router.post(
  "/createAssess/DocumentFile",
  upload.single("file"),
  uploadToR2,           // safe no-op if no file attached
  createDocument
);

// Read all
router.get("/ReadAssess/DocumentFile", getDocuments);

// Read single
router.get("/ReadAssess/DocumentFile/:id", getDocumentById);

// Update (metadata-only OR with a replacement file)
router.put(
  "/UpdateAssess/DocumentFile/:id",
  upload.single("file"),
  uploadToR2,           // if a file is present, replaces it in R2
  updateDocument
);
// If you prefer partial updates:
// router.patch("/UpdateAssess/DocumentFile/:id", upload.single("file"), uploadToR2, updateDocument);

// Delete
router.delete("/DeleteAssess/DocumentFile/:id", deleteDocument);

module.exports = router;
