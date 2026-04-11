const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetNo: {
      type: Number,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tagNumber: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    donor: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    responsiblePerson: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
