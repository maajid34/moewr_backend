const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  { _id: String, value: { type: Number, required: true, min: 1 } },
  { versionKey: false, collection: "water_registry_counters" },
);
module.exports = mongoose.model("WaterPointCounter", schema);
