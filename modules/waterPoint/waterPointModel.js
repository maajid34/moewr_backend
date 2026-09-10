const mongoose = require("mongoose");
const {
  TYPES,
  STATUSES,
  ORGS,
  UNITS,
  QUALITY,
  PUMPS,
  POWER,
  actor,
  text,
  nonnegative,
  files,
} = require("./shared");
const embedded = { _id: false, strict: "throw" };
const implementation = new mongoose.Schema(
  {
    organizationType: { type: String, enum: ORGS },
    implementingOrganization: text(),
    fundingPartner: text(),
    contractorCompany: text(),
    projectOrProgramName: text(),
    yearConstructed: {
      type: Number,
      min: 1800,
      validate: (v) => Number.isInteger(v) && v <= new Date().getUTCFullYear(),
    },
    completionDate: { type: Date, validate: (v) => v <= new Date() },
  },
  embedded,
);
const technical = new mongoose.Schema(
  {
    depthMeters: nonnegative,
    yieldValue: nonnegative,
    yieldUnit: { type: String, enum: UNITS },
    waterQuality: { type: String, enum: QUALITY },
    pumpType: { type: String, enum: PUMPS },
    powerSource: { type: String, enum: POWER },
  },
  embedded,
);
const beneficiaries = new mongoose.Schema(
  {
    estimatedPopulationServed: {
      ...nonnegative,
      validate: Number.isSafeInteger,
    },
    estimatedHouseholdsServed: {
      ...nonnegative,
      validate: Number.isSafeInteger,
    },
    managementType: text(),
  },
  embedded,
);
const geometry = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      default: undefined,
      validate: (v) =>
        Array.isArray(v) &&
        v.length === 2 &&
        v.every(Number.isFinite) &&
        Math.abs(v[0]) <= 180 &&
        Math.abs(v[1]) <= 90,
    },
  },
  embedded,
);
const schema = new mongoose.Schema(
  {
    waterPointCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    waterPointName: text(),
    waterSourceType: {
      type: String,
      enum: TYPES,
      required: true,
      immutable: true,
      index: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: true,
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
      index: true,
    },
    villageOrSite: { ...text(), required: true },
    location: { type: geometry, required: true },
    status: { type: String, enum: STATUSES, required: true, index: true },
    implementation,
    technical,
    beneficiaries,
    photos: files(20),
    documents: files(10),
    notes: text(5000),
    createdBy: actor(),
    updatedBy: actor(),
    isActive: { type: Boolean, default: true },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    registryVersion: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
    strict: "throw",
    optimisticConcurrency: true,
    collection: "water_registry_points",
  },
);
schema.pre("validate", function () {
  if (this.technical?.yieldValue != null && !this.technical.yieldUnit)
    this.invalidate(
      "technical.yieldUnit",
      "Yield unit is required with a value",
    );
  const i = this.implementation;
  if (
    i?.completionDate &&
    i.yearConstructed != null &&
    i.completionDate.getUTCFullYear() !== i.yearConstructed
  )
    this.invalidate(
      "implementation.completionDate",
      "Completion date must match construction year",
    );
});
schema.index({ location: "2dsphere" });
schema.index({ region: 1, district: 1, waterSourceType: 1 });
schema.index({ region: 1, district: 1, status: 1 });
schema.index({ "implementation.yearConstructed": 1 });
schema.index({ "implementation.implementingOrganization": 1 });
schema.index({ "implementation.contractorCompany": 1 });
schema.index({ isActive: 1, createdAt: -1, _id: -1 });
module.exports = mongoose.model("WaterPoint", schema);
