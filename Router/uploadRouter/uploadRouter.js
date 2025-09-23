// routes/uploadRoutes.js
const express = require("express");

const router = express.Router();
const {
  uploadBuffer,
  makeObjectKey,
  putImageToR2,
  buildPublicUrl,
} = require("../../middleWare/aploadImage");

// Single image: field name = "image"
router.post("/image", uploadBuffer.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Optional: allow client to pass folder name, default "uploads"
    const folder = (req.body.folder || "uploads").replace(/[^a-z0-9/_-]/gi, "_");
    const key = makeObjectKey(req.file.originalname, folder);

    await putImageToR2(req.file.buffer, req.file.mimetype, key);

    const url = buildPublicUrl(key);

    return res.status(201).json({
      message: "Uploaded successfully",
      file: {
        url,            // use this on your frontend <img src=... />
        key,            // store this if you want to delete/replace later
        mime: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

module.exports = router;
