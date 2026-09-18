// const mongoose = require("mongoose");
// // const TYPES = ["BOREHOLE", "SHALLOW_WELL"];
// const TYPES = [
//   "BOREHOLE",
//   "SHALLOW_WELL",
//   "BARKAD",
//   "WATER_PAN",
//   "WATER_KIOSK",
// ];
// const STATUSES = [
//   "FUNCTIONAL",
//   "NON_FUNCTIONAL",
//   "PARTIALLY_FUNCTIONAL",
//   "UNDER_MAINTENANCE",
//   "ABANDONED",
//   "UNKNOWN",
// ];
// const ORGS = [
//   "GOVERNMENT",
//   "NGO",
//   "UN_AGENCY",
//   "PRIVATE_COMPANY",
//   "COMMUNITY",
//   "DONOR_PARTNER",
//   "OTHER",
//   "UNKNOWN",
// ];
// const UNITS = [
//   "M3_PER_HOUR",
//   "LITERS_PER_SECOND",
//   "LITERS_PER_MINUTE",
//   "UNKNOWN",
// ];
// const QUALITY = ["FRESH", "BRACKISH", "SALINE", "UNKNOWN"];
// const PUMPS = [
//   "HAND_PUMP",
//   "SUBMERSIBLE",
//   "SURFACE_PUMP",
//   "OTHER",
//   "NONE",
//   "UNKNOWN",
// ];
// const POWER = [
//   "SOLAR",
//   "GRID",
//   "DIESEL",
//   "MANUAL",
//   "HYBRID",
//   "NONE",
//   "UNKNOWN",
// ];
// const cleanName = (value) =>
//   typeof value === "string"
//     ? value.normalize("NFKC").trim().replace(/\s+/g, " ")
//     : value;
// const actor = () => ({
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Admin",
//   required: true,
// });
// const text = (max = 200) => ({ type: String, trim: true, maxlength: max });
// const nonnegative = { type: Number, min: 0, validate: Number.isFinite };
// const fileSchema = new mongoose.Schema(
//   {
//     key: { type: String, required: true },
//     bucket: { type: String, required: true },
//     url: { type: String, required: true },
//     fileName: { type: String, required: true },
//     mimeType: { type: String, required: true },
//     size: { type: Number, required: true, min: 1 },
//     uploadedAt: { type: Date, default: Date.now },
//     uploadedBy: actor(),
//   },
//   { strict: "throw" },
// );
// const files = (max) => ({
//   type: [fileSchema],
//   default: [],
//   validate: (v) => v.length <= max,
// });
// module.exports = {
//   TYPES,
//   STATUSES,
//   ORGS,
//   UNITS,
//   QUALITY,
//   PUMPS,
//   POWER,
//   cleanName,
//   actor,
//   text,
//   nonnegative,
//   files,
// };


const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| WATER SOURCE TYPES
|--------------------------------------------------------------------------
*/

const TYPES = [
  "BOREHOLE",
  "SHALLOW_WELL",
  "BARKAD",
  "WATER_PAN",
  "WATER_KIOSK",
];

/*
|--------------------------------------------------------------------------
| OPERATIONAL STATUSES
|--------------------------------------------------------------------------
*/

