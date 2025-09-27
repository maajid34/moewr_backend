const WaterProject = require("../../modules/water/waterProject");
const { makeObjectKey, putImageToR2, buildPublicUrl } = require("../../middleWare/aploadImage");

const mongoose = require("mongoose")
// Create
// const createProjectWater = async (req, res) => {
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

// water latst with upload



const createProjectWater = async (req, res) => {
  try {
    // Normalize req.files → { field: [files] }
    let filesByField;
    if (Array.isArray(req.files)) {
      filesByField = {};
      for (const f of req.files) (filesByField[f.fieldname] ||= []).push(f);
    } else {
      filesByField = req.files || {};
    }

    const coverFile      = filesByField.coverImage?.[0];
    const objectiveFile  = filesByField.objectiveImage?.[0];
    const geographicFile = filesByField.GeographicImage?.[0];

    // accept both spellings for stakeholder #1
    const holder1File = (filesByField.stackeHolder1?.[0] || filesByField.stakeHolder1?.[0]) || undefined;
    const holder2File = filesByField.stakeHolder2?.[0];
    const holder3File = filesByField.stakeHolder3?.[0];
    const holder4File = filesByField.stakeHolder4?.[0];

    if (!coverFile) return res.status(400).json({ message: "coverImage file is required" });

    const uploadOne = async (file, folder) => {
      const key = makeObjectKey(file.originalname, folder);
      await putImageToR2(file.buffer, file.mimetype, key);
      return buildPublicUrl(key);
    };

    // Upload single-image fields
    const coverUrl      = await uploadOne(coverFile, "water/cover");
    const objectiveUrl  = objectiveFile  ? await uploadOne(objectiveFile,  "water/objective")  : undefined;
    const geographicUrl = geographicFile ? await uploadOne(geographicFile, "water/geographic") : undefined;

    const holder1Url = holder1File ? await uploadOne(holder1File, "water/stakeholders") : undefined;
    const holder2Url = holder2File ? await uploadOne(holder2File, "water/stakeholders") : undefined;
    const holder3Url = holder3File ? await uploadOne(holder3File, "water/stakeholders") : undefined;
    const holder4Url = holder4File ? await uploadOne(holder4File, "water/stakeholders") : undefined;

    // Photos (accept both "photos" and "Photos")
    const photoFiles = [...(filesByField.photos || []), ...(filesByField.Photos || [])];
    const Photos = [];
    for (const f of photoFiles) {
      const k = makeObjectKey(f.originalname, "water/photos");
      await putImageToR2(f.buffer, f.mimetype, k);
      Photos.push({ Image: buildPublicUrl(k) });
    }

    // Build payload (store URLs)
    const payload = {
      title: (req.body.title || "").trim(),
      desc: req.body.desc,
      overview: req.body.overview,
      
      coverImage: coverUrl,
      objectiveImage: objectiveUrl,
      GeographicImage: geographicUrl,
       
      stackeHolder1: holder1Url,  // keep legacy field name if your schema uses it
      stakeHolder2:  holder2Url,
      stakeHolder3:  holder3Url,
   
      stakeHolder4:  holder4Url,

      objective: req.body.objective,
      geogrpahic: req.body.geogrpahic,
      componentTitle: req.body.componentTitle,
      componentOne: req.body.componentOne,
      componentTwo: req.body.componentTwo,
      componentThree: req.body.componentThree,
      componentFour: req.body.componentFour,
      StackeholderDesc:req.body.StackeholderDesc,
        stack1Title:req.body.stack1Title,
         stack1desc:req.body.stack1desc,
          stack2Title:req.body.stack2Title,
      stack2desc:req.body.stack2desc,
         stack3Title:req.body.stack3Title,
      stack3desc:req.body.stack3desc,

      // achievements (array or JSON string)
      achievements: (() => {
        let a = req.body.achievements ?? req.body.achievementTitle ?? [];
        if (typeof a === "string") { try { a = JSON.parse(a); } catch { a = []; } }
        return Array.isArray(a) ? a : [];
      })(),

      Photos,
    };

    const saved = await new WaterProject(payload).save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("createWaterProject error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Title already exists" });
    }
    return res.status(500).json({ message: "Failed to create water project" });
  }
};



