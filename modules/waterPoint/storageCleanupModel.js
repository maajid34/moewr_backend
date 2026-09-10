const mongoose = require("mongoose");
module.exports = mongoose.model(
  "WaterPointStorageCleanup",
  new mongoose.Schema(
    {
      key: { type: String, required: true },
      bucket: { type: String, required: true },
    },
    { timestamps: true, collection: "water_registry_storage_cleanup" },
  ),
);
