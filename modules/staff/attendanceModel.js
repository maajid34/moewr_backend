const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: { type: Date },
    status: {
      type: String,
      enum: ["Present", "Late"],
      default: "Present",
    },
    source: { type: String, default: "fingerprint" }, // audit
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);