// const EnergyProject = require("../../modules/energy/energyProject");
// const mongoose = require("mongoose")


// // const createProjectEnergy = async (req, res) => {
// //   try {
// //     const files = req.files || {};
// //     const coverFile = files.coverImage?.[0] || req.file; // support single() too
// //     const objectiveFile = files.objectiveImage?.[0];
// //     const GeographicImageFile = files.GeographicImage?.[0];
// //      const holder1File = files.stackeHolder1?.[0] 
// //     const holder2File = files.stakeHolder2?.[0];
// //     const holder3File = files.stakeHolder3?.[0];
// //     const holder4File = files.stakeHolder4?.[0];

// //     // Accept achievements from either `achievements` or `achievementTitle`
// //     let achievementsInput = req.body.achievements || req.body.achievementTitle || [];
// //     if (typeof achievementsInput === "string") {
// //       try { achievementsInput = JSON.parse(achievementsInput); } catch { achievementsInput = []; }
// //     }
// //     if (!Array.isArray(achievementsInput)) achievementsInput = [];

// //     const project = new EnergyProject({
// //       title: req.body.title,
// //       desc: req.body.desc,
// //       overview: req.body.overview,
// //       coverImage: coverFile ? (coverFile.filename || coverFile.path) : "",
// //       objectiveImage: objectiveFile ? (objectiveFile.filename || objectiveFile.path) : "",
// //       GeographicImage: GeographicImageFile ? (GeographicImageFile.filename || GeographicImageFile.path) : "",
// //       stackeHolder1: holder1File ? (holder1File.filename || holder1File.path) : "",
// //       stakeHolder2: holder2File ? (holder2File.filename || holder2File.path) : "",
// //       stakeHolder3: holder3File ? (holder3File.filename || holder3File.path) : "",
// //       stakeHolder4: holder4File ? (holder4File.filename || holder4File.path) : "",
// //       objective: req.body.objective,
// //       geogrpahic: req.body.geogrpahic,
// //       componentTitle: req.body.componentTitle,
// //       componentOne: req.body.componentOne,
// //       componentTwo: req.body.componentTwo,
// //       componentThree: req.body.componentThree,
// //       componentFour: req.body.componentFour,
// //       achievements: achievementsInput, // ✅ store in the correct field
// //     });

// //     const saved = await project.save();
// //     res.status(201).json(saved);
// //   } catch (err) {
// //     console.error("createProjectEnergy error:", err);
// //     res.status(500).json({ message: "Failed to create project" });
// //   }
// // };



// // Read all


// // controllers/energy.controller.js
// const mongoose = require("mongoose");
// const EnergyProject = require("../../modules/energy/energyProject");

// const createProjectEnergy = async (req, res) => {
//   try {
//     const files = req.files || {};
//     const coverFile = files.coverImage?.[0] || req.file; // support single()
//     const objectiveFile = files.objectiveImage?.[0];
//     const geographicFile = files.GeographicImage?.[0];

//     // stakeholder logos (keep both spellings for backward-compat)
//     const holder1File = files.stackeHolder1?.[0];
//     const holder2File = files.stakeHolder2?.[0];
//     const holder3File = files.stakeHolder3?.[0];
//     const holder4File = files.stakeHolder4?.[0];

//     // Parse achievements
//     let achievementsInput = req.body.achievements || req.body.achievementTitle || [];
//     if (typeof achievementsInput === "string") {
//       try { achievementsInput = JSON.parse(achievementsInput); } catch { achievementsInput = []; }
//     }
//     if (!Array.isArray(achievementsInput)) achievementsInput = [];

//     // Parse Photos from files (accept "photos" or "Photos")
//     const photoFiles = files.photos || files.Photos || [];
//     const Photos = photoFiles.map(f => ({ Image: f.filename || f.path }));

//     const project = new EnergyProject({
//       title: req.body.title,
//       desc: req.body.desc,
//       overview: req.body.overview,

//       coverImage: coverFile ? (coverFile.filename || coverFile.path) : "",
//       objectiveImage: objectiveFile ? (objectiveFile.filename || objectiveFile.path) : "",
//       GeographicImage: geographicFile ? (geographicFile.filename || geographicFile.path) : "",

