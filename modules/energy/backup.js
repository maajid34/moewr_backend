// // backend/modules/energy/energyProject.js
// const mongoose = require("mongoose");


// const achievementSchema = new mongoose.Schema(
//   {
//     title: { type: String},   // e.g. “Baseline survey”
//     detail: { type: String },                  // optional description
//     progress: { type: Number, default: 0 },    // % if you need progress
//   },
//   { _id: false }                               // don’t create sub-ids unless you want them
// );

// const energyProjectSchema = new mongoose.Schema(
//   {
//     title: { type: String, unique: true, trim: true },
//     desc: { type: String,  },
//     overview: { type: String },

//     // Images
//     coverImage: { type: String, required: true },     // main image
//     objectiveImage: { type: String },                 // optional second image
//     GeographicImage: { type: String },                 // optional second image

//     // Text sections
//     geogrpahic: { type: String },
//     objective: { type: String },
//     componentTitle: { type: String },
//     componentOne: { type: String},
//     componentTwo: { type: String },
//     componentThree: { type: String },
//     componentFour: { type: String},

//     // stake holder
//     stackeHolder1: { type: String},  //logo1
//     stakeHolder2: { type: String },                 // logo 2
//     stakeHolder3: { type: String },                 // logo 3
//     stakeHolder4: { type: String },                 // logo 4


//     achievements: [achievementSchema],
 
//   },
//   { timestamps: true }
// );

// // 



// module.exports = mongoose.model("EnergyProject", energyProjectSchema);
