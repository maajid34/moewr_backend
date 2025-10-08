const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    sn: { type: Number, required: true, index: true }, // serial number for the table row
    item: { type: String, required: true, trim: true },
    unit: {
      type: String,
      required: true,
   
    },
    stockIn: { type: Number, required: true, min: 0 },
    stockOut: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Virtual: currentBalance = stockIn - stockOut
inventoryItemSchema.virtual("currentBalance").get(function () {
  const balance = (this.stockIn || 0) - (this.stockOut || 0);
  return balance < 0 ? 0 : balance;
});

// include virtuals in JSON
inventoryItemSchema.set("toJSON", { virtuals: true });
inventoryItemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