const STATUSES = [
  "FUNCTIONAL",
  "NON_FUNCTIONAL",
  "PARTIALLY_FUNCTIONAL",
  "UNDER_MAINTENANCE",
  "ABANDONED",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ORGANIZATION TYPES
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| YIELD UNITS
|--------------------------------------------------------------------------
*/

const UNITS = [
  "M3_PER_HOUR",
  "LITERS_PER_SECOND",
  "LITERS_PER_MINUTE",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| WATER QUALITY
|--------------------------------------------------------------------------
*/

const QUALITY = [
  "FRESH",
  "BRACKISH",
  "SALINE",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| PUMP TYPES
|--------------------------------------------------------------------------
*/

const PUMPS = [
  "HAND_PUMP",
  "SUBMERSIBLE",
  "SURFACE_PUMP",
  "OTHER",
  "NONE",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| POWER SOURCES
|--------------------------------------------------------------------------
*/

const POWER = [
  "SOLAR",
  "GRID",
  "DIESEL",
  "MANUAL",
  "HYBRID",
  "NONE",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ASSESSMENT — CHLORINATION STATUS
|--------------------------------------------------------------------------
*/

const CHLORINATION_STATUSES = [
  "CHLORINATED",
  "NOT_CHLORINATED",
  "NOT_REQUIRED",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ASSESSMENT — MANAGEMENT TYPES
|--------------------------------------------------------------------------
*/

const MANAGEMENT_TYPES = [
  "GOVERNMENT",
  "COMMUNITY_WATER_COMMITTEE",
  "PRIVATE_OPERATOR",
  "NGO",
  "INSTITUTION",
  "OTHER",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ASSESSMENT — 2023 FLOOD IMPACT
|--------------------------------------------------------------------------
*/

const FLOOD_IMPACTS = [
  "NO_IMPACT",
  "MINOR_IMPACT",
  "MODERATE_IMPACT",
  "MAJOR_IMPACT",
  "SEVERE_IMPACT",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ASSESSMENT — CURRENT FLOOD EXPOSURE
|--------------------------------------------------------------------------
*/

const FLOOD_EXPOSURES = [
  "NONE",
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY_HIGH",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ASSESSMENT — ACCESS / CONTAMINATION RISK
|--------------------------------------------------------------------------
*/

const RISK_LEVELS = [
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY_HIGH",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| ASSESSMENT — STRUCTURAL / PROTECTION CONDITION
|--------------------------------------------------------------------------
*/

const STRUCTURAL_CONDITIONS = [
  "GOOD",
  "FAIR",
  "POOR",
  "CRITICAL",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| YES / NO / UNKNOWN
|--------------------------------------------------------------------------
*/

const YES_NO_UNKNOWN = [
  "YES",
  "NO",
  "UNKNOWN",
];

/*
|--------------------------------------------------------------------------
| CALCULATED RISK CATEGORIES
|--------------------------------------------------------------------------
*/

const RISK_CATEGORIES = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
];

/*
|--------------------------------------------------------------------------
| ACTION PRIORITIES
|--------------------------------------------------------------------------
*/

const ACTION_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

/*
|--------------------------------------------------------------------------
| ACTION STATUSES
|--------------------------------------------------------------------------
*/

const ACTION_STATUSES = [
  "NOT_STARTED",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const cleanName = (value) =>
  typeof value === "string"
    ? value
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
    : value;

const actor = () => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin",
  required: true,
});

const text = (max = 200) => ({
  type: String,
  trim: true,
  maxlength: max,
});

const nonnegative = {
  type: Number,
  min: 0,
  validate: Number.isFinite,
};

/*
|--------------------------------------------------------------------------
| FILE METADATA
|--------------------------------------------------------------------------
*/

// const fileSchema = new mongoose.Schema(
//   {
//     key: {
//       type: String,
//       required: true,
//     },

//     bucket: {
//       type: String,
//       required: true,
//     },

//     url: {
//       type: String,
//       required: true,
//     },

//     fileName: {
//       type: String,
//       required: true,
//     },

//     mimeType: {
//       type: String,
//       required: true,
//     },

//     size: {
//       type: Number,
//       required: true,
//       min: 1,
//     },

//     uploadedAt: {
//       type: Date,
//       default: Date.now,
//     },

//     uploadedBy: actor(),
//   },
//   {
//     _id: false,
//     strict: "throw",
//   },
// );

const fileSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },

    bucket: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    uploadedBy: actor(),
  },
  {
    strict: "throw",
  },
);

const files = (max) => ({
  type: [fileSchema],

  default: [],

  validate: {
    validator: (value) =>
      Array.isArray(value) &&
      value.length <= max,

    message: `Maximum ${max} files allowed`,
  },
});

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  /*
   * Existing Water Point values
   */
  TYPES,
  STATUSES,
  ORGS,
  UNITS,
  QUALITY,
  PUMPS,
  POWER,

  /*
   * New Assessment values
   */
  CHLORINATION_STATUSES,
  MANAGEMENT_TYPES,
  FLOOD_IMPACTS,
  FLOOD_EXPOSURES,
  RISK_LEVELS,
  STRUCTURAL_CONDITIONS,
  YES_NO_UNKNOWN,
  RISK_CATEGORIES,
  ACTION_PRIORITIES,
  ACTION_STATUSES,

  /*
   * Shared helpers
   */
  cleanName,
  actor,
  text,
  nonnegative,
  files,
};