const mongoose = require("mongoose");

const dailyPageAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "website_daily_page_analytics",
  },
);

dailyPageAnalyticsSchema.index(
  {
    date: 1,
    path: 1,
  },
  {
    unique: true,
  },
);

dailyPageAnalyticsSchema.index({
  date: 1,
  views: -1,
});

module.exports = mongoose.model(
  "DailyPageAnalytics",
  dailyPageAnalyticsSchema,
);