// backend/modules/energy/energyProject.js
const mongoose = require("mongoose");


const WaterachievementSchema = new mongoose.Schema(
  {
    title: { type: String},   // e.g. “Baseline survey”
    detail: { type: String },                  // optional description
    progress: { type: Number, default: 0 },    // % if you need progress
  },
  { _id: false }                               // don’t create sub-ids unless you want them
);

const PhotoSchema = new mongoose.Schema(
  {
    Image: { type: String}   
       
  },
  { _id: false }                               
);

const WaterProjectSchema = new mongoose.Schema(
  {
    title: { type: String, unique: true, trim: true },
    desc: { type: String,  },
    overview: { type: String },

    // Images
    coverImage: { type: String, required: true },     // main image
    objectiveImage: { type: String },                 // optional second image
    GeographicImage: { type: String },                 // optional second image
    
    // Text sections
    geogrpahic: { type: String },
    objective: { type: String },
    componentTitle: { type: String },
    componentOne: { type: String},
    componentTwo: { type: String },
    componentThree: { type: String },
    componentFour: { type: String},

    // stake holder
    StackeholderDesc:{type:String},
    stackeHolder1: { type: String},  //logo1
     stack1Title:{type:String},
    stack1desc:{type:String},
    stakeHolder2: { type: String },                 // logo 2
     stack2Title:{type:String},
    stack2desc:{type:String},
    stakeHolder3: { type: String }, 
     stack3Title:{type:String},
    stack3desc:{type:String},                // logo 3
    stakeHolder4: { type: String },                 // logo 4
    // stakeholder inputs
   
   
    achievements: [WaterachievementSchema],
    Photos: [PhotoSchema],
        
  },
  { timestamps: true }
);

// 



module.exports = mongoose.model("waterProject", WaterProjectSchema);