// Read all
const readProjectWater = async (req, res) => {
  try {
    const projects = await WaterProject.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// Read single
const readSignleProjectWater = async (req, res) => {
  try {
    const doc = await WaterProject.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Project not found" });
    res.json(doc);
  } catch (err) {
    console.error("readSignleProjectEnergy error:", err);
    res.status(500).json({ message: "Failed to fetch project" });
  }
};



// update
// const updateWaterProject = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({ error: "Invalid project id format" });
//     }

//     const files = req.files || {};
//     const coverFile = files.coverImage?.[0] || req.file;
//     const objectiveFile = files.objectiveImage?.[0];
//     const geographicFile = files.GeographicImage?.[0];

//     const holder1File = files.stackeHolder1?.[0];
//     const holder2File = files.stakeHolder2?.[0];
//     const holder3File = files.stakeHolder3?.[0];
//     const holder4File = files.stakeHolder4?.[0];

//     // optional incoming photos to append
//     const photoFiles = files.photos || files.Photos || [];
//     const photosToAppend = photoFiles.map(f => ({ Image: f.filename || f.path }));

//     // Build safe update doc (don’t touch achievements here)
//     const update = {};
//     const fields = [
//       "title","desc","overview",
//       "objective","geogrpahic",
//       "componentTitle","componentOne","componentTwo","componentThree","componentFour",
//       "stackeHolder1","stakeHolder2","stakeHolder3","stakeHolder4",
//     ];
//     for (const f of fields) {
//       if (req.body[f] !== undefined) update[f] = req.body[f];
//     }

//     if (coverFile)      update.coverImage     = coverFile.filename     || coverFile.path     || "";
//     if (objectiveFile)  update.objectiveImage = objectiveFile.filename || objectiveFile.path || "";
//     if (geographicFile) update.GeographicImage = geographicFile.filename || geographicFile.path || "";
//     if (holder1File)    update.stackeHolder1  = holder1File.filename   || holder1File.path   || "";
//     if (holder2File)    update.stakeHolder2   = holder2File.filename   || holder2File.path   || "";
//     if (holder3File)    update.stakeHolder3   = holder3File.filename   || holder3File.path   || "";
//     if (holder4File)    update.stakeHolder4   = holder4File.filename   || holder4File.path   || "";

//     // If no photos to append, do a normal update
//     if (!photosToAppend.length) {
//       const project = await EnergyProject.findByIdAndUpdate(id, update, {
//         new: true,
//         runValidators: true,
//         projection: "-achievements",
//       });
//       if (!project) return res.status(404).json({ message: "Project not found" });
//       return res.json({ message: "Project updated", project });
//     }

//     // If there ARE photos, append them in the same call
//     const project = await EnergyProject.findByIdAndUpdate(
//       id,
//       {
//         ...(Object.keys(update).length ? { $set: update } : {}),
//         $push: { Photos: { $each: photosToAppend } },
//       },
//       { new: true, runValidators: true, projection: "-achievements" }
//     );

//     if (!project) return res.status(404).json({ message: "Project not found" });
//     return res.json({ message: "Project updated (photos appended)", project });
//   } catch (err) {
//     console.error("updateEnergyProject error:", err);
//     return res.status(500).json({ error: "Failed to update project" });
//   }
// };


// update latest
const updateWaterProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id format" });
    }

    // Normalize req.files → { field: [files] }
    let filesByField;
    if (Array.isArray(req.files)) {
      filesByField = {};
      for (const f of req.files) (filesByField[f.fieldname] ||= []).push(f);
    } else {
      filesByField = req.files || {};
    }

    const coverFile      = filesByField.coverImage?.[0];
    const objectiveFile  = filesByField.objectiveImage?.[0];
    const geographicFile = filesByField.GeographicImage?.[0];

    // accept both spellings for stakeholder #1
    const holder1File = (filesByField.stackeHolder1?.[0] || filesByField.stakeHolder1?.[0]) || undefined;
    const holder2File = filesByField.stakeHolder2?.[0];
    const holder3File = filesByField.stakeHolder3?.[0];
    const holder4File = filesByField.stakeHolder4?.[0];

    const uploadOne = async (file, folder) => {
      const key = makeObjectKey(file.originalname, folder);
      await putImageToR2(file.buffer, file.mimetype, key);
      return buildPublicUrl(key);
    };

    // Text fields (only update what client sends)
    const set = {};
    const fields = [
      "title","desc","overview",
      "objective","geogrpahic",
      "componentTitle","componentOne","componentTwo","componentThree","componentFour","StackeholderDesc",
      "stack1Title","stack1desc","stack2Title","stack2desc","stack3Title","stack3desc",
    ];
    for (const f of fields) if (req.body[f] !== undefined) set[f] = req.body[f];

    // Upload any new single-file fields and set URLs
    if (coverFile)      set.coverImage      = await uploadOne(coverFile,      "water/cover");
    if (objectiveFile)  set.objectiveImage  = await uploadOne(objectiveFile,  "water/objective");
    if (geographicFile) set.GeographicImage = await uploadOne(geographicFile, "water/geographic");

    if (holder1File) set.stackeHolder1 = await uploadOne(holder1File, "water/stakeholders");
    if (holder2File) set.stakeHolder2  = await uploadOne(holder2File, "water/stakeholders");
    if (holder3File) set.stakeHolder3  = await uploadOne(holder3File, "water/stakeholders");
    if (holder4File) set.stakeHolder4  = await uploadOne(holder4File, "water/stakeholders");

    // Photos append (accept "photos" and "Photos")
    const photoFiles = [...(filesByField.photos || []), ...(filesByField.Photos || [])];
    const photosToAppend = [];
    for (const f of photoFiles) {
      const url = await uploadOne(f, "water/photos");
      photosToAppend.push({ Image: url });
    }

    // Build final update doc
    const updateDoc = {};
    if (Object.keys(set).length) updateDoc.$set = set;
    if (photosToAppend.length) updateDoc.$push = { Photos: { $each: photosToAppend } };

    // If nothing to update, return current
    if (!Object.keys(updateDoc).length) {
      const current = await WaterProject.findById(id);
      if (!current) return res.status(404).json({ message: "Project not found" });
      return res.json({ message: "No changes supplied", project: current });
    }

    const project = await WaterProject.findByIdAndUpdate(id, updateDoc, {
      new: true,
      runValidators: true,
      projection: "-achievements",
    });

    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ message: "Project updated", project });
  } catch (err) {
    console.error("updateWaterProject error:", err);
    return res.status(500).json({ message: "Failed to update water project" });
  }
};


 // Delete a WaterProject (entire document)
 
 const deleteWaterProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    const deleted = await WaterProject.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });

    return res.json({ message: "Water project deleted successfully" });
  } catch (err) {
    console.error("deleteWaterProject error:", err);
    return res.status(500).json({ error: "Failed to delete water project" });
  }
};




