// const WaterProject = require("../../modules/water/waterProject");
// const mongoose = require("mongoose")
// // Create
// const createProjectWater = async (req, res) => {
//   try {
//     const files = req.files || {};
//     const coverFile = files.coverImage?.[0] || req.file; // support single() too
//     const objectiveFile = files.objectiveImage?.[0];
//      const GeographicImageFile = files.GeographicImage?.[0];
//     const holder1File = files.stackeHolder1?.[0] 
//     const holder2File = files.stakeHolder2?.[0];
//     const holder3File = files.stakeHolder3?.[0];
//     const holder4File = files.stakeHolder4?.[0]

//     // Accept achievements from either `achievements` or `achievementTitle`
//     let achievementsInput = req.body.achievements || req.body.achievementTitle || [];
//     if (typeof achievementsInput === "string") {
//       try { achievementsInput = JSON.parse(achievementsInput); } catch { achievementsInput = []; }
//     }
//     if (!Array.isArray(achievementsInput)) achievementsInput = [];

//     const project = new WaterProject({
//       title: req.body.title,
//       desc: req.body.desc,
//       overview: req.body.overview,
//       coverImage: coverFile ? (coverFile.filename || coverFile.path) : "",
//       objectiveImage: objectiveFile ? (objectiveFile.filename || objectiveFile.path) : "",
//         GeographicImage: GeographicImageFile ? (GeographicImageFile.filename || GeographicImageFile.path) : "",
//         stackeHolder1: holder1File ? (holder1File.filename || holder1File.path) : "",
//       stakeHolder2: holder2File ? (holder2File.filename || holder2File.path) : "",
//       stakeHolder3: holder3File ? (holder3File.filename || holder3File.path) : "",
//       stakeHolder4: holder4File ? (holder4File.filename || holder4File.path) : "",
//       objective: req.body.objective,
//        geogrpahic: req.body.geogrpahic,
//       componentTitle: req.body.componentTitle,
//       componentOne: req.body.componentOne,
//       componentTwo: req.body.componentTwo,
//       componentThree: req.body.componentThree,
//       componentFour: req.body.componentFour,
//       achievements: achievementsInput, // ✅ store in the correct field
//     });

//     const saved = await project.save();
//     res.status(201).json(saved);
//   } catch (err) {
//     console.error("createProjectEnergy error:", err);
//     res.status(500).json({ message: "Failed to create project" });
//   }
// };

// // Read all
// const readProjectWater = async (req, res) => {
//   try {
//     const projects = await WaterProject.find();
//     res.json(projects);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch projects" });
//   }
// };

// // Read single
// const readSignleProjectWater = async (req, res) => {
//   try {
//     const doc = await WaterProject.findById(req.params.id);
//     if (!doc) return res.status(404).json({ message: "Project not found" });
//     res.json(doc);
//   } catch (err) {
//     console.error("readSignleProjectEnergy error:", err);
//     res.status(500).json({ message: "Failed to fetch project" });
//   }
// };

// // update
// // const updateWaterProject = async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     if (!mongoose.isValidObjectId(id)) {
// //       return res.status(400).json({ error: "Invalid project id format" });
// //     }

// //     // Support multer .fields() or .single()
// //     const files = req.files || {};
// //     const coverFile = files.coverImage?.[0] || req.file; // single() fallback
// //     const objectiveFile = files.objectiveImage?.[0];
// //     const holder1File = files.stackeHolder1?.[0] ;
// //     const holder2File = files.stakeHolder2?.[0];
// //     const holder3File = files.stakeHolder3?.[0];
// //     const holder4File = files.stakeHolder4?.[0];

// //     // Build safe update object (exclude achievements)
// //     const update = {};
// //     const fields = [
// //       "title",
// //       "desc",
// //       "overview",
// //       "objective",
// //       "componentTitle",
// //       "componentOne",
// //       "componentTwo",
// //       "componentThree",
// //       "componentFour",
// //       "stackeHolder1",
// //       "stakeHolder2",
// //       "stakeHolder3",
// //       "stakeHolder4",
// //     ];

