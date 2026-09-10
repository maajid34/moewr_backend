const mongoose = require("mongoose");
const {
  STATUSES,
  UNITS,
  QUALITY,
  actor,
  text,
  nonnegative,
  files,
} = require("./shared");
const schema = new mongoose.Schema(
  {
    waterPoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WaterPoint",
      required: true,
      immutable: true,
    },
    assessmentDate: {
      type: Date,
      required: true,
      validate: (v) => v <= new Date(),
    },
    status: { type: String, enum: STATUSES, required: true },
    waterQuality: { type: String, enum: QUALITY },
    yieldValue: nonnegative,
    yieldUnit: { type: String, enum: UNITS },
    conditionNotes: text(5000),
    maintenanceRequired: { type: Boolean, default: false },
    photos: files(20),
    assessedByName: text(),
    createdBy: actor(),
  },
  {
    timestamps: true,
    strict: "throw",
    collection: "water_registry_assessments",
  },
);
schema.pre("validate", function () {
  if (this.yieldValue != null && !this.yieldUnit)
    this.invalidate("yieldUnit", "Yield unit is required with a value");
});
schema.index({ waterPoint: 1, assessmentDate: -1, _id: -1 });
module.exports = mongoose.model("WaterPointAssessment", schema);
