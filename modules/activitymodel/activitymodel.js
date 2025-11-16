// models/Activity.js
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    activityTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // Date of the activity/report – e.g. "16th October 2025"
    activityDate: {
      type: Date,
      required: true,
    },
    reportType: {
      type: String,
      enum: [
        "Activity Report",
        "Monthly Report",
        "Quarter Report",
        "Assessment Report",
      ],
      default: "Activity Report",
    },

    submittedByName: {
      type: String,
      required: true,
      trim: true,
      default: "Abdisalan Haji Aden",
    },
    submittedByPosition: {
      type: String,
      required: true,
      trim: true,
      default: "Energy Director",
    },
    submittedByInstitution: {
      type: String,
      required: true,
      trim: true,
      default: "Ministry of Energy and Water Resources – Jubaland State",
    },

    // Cover photo (just URL for now) + caption
    coverPhotoUrl: {
      type: String,
      trim: true,
    },
    coverPhotoCaption: {
      type: String,
      trim: true,
    },

    introduction: {
      type: String,
      required: true,
    },
    objectives: {
      type: String,
      required: true,
    },
    methodology: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    achievement: {
      type: String,
      required: true,
    },
    challenges: {
      type: String,
      required: true,
    },
    recommendations: {
      type: String,
      required: true,
    },
    conclusion: {
      type: String,
      required: true,
    },

    // Can be free text: list of annexes, photos, attendance sheet, etc.
    annexes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