// //     for (const f of fields) {
// //       if (req.body[f] !== undefined) update[f] = req.body[f];
// //     }

// //     if (coverFile) update.coverImage = coverFile.filename || coverFile.path || "";
// //     if (objectiveFile) update.objectiveImage = objectiveFile.filename || objectiveFile.path || "";
// //       if (holder1File) {
// //       update.stackeHolder1 = holder1File.filename || holder1File.path || "";
// //     }
// //     if (holder2File) {
// //       update.stakeHolder2 = holder2File.filename || holder2File.path || "";
// //     }
// //     if (holder3File) {
// //       update.stakeHolder3 = holder3File.filename || holder3File.path || "";
// //     }
// //     if (holder4File) {
// //       update.stakeHolder4 = holder4File.filename || holder4File.path || "";
// //     }

// //     const project = await WaterProject.findByIdAndUpdate(id, update, {
// //       new: true,
// //       runValidators: true,
// //       // projection: "-achievements", // uncomment if you want to exclude achievements from response
// //     });

// //     if (!project) return res.status(404).json({ message: "Project not found" });

// //     return res.json({ message: "Water project updated", project });
// //   } catch (err) {
// //     console.error("updateWaterProject error:", err);
// //     return res.status(500).json({ error: "Failed to update water project" });
// //   }
// // };

// // update
// const updateWaterProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     // ✅ Always have a safe body object
//     const body = req.body || {};

//     // Support multer .fields() or .single()
//     const files = req.files || {};
//     const coverFile = files.coverImage?.[0] || req.file; // single() fallback
//     const objectiveFile = files.objectiveImage?.[0];
//      const GeographicImageFile = files.GeographicImage?.[0];
//     const holder1File = files.stackeHolder1?.[0];
//     const holder2File = files.stakeHolder2?.[0];
//     const holder3File = files.stakeHolder3?.[0];
//     const holder4File = files.stakeHolder4?.[0];

//     // Build safe update object (exclude achievements)
//     const update = {};
//     const fields = [
//       "title",
//       "desc",
//       "overview",
//       "objective",
//        "geogrpahic",
//       "componentTitle",
//       "componentOne",
//       "componentTwo",
//       "componentThree",
//       "componentFour",
//       "stackeHolder1",
//       "stakeHolder2",
//       "stakeHolder3",
//       "stakeHolder4",
//     ];

//     // ✅ Use `body` instead of `req.body`
//     for (const f of fields) {
//       if (body[f] !== undefined) update[f] = body[f];
//     }

//     if (coverFile) update.coverImage = coverFile.filename || coverFile.path || "";
//     if (objectiveFile) update.objectiveImage = objectiveFile.filename || objectiveFile.path || "";
//     if (GeographicImageFile) update.  GeographicImage = GeographicImageFile.filename || GeographicImageFile.path || "";
//     if (holder1File) update.stackeHolder1 = holder1File.filename || holder1File.path || "";
//     if (holder2File) update.stakeHolder2 = holder2File.filename || holder2File.path || "";
//     if (holder3File) update.stakeHolder3 = holder3File.filename || holder3File.path || "";
//     if (holder4File) update.stakeHolder4 = holder4File.filename || holder4File.path || "";

//     const project = await WaterProject.findByIdAndUpdate(id, update, {
//       new: true,
//       runValidators: true,
//     });

//     if (!project) return res.status(404).json({ message: "Project not found" });

//     return res.json({ message: "Water project updated", project });
//   } catch (err) {
//     console.error("updateWaterProject error:", err);
//     return res.status(500).json({ error: "Failed to update water project" });
//   }
// };




//  // Delete a WaterProject (entire document)
 
//  const deleteWaterProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     const deleted = await WaterProject.findByIdAndDelete(id);
//     if (!deleted) return res.status(404).json({ message: "Project not found" });

//     return res.json({ message: "Water project deleted successfully" });
//   } catch (err) {
//     console.error("deleteWaterProject error:", err);
//     return res.status(500).json({ error: "Failed to delete water project" });
//   }
// };




// //==============================================================

