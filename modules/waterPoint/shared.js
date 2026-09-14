const mongoose = require("mongoose");
// const TYPES = ["BOREHOLE", "SHALLOW_WELL"];
const TYPES = [
  "BOREHOLE",
  "SHALLOW_WELL",
  "BARKAD",
  "WATER_PAN",
  "WATER_KIOSK",
];
const STATUSES = [
  "FUNCTIONAL",
  "NON_FUNCTIONAL",
  "PARTIALLY_FUNCTIONAL",
  "UNDER_MAINTENANCE",
  "ABANDONED",
  "UNKNOWN",
];
const ORGS = [
  "GOVERNMENT",
  "NGO",
  "UN_AGENCY",
  "PRIVATE_COMPANY",
  "COMMUNITY",
  "DONOR_PARTNER",
  "OTHER",
  "UNKNOWN",
];
const UNITS = [
  "M3_PER_HOUR",
  "LITERS_PER_SECOND",
  "LITERS_PER_MINUTE",
  "UNKNOWN",
];
const QUALITY = ["FRESH", "BRACKISH", "SALINE", "UNKNOWN"];
const PUMPS = [
  "HAND_PUMP",
  "SUBMERSIBLE",
  "SURFACE_PUMP",
  "OTHER",
  "NONE",
  "UNKNOWN",
];
const POWER = [
  "SOLAR",
  "GRID",
  "DIESEL",
  "MANUAL",
  "HYBRID",
  "NONE",
  "UNKNOWN",
];
const cleanName = (value) =>
  typeof value === "string"
    ? value.normalize("NFKC").trim().replace(/\s+/g, " ")
    : value;
const actor = () => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin",
  required: true,
});
const text = (max = 200) => ({ type: String, trim: true, maxlength: max });
const nonnegative = { type: Number, min: 0, validate: Number.isFinite };
const fileSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    bucket: { type: String, required: true },
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: actor(),
  },
  { strict: "throw" },
);
const files = (max) => ({
  type: [fileSchema],
  default: [],
  validate: (v) => v.length <= max,
});
module.exports = {
  TYPES,
  STATUSES,
  ORGS,
  UNITS,
  QUALITY,
  PUMPS,
  POWER,
  cleanName,
  actor,
  text,
  nonnegative,
  files,
};