//==============================================================

// Add one achievement
const addAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, progress } = req.body;

    const project = await WaterProject.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!Array.isArray(project.achievements)) {
      project.achievements = [];
      project.markModified("achievements"); // si Mongoose u arko beddelka
    }

    project.achievements.push({
      title,
      detail,
      ...(progress !== undefined ? { progress } : {}),
    });

    await project.save();
    return res.status(201).json(project.achievements);
  } catch (err) {
    console.error("addAchievement error:", err);
    return res.status(500).json({ error: "Failed to add achievement" });
  }
};

// Get achievements
const getAchievements = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await WaterProject.findById(id, "title achievements");
    if (!project) return res.status(404).json({ message: "Project not found" });

    return res.json({ title: project.title, achievements: project.achievements || [] });
  } catch (err) {
    console.error("getAchievements error:", err);
    return res.status(500).json({ error: "Failed to fetch achievements" });
  }
};       



// 
 const updateAchievement = async (req, res) => {
  try {
    const { id, index } = req.params;
    const { title, detail, progress } = req.body;

    const project = await WaterProject.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!Array.isArray(project.achievements) || !project.achievements[index]) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    if (title !== undefined) project.achievements[index].title = title.trim();
    if (detail !== undefined) project.achievements[index].detail = detail.trim();
    if (progress !== undefined) project.achievements[index].progress = Number(progress);

    await project.save();
    res.json({ message: "Achievement updated", achievement: project.achievements[index] });
  } catch (err) {
    console.error("updateAchievement error:", err);
    res.status(500).json({ error: "Failed to update achievement" });
  }
};