// // Add one achievement
// const addAchievement = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, detail, progress } = req.body;

//     const project = await WaterProject.findById(id);
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     if (!Array.isArray(project.achievements)) {
//       project.achievements = [];
//       project.markModified("achievements"); // si Mongoose u arko beddelka
//     }

//     project.achievements.push({
//       title,
//       detail,
//       ...(progress !== undefined ? { progress } : {}),
//     });

//     await project.save();
//     return res.status(201).json(project.achievements);
//   } catch (err) {
//     console.error("addAchievement error:", err);
//     return res.status(500).json({ error: "Failed to add achievement" });
//   }
// };

// // Get achievements
// const getAchievements = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const project = await WaterProject.findById(id, "title achievements");
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     return res.json({ title: project.title, achievements: project.achievements || [] });
//   } catch (err) {
//     console.error("getAchievements error:", err);
//     return res.status(500).json({ error: "Failed to fetch achievements" });
//   }
// };       



// // 
//  const updateAchievement = async (req, res) => {
//   try {
//     const { id, index } = req.params;
//     const { title, detail, progress } = req.body;

//     const project = await WaterProject.findById(id);
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     if (!Array.isArray(project.achievements) || !project.achievements[index]) {
//       return res.status(404).json({ message: "Achievement not found" });
//     }

//     if (title !== undefined) project.achievements[index].title = title.trim();
//     if (detail !== undefined) project.achievements[index].detail = detail.trim();
//     if (progress !== undefined) project.achievements[index].progress = Number(progress);

//     await project.save();
//     res.json({ message: "Achievement updated", achievement: project.achievements[index] });
//   } catch (err) {
//     console.error("updateAchievement error:", err);
//     res.status(500).json({ error: "Failed to update achievement" });
//   }
// };

// // DELETE – remove achievement by index
// // DELETE – remove a single achievement by index
// const deleteAchievement = async (req, res) => {
//   try {
//     const { id, index } = req.params;

//     // Validate index is a number
//     const idx = parseInt(index, 10);
//     if (isNaN(idx)) {
//       return res.status(400).json({ error: "Achievement index must be a number" });
//     }

//     // Find project (get only achievements)
//     const project = await WaterProject.findById(id, "achievements");
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     if (!Array.isArray(project.achievements) || idx < 0 || idx >= project.achievements.length) {
//       return res.status(404).json({ message: "Achievement not found" });
//     }

//     // Remove the achievement
//     project.achievements.splice(idx, 1);
//     await project.save();

//     return res.json({
//       message: "Achievement deleted successfully",
//       achievements: project.achievements,
//     });
//   } catch (err) {
//     console.error("deleteAchievement error:", err);
//     return res.status(500).json({ error: "Failed to delete achievement" });
//   }
// };


// // read singal Achiemnets
//  const readSingleAchievement = async (req, res) => {
//   try {
//     const { id, index } = req.params;

//     // Validate project id
//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     // Validate index
//     const idx = parseInt(index, 10);
//     if (isNaN(idx) || idx < 0) {
//       return res.status(400).json({ error: "Achievement index must be a non-negative number" });
//     }

//     // Fetch project with only title & achievements
//     const project = await WaterProject.findById(id, "title achievements");
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     if (!Array.isArray(project.achievements) || idx >= project.achievements.length) {
//       return res.status(404).json({ message: "Achievement not found" });
//     }

//     const achievement = project.achievements[idx];

//     return res.json({
//       projectId: project._id,
//       projectTitle: project.title,
//       index: idx,
//       achievement, // e.g. { title, detail, progress }
//     });
//   } catch (err) {
//     console.error("readSingleAchievement error:", err);
//     return res.status(500).json({ error: "Failed to fetch achievement" });
//   }
// };

// module.exports = { deleteAchievement };




// module.exports = {
//   createProjectWater,
//   readProjectWater,
//   readSignleProjectWater,
//   deleteWaterProject,
//   updateWaterProject,
//   addAchievement,
//   getAchievements,
//   updateAchievement,
//   deleteAchievement,
//   readSingleAchievement
  
// };
