const Asset = require("../../modules/assetsModel/Asset");

// POST /api/assets
exports.createAsset = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    return res.status(201).json(asset);
  } catch (err) {
    // Duplicate key (unique) error
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate value (assetNo or tagNumber must be unique).",
        details: err.keyValue,
      });
    }
    return res.status(400).json({ message: err.message });
  }
};

// GET /api/assets
exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().sort({ assetNo: 1 });
    return res.json(assets);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/assets/:id
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    return res.json(asset);
  } catch (err) {
    return res.status(400).json({ message: "Invalid id" });
  }
};

// PUT /api/assets/:id
exports.updateAsset = async (req, res) => {
  try {
    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Asset not found" });
    return res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate value (assetNo or tagNumber must be unique).",
        details: err.keyValue,
      });
    }
    return res.status(400).json({ message: err.message });
  }
};

// DELETE /api/assets/:id
exports.deleteAsset = async (req, res) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Asset not found" });
    return res.json({ message: "Asset deleted", id: deleted._id });
  } catch (err) {
    return res.status(400).json({ message: "Invalid id" });
  }
};
