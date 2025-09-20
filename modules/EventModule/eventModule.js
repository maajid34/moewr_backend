

const mongoose = require("mongoose");
const EventProjectSchema = new mongoose.Schema(
  {
    title: { type: String, unique: true, trim: true },
    ministry: { type: String },
    description: { type: String},


    // Images
    coverImage: { type: String, required: true },     // main image
    objectiveImage: { type: String },                 // optional second image

    // Text sections
    moreDescription: { type: String },
    

 
  },
  { timestamps: true }
);




module.exports = mongoose.model("Event", EventProjectSchema);