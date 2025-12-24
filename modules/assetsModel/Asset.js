const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetNo: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tagNumber: {
      type: String,
      required: true,
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
