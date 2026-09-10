const mongoose = require("mongoose");
const { actor, cleanName } = require("./shared");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 120, set: cleanName },
    nameKey: { type: String, required: true, unique: true, select: false },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30,
      set: (v) => (v === "" || v === null ? undefined : v),
    },
    isActive: { type: Boolean, default: true },
    createdBy: actor(),
    updatedBy: actor(),
    registryVersion: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
    strict: "throw",
    optimisticConcurrency: true,
    collection: "water_registry_regions",
  },
);
schema.pre("validate", function () {
  this.nameKey = cleanName(this.name)?.toLowerCase();
});
schema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: "string" } } },
);
module.exports = mongoose.model("Region", schema);
