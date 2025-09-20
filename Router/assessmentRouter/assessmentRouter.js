const express = require("express");
const router = express.Router();

const {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require("../../controller/assessmentCntrl/assessmentCntrl");

const { upload, attachWebPath } = require("../../middleWare/uploadDocs");

// ✅ Create (upload + metadata)
router.post(
  "/createAssess/DocumentFile",
  upload.single("file"),
  attachWebPath,
  createDocument
);

// ✅ Read all
router.get("/ReadAssess/DocumentFile", getDocuments);

// ✅ Read single
router.get("/ReadAssess/DocumentFile/:id", getDocumentById);

// ✅ Update (replace file or just metadata)
router.put(
  "/UpdateAssess/DocumentFile/:id",
  upload.single("file"),
  attachWebPath,
  updateDocument
);

// ✅ Delete
router.delete("/DeleteAssess/DocumentFile/:id", deleteDocument);

module.exports = router;