//       stackeHolder1: holder1File ? (holder1File.filename || holder1File.path) : "",
//       stakeHolder2: holder2File ? (holder2File.filename || holder2File.path) : "",
//       stakeHolder3: holder3File ? (holder3File.filename || holder3File.path) : "",
//       stakeHolder4: holder4File ? (holder4File.filename || holder4File.path) : "",

//       objective: req.body.objective,
//       geogrpahic: req.body.geogrpahic,
//       componentTitle: req.body.componentTitle,
//       componentOne: req.body.componentOne,
//       componentTwo: req.body.componentTwo,
//       componentThree: req.body.componentThree,
//       componentFour: req.body.componentFour,

//       achievements: achievementsInput,
//       Photos, // ⬅️ save photos array if sent
//     });

//     // Ensure coverImage present (schema requires it)
//     if (!project.coverImage) {
//       return res.status(400).json({ message: "coverImage is required" });
//     }

//     const saved = await project.save();
//     res.status(201).json(saved);
//   } catch (err) {
//     console.error("createProjectEnergy error:", err);
//     // Handle duplicate title nicely
//     if (err?.code === 11000) {
//       return res.status(409).json({ message: "Title already exists" });
//     }
//     res.status(500).json({ message: "Failed to create project" });
//   }
// };



// const readProjectEnergy = async (req, res) => {
//   try {
//     const projects = await EnergyProject.find();
//     res.json(projects);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch projects" });
//   }
// };

// // Read single
// const readSignleProjectEnergy = async (req, res) => {
//   try {
//     const doc = await EnergyProject.findById(req.params.id);
//     if (!doc) return res.status(404).json({ message: "Project not found" });
//     res.json(doc);
//   } catch (err) {
//     console.error("readSignleProjectEnergy error:", err);
//     res.status(500).json({ message: "Failed to fetch project" });
//   }
// };


// // update
//  const updateEnergyProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     // Handle optional file uploads (multer: fields or single)
//     const files = req.files || {};
//     const coverFile = files.coverImage?.[0] || req.file; // support single()
//     const objectiveFile = files.objectiveImage?.[0];
//      const GeographicImageFile = files.GeographicImage?.[0];
//      const holder1File = files.stackeHolder1?.[0] ;
//     const holder2File = files.stakeHolder2?.[0];
//     const holder3File = files.stakeHolder3?.[0];
//     const holder4File = files.stakeHolder4?.[0];

//     // Build a safe update object (ignore achievements entirely)
//     const update = {};
//     const fields = [
//       "title",
//       "desc",
//       "overview",
//       "objective",
//       "geogrpahic",
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

//     for (const f of fields) {
//       if (req.body[f] !== undefined) update[f] = req.body[f];
//     }

//     if (coverFile) {
//       update.coverImage = coverFile.filename || coverFile.path || "";
//     }
//     if (objectiveFile) {
//       update.objectiveImage = objectiveFile.filename || objectiveFile.path || "";
//     }
//     if (GeographicImageFile) {
//       update.  GeographicImage = GeographicImageFile.filename || GeographicImageFile.path || "";
//     }
//     if (holder1File) {
//       update.stackeHolder1 = holder1File.filename || holder1File.path || "";
//     }
//     if (holder2File) {
//       update.stakeHolder2 = holder2File.filename || holder2File.path || "";
//     }
//     if (holder3File) {
//       update.stakeHolder3 = holder3File.filename || holder3File.path || "";
//     }
//     if (holder4File) {
//       update.stakeHolder4 = holder4File.filename || holder4File.path || "";
//     }

//     const project = await EnergyProject.findByIdAndUpdate(id, update, {
//       new: true,
//       runValidators: true,
//       projection: "-achievements", // explicitly exclude achievements if you want
//     });

//     if (!project) return res.status(404).json({ message: "Project not found" });

//     return res.json({ message: "Project updated", project });
//   } catch (err) {
//     console.error("updateEnergyProject error:", err);
//     return res.status(500).json({ error: "Failed to update project" });
//   }
// };

// /**

//  * Delete an EnergyProject (entire document)
//  */
// const deleteEnergyProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     const deleted = await EnergyProject.findByIdAndDelete(id);
//     if (!deleted) return res.status(404).json({ message: "Project not found" });

