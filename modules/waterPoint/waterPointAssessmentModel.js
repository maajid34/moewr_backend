// const mongoose = require("mongoose");
// const {
//   STATUSES,
//   UNITS,
//   QUALITY,
//   actor,
//   text,
//   nonnegative,
//   files,
// } = require("./shared");
// const schema = new mongoose.Schema(
//   {
//     waterPoint: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "WaterPoint",
//       required: true,
//       immutable: true,
//     },
//     assessmentDate: {
//       type: Date,
//       required: true,
//       validate: (v) => v <= new Date(),
//     },
//     status: { type: String, enum: STATUSES, required: true },
//     waterQuality: { type: String, enum: QUALITY },
//     yieldValue: nonnegative,
//     yieldUnit: { type: String, enum: UNITS },
//     conditionNotes: text(5000),
//     maintenanceRequired: { type: Boolean, default: false },
//     photos: files(20),
//     assessedByName: text(),
//     createdBy: actor(),
//   },
//   {
//     timestamps: true,
//     strict: "throw",
//     collection: "water_registry_assessments",
//   },
// );
// schema.pre("validate", function () {
//   if (this.yieldValue != null && !this.yieldUnit)
//     this.invalidate("yieldUnit", "Yield unit is required with a value");
// });
// schema.index({ waterPoint: 1, assessmentDate: -1, _id: -1 });
// module.exports = mongoose.model("WaterPointAssessment", schema);

const mongoose = require("mongoose");

const {
  STATUSES,
  UNITS,
  QUALITY,

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

  actor,
  text,
  nonnegative,
  files,
} = require("./shared");

/* ==========================================================================
   SCHEMA
========================================================================== */

const schema = new mongoose.Schema(
  {
    /* ========================================================================
       WATER SOURCE
    ======================================================================== */

    waterPoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WaterPoint",
      required: true,
      immutable: true,
      index: true,
    },

    /* ========================================================================
       BASIC ASSESSMENT
    ======================================================================== */

    assessmentDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) =>
          value instanceof Date &&
          !Number.isNaN(value.getTime()) &&
          value <= new Date(),
        message:
          "Assessment date cannot be in the future",
      },
    },

    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },

    /* ========================================================================
       CURRENT TECHNICAL CONDITION
    ======================================================================== */

    yieldValue: nonnegative,

    yieldUnit: {
      type: String,
      enum: UNITS,
    },

    storageAvailableM3:
      nonnegative,

    waterQuality: {
      type: String,
      enum: QUALITY,
    },

    chlorinationStatus: {
      type: String,
      enum: CHLORINATION_STATUSES,
    },

    /* ========================================================================
       BENEFICIARIES & MANAGEMENT
    ======================================================================== */

    estimatedPopulationServed: {
      type: Number,
      min: 0,
      validate: {
        validator: (value) =>
          value == null ||
          Number.isSafeInteger(value),
        message:
          "Estimated population must be a non-negative integer",
      },
    },

    estimatedHouseholdsServed: {
      type: Number,
      min: 0,
      validate: {
        validator: (value) =>
          value == null ||
          Number.isSafeInteger(value),
        message:
          "Estimated households must be a non-negative integer",
      },
    },

    managementType: {
      type: String,
      enum: MANAGEMENT_TYPES,
    },

    managementOperatorName:
      text(300),

    /* ========================================================================
       FLOOD RISK ASSESSMENT
    ======================================================================== */

    floodImpact2023: {
      type: String,
      enum: FLOOD_IMPACTS,
    },

    floodDamageDisruption2023:
      text(5000),

    currentFloodExposure: {
      type: String,
      enum: FLOOD_EXPOSURES,
    },

    distanceToRiverWadiDrainageM:
      nonnegative,

    accessRisk: {
      type: String,
      enum: RISK_LEVELS,
    },

    contaminationRisk: {
      type: String,
      enum: RISK_LEVELS,
    },

    structuralProtectionCondition: {
      type: String,
      enum: STRUCTURAL_CONDITIONS,
    },

    alternativeWaterSourceAvailable: {
      type: String,
      enum: YES_NO_UNKNOWN,
    },

    alternativeSourceDistanceKm:
      nonnegative,

    criticalFacilitiesSettlementsServed:
      text(5000),

    /* ========================================================================
       RISK SCORING
    ======================================================================== */

    likelihood: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: (value) =>
          value == null ||
          Number.isInteger(value),
        message:
          "Likelihood must be an integer from 1 to 5",
      },
    },

    impact: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: (value) =>
          value == null ||
          Number.isInteger(value),
        message:
          "Impact must be an integer from 1 to 5",
      },
    },

    riskScore: {
      type: Number,
      min: 1,
      max: 25,
    },

    riskCategory: {
      type: String,
      enum: RISK_CATEGORIES,
    },

    /* ========================================================================
       MITIGATION & ACTION PLAN
    ======================================================================== */

    recommendedImmediateAction:
      text(5000),

    preFloodMitigationRequired:
      text(5000),

    actionPriority: {
      type: String,
      enum: ACTION_PRIORITIES,
    },

    responsibleFocalAgency:
      text(500),

    targetCompletionDate: {
      type: Date,
    },

    estimatedCostUSD:
      nonnegative,

    actionStatus: {
      type: String,
      enum: ACTION_STATUSES,
    },

    /* ========================================================================
       ASSESSOR INFORMATION
    ======================================================================== */

    assessorName:
      text(300),

    assessorContact:
      text(300),

    /*
     * Legacy field retained for compatibility.
     */
    assessedByName:
      text(300),

    /* ========================================================================
       LEGACY / CONDITION FIELDS
    ======================================================================== */

    conditionNotes:
      text(5000),

    maintenanceRequired: {
      type: Boolean,
      default: false,
    },

    /* ========================================================================
       EVIDENCE
    ======================================================================== */

    /*
     * Legacy assessment photos.
     */
    photos:
      files(20),

    /*
     * Current assessment evidence.
     *
     * Supports private JPEG / PNG / PDF evidence
     * through fileController.
     */
    assessmentDocuments:
      files(20),

    /* ========================================================================
       AUDIT
    ======================================================================== */

    createdBy:
      actor(),
  },

  {
    timestamps: true,

    strict: "throw",

    collection:
      "water_registry_assessments",
  },
);

