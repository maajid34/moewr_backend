const mongoose = require("mongoose");

const dailyVisitorSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    visitorHash: {
      type: String,
      required: true,
      maxlength: 64,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "website_daily_visitors",
  },
);

dailyVisitorSchema.index(
  {
    date: 1,
    visitorHash: 1,
  },
  {
    unique: true,
  },
);

/*
 * Temporary deduplication data only.
 * MongoDB automatically removes it after expiresAt.
 */
dailyVisitorSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

module.exports = mongoose.model(
  "DailyVisitor",
  dailyVisitorSchema,
);