//     return res.json({ message: "Project deleted successfully" });
//   } catch (err) {
//     console.error("deleteEnergyProject error:", err);
//     return res.status(500).json({ error: "Failed to delete project" });
//   }
// };


// // Add one achievement
// const addAchievement = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, detail, progress } = req.body;

//     const project = await EnergyProject.findById(id);
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
//     const project = await EnergyProject.findById(id, "title achievements");
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     return res.json({ title: project.title, achievements: project.achievements || [] });
//   } catch (err) {
//     console.error("getAchievements error:", err);
//     return res.status(500).json({ error: "Failed to fetch achievements" });
//   }
// };


// // update achiements
// // PATCH /createEnergyAchiev/:id/achievements/:index
//  const updateEnergyAchievement = async (req, res) => {
//   try {
//     const { id, index } = req.params;
//     const { title, detail, progress } = req.body;

//     // Validate ObjectId
//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     const project = await EnergyProject.findById(id);
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     // Make sure achievements is an array and index is valid
//     if (!Array.isArray(project.achievements)) {
//       return res.status(404).json({ message: "No achievements found" });
//     }

//     const idx = parseInt(index, 10);
//     if (isNaN(idx) || idx < 0 || idx >= project.achievements.length) {
//       return res.status(404).json({ message: "Achievement index out of range" });
//     }

//     const achievement = project.achievements[idx];

//     if (title !== undefined) achievement.title = title;
//     if (detail !== undefined) achievement.detail = detail;
//     if (progress !== undefined) {
//       const n = Number(progress);
//       if (Number.isNaN(n)) {
//         return res.status(400).json({ error: "progress must be a number" });
//       }
//       achievement.progress = n;
//     }

//     project.achievements[idx] = achievement;
//     await project.save();

//     return res.json({
//       message: "Achievement updated successfully",
//       achievement,
//       achievements: project.achievements,
//     });
//   } catch (err) {
//     console.error("updateEnergyAchievement error:", err);
//     return res.status(500).json({ error: "Failed to update achievement" });
//   }
// };



// // Delete Achievments
// // DELETE /createEnergyAchiev/:id/achievements/:index
//  const deleteEnergyAchievement = async (req, res) => {
//   try {
//     const { id, index } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     const idx = parseInt(index, 10);
//     if (isNaN(idx) || idx < 0) {
//       return res.status(400).json({ error: "Achievement index must be a non-negative number" });
//     }

//     const project = await EnergyProject.findById(id);
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     if (!Array.isArray(project.achievements) || idx >= project.achievements.length) {
//       return res.status(404).json({ message: "Achievement not found" });
//     }

//     // Remove achievement at index
//     project.achievements.splice(idx, 1);
//     await project.save();

//     return res.json({
//       message: "Achievement deleted successfully",
//       achievements: project.achievements,
//     });
//   } catch (err) {
//     console.error("deleteEnergyAchievement error:", err);
//     return res.status(500).json({ error: "Failed to delete achievement" });
//   }
// };



// // readsingal Achievments
// const readSingleEnergyAchievement = async (req, res) => {
//   try {
//     const { id, index } = req.params;

//     // Validate project id
//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     // Validate index
//     const idx = parseInt(index, 10);
//     if (Number.isNaN(idx) || idx < 0) {
//       return res.status(400).json({ error: "Achievement index must be a non-negative number" });
//     }

//     // Fetch only what's needed
//     const project = await EnergyProject.findById(id, "title achievements");
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     if (!Array.isArray(project.achievements) || idx >= project.achievements.length) {
//       return res.status(404).json({ message: "Achievement not found" });
//     }

//     const achievement = project.achievements[idx];

//     return res.json({
//       projectId: project._id,
//       projectTitle: project.title,
//       index: idx,
//       total: project.achievements.length,
//       achievement, // { title, detail, progress, ... }
//     });
//   } catch (err) {
//     console.error("readSingleEnergyAchievement error:", err);
//     return res.status(500).json({ error: "Failed to read achievement" });
//   }
// };


// module.exports = {
//   createProjectEnergy,
//   readProjectEnergy,
//   readSignleProjectEnergy,
//   addAchievement,
//   getAchievements,
//   updateEnergyAchievement,
//   deleteEnergyAchievement,
//   readSingleEnergyAchievement,
//   updateEnergyProject,
//   deleteEnergyProject
// };


// // acheivments Done