// DELETE – remove achievement by index
// DELETE – remove a single achievement by index
const deleteAchievement = async (req, res) => {
  try {
    const { id, index } = req.params;

    // Validate index is a number
    const idx = parseInt(index, 10);
    if (isNaN(idx)) {
      return res.status(400).json({ error: "Achievement index must be a number" });
    }

    // Find project (get only achievements)
    const project = await WaterProject.findById(id, "achievements");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!Array.isArray(project.achievements) || idx < 0 || idx >= project.achievements.length) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    // Remove the achievement
    project.achievements.splice(idx, 1);
    await project.save();

    return res.json({
      message: "Achievement deleted successfully",
      achievements: project.achievements,
    });
  } catch (err) {
    console.error("deleteAchievement error:", err);
    return res.status(500).json({ error: "Failed to delete achievement" });
  }
};


// read singal Achiemnets
 const readSingleAchievement = async (req, res) => {
  try {
    const { id, index } = req.params;

    // Validate project id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    // Validate index
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: "Achievement index must be a non-negative number" });
    }

    // Fetch project with only title & achievements
    const project = await WaterProject.findById(id, "title achievements");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!Array.isArray(project.achievements) || idx >= project.achievements.length) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    const achievement = project.achievements[idx];

    return res.json({
      projectId: project._id,
      projectTitle: project.title,
      index: idx,
      achievement, // e.g. { title, detail, progress }
    });
  } catch (err) {
    console.error("readSingleAchievement error:", err);
    return res.status(500).json({ error: "Failed to fetch achievement" });
  }
};


// project photos============================================================

const PostProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id format" });

    const files = req.files || {};
    const photoFiles = files.photos || files.Photos || (req.file ? [req.file] : []);
    if (!photoFiles.length) return res.status(400).json({ error: "No photos uploaded" });

    const photosToAppend = photoFiles.map(f => ({ Image: f.filename || f.path }));

    const project = await WaterProject.findByIdAndUpdate(
      id,
      { $push: { Photos: { $each: photosToAppend } } },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ message: "Photos appended", project });
  } catch (err) {
    console.error("appendProjectPhotos error:", err);
    res.status(500).json({ error: "Failed to append photos" });
  }
};

// Replace ALL photos (dangerous): overwrites Photos[]
const UpdateProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id format" });

    const files = req.files || {};
    const photoFiles = files.photos || files.Photos || (req.file ? [req.file] : []);
    const newPhotos = photoFiles.map(f => ({ Image: f.filename || f.path }));

    const project = await WaterProject.findByIdAndUpdate(
      id,
      { $set: { Photos: newPhotos } },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ message: "Photos replaced", project });
  } catch (err) {
    console.error("replaceProjectPhotos error:", err);
    res.status(500).json({ error: "Failed to replace photos" });
  }
};

// read
const ReadProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) 
      return res.status(400).json({ error: "Invalid project id format" });

    const project = await WaterProject.findById(id, "Photos");
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ photos: project.Photos });
  } catch (err) {
    console.error("ReadProjectPhotos error:", err);
    res.status(500).json({ error: "Failed to read photos" });
  }
};


// delet
const DeleteProjectPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { index, imageName } = req.body;

    if (!mongoose.isValidObjectId(id)) 
      return res.status(400).json({ error: "Invalid project id format" });

    const project = await WaterProject.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (typeof index === "number" && project.Photos[index]) {
      // remove by array index
      project.Photos.splice(index, 1);
    } else if (imageName) {
      // remove by matching filename/path
      project.Photos = project.Photos.filter(p => p.Image !== imageName);
    } else {
      return res.status(400).json({ error: "Provide either index or imageName" });
    }

    await project.save();
    res.json({ message: "Photo deleted", photos: project.Photos });
  } catch (err) {
    console.error("DeleteProjectPhoto error:", err);
    res.status(500).json({ error: "Failed to delete photo" });
  }
};


module.exports = { deleteAchievement };




module.exports = {
  DeleteProjectPhoto,
  ReadProjectPhotos,
  UpdateProjectPhotos,
  PostProjectPhotos,
  createProjectWater,
  readProjectWater,
  readSignleProjectWater,
  deleteWaterProject,
  updateWaterProject,
  addAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement,
  readSingleAchievement
  
};