/* ==========================================================================
   VALIDATION + CALCULATED RISK
========================================================================== */

schema.pre(
  "validate",
  function () {
    /* ----------------------------------------------------------------------
       YIELD
    ---------------------------------------------------------------------- */

    if (
      this.yieldValue != null &&
      !this.yieldUnit
    ) {
      this.invalidate(
        "yieldUnit",
        "Yield unit is required with a value",
      );
    }

    /* ----------------------------------------------------------------------
       ALTERNATIVE WATER SOURCE
    ---------------------------------------------------------------------- */

    if (
      this.alternativeSourceDistanceKm != null &&
      this.alternativeWaterSourceAvailable !==
        "YES"
    ) {
      this.invalidate(
        "alternativeSourceDistanceKm",
        "Alternative source distance is only applicable when an alternative Water Source is available",
      );
    }

    if (
      this.alternativeWaterSourceAvailable ===
        "YES" &&
      this.alternativeSourceDistanceKm ==
        null
    ) {
      this.invalidate(
        "alternativeSourceDistanceKm",
        "Alternative source distance is required when an alternative Water Source is available",
      );
    }

    /* ----------------------------------------------------------------------
       RISK SCORE
    ---------------------------------------------------------------------- */

    if (
      Number.isInteger(
        this.likelihood,
      ) &&
      Number.isInteger(
        this.impact,
      )
    ) {
      const score =
        this.likelihood *
        this.impact;

      this.riskScore =
        score;

      if (score >= 17) {
        this.riskCategory =
          "CRITICAL";
      } else if (
        score >= 10
      ) {
        this.riskCategory =
          "HIGH";
      } else if (
        score >= 5
      ) {
        this.riskCategory =
          "MODERATE";
      } else {
        this.riskCategory =
          "LOW";
      }
    } else {
      /*
       * Historical records created before
       * risk scoring existed may not have
       * likelihood / impact.
       */
      this.riskScore =
        undefined;

      this.riskCategory =
        undefined;
    }
  },
);

/* ==========================================================================
   INDEXES
========================================================================== */

schema.index({
  waterPoint: 1,
  assessmentDate: -1,
  _id: -1,
});

schema.index({
  riskCategory: 1,
  assessmentDate: -1,
});

schema.index({
  actionPriority: 1,
  actionStatus: 1,
});

schema.index({
  createdBy: 1,
  assessmentDate: -1,
});

/* ==========================================================================
   MODEL
========================================================================== */

module.exports =
  mongoose.model(
    "WaterPointAssessment",
    schema,
  );