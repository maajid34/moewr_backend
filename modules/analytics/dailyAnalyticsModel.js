const mongoose = require("mongoose");

const dailyAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },

    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "website_daily_analytics",
  },
);

module.exports = mongoose.model(
  "DailyAnalytics",
  dailyAnalyticsSchema,
);