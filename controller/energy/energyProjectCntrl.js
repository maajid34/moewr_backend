const EnergyProject = require("../../modules/energy/energyProject");
const { makeObjectKey, putImageToR2, buildPublicUrl } = require("../../middleWare/aploadImage");
const mongoose = require("mongoose")




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


// lates createproject



const createProjectEnergy = async (req, res) => {
  try {
    // Normalize req.files to { field: [files] }
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

    if (!coverFile) {
      return res.status(400).json({ message: "coverImage file is required" });
    }

    // --- Upload required/optional images to R2 ---
    const coverKey = makeObjectKey(coverFile.originalname, "energy/cover");
    await putImageToR2(coverFile.buffer, coverFile.mimetype, coverKey);
    const coverUrl = buildPublicUrl(coverKey);

    let objectiveUrl, geographicUrl, holder1Url, holder2Url, holder3Url, holder4Url;

    if (objectiveFile) {
      const k = makeObjectKey(objectiveFile.originalname, "energy/objective");
      await putImageToR2(objectiveFile.buffer, objectiveFile.mimetype, k);
      objectiveUrl = buildPublicUrl(k);
    }

    if (geographicFile) {
      const k = makeObjectKey(geographicFile.originalname, "energy/geographic");
      await putImageToR2(geographicFile.buffer, geographicFile.mimetype, k);
      geographicUrl = buildPublicUrl(k);
    }

    if (holder1File) {
      const k = makeObjectKey(holder1File.originalname, "energy/stakeholders");
      await putImageToR2(holder1File.buffer, holder1File.mimetype, k);
      holder1Url = buildPublicUrl(k);
    }
    if (holder2File) {
      const k = makeObjectKey(holder2File.originalname, "energy/stakeholders");
      await putImageToR2(holder2File.buffer, holder2File.mimetype, k);
      holder2Url = buildPublicUrl(k);
    }
    if (holder3File) {
      const k = makeObjectKey(holder3File.originalname, "energy/stakeholders");
      await putImageToR2(holder3File.buffer, holder3File.mimetype, k);
      holder3Url = buildPublicUrl(k);
    }
    if (holder4File) {
      const k = makeObjectKey(holder4File.originalname, "energy/stakeholders");
      await putImageToR2(holder4File.buffer, holder4File.mimetype, k);
      holder4Url = buildPublicUrl(k);
    }

    // Photos (accept both "photos" and "Photos")
    const photoFiles = [...(filesByField.photos || []), ...(filesByField.Photos || [])];
    const Photos = [];
    for (const f of photoFiles) {
      const k = makeObjectKey(f.originalname, "energy/photos");
      await putImageToR2(f.buffer, f.mimetype, k);
      Photos.push({ Image: buildPublicUrl(k) });
    }

    // --- Build payload (store URLs) ---
    const payload = {
      title: (req.body.title || "").trim(),
      desc: req.body.desc,
      overview: req.body.overview,

      coverImage: coverUrl,
      objectiveImage: objectiveUrl,
      GeographicImage: geographicUrl,

      stackeHolder1: holder1Url, // keep legacy field name in schema
      stakeHolder2: holder2Url,
      stakeHolder3: holder3Url,
      stakeHolder4: holder4Url,

      objective: req.body.objective,
      geogrpahic: req.body.geogrpahic,
      componentTitle: req.body.componentTitle,
      componentOne: req.body.componentOne,
      componentTwo: req.body.componentTwo,
      componentThree: req.body.componentThree,
      componentFour: req.body.componentFour,

      // achievements (array or JSON string)
      achievements: (() => {
        let a = req.body.achievements ?? req.body.achievementTitle ?? [];
        if (typeof a === "string") { try { a = JSON.parse(a); } catch { a = []; } }
        return Array.isArray(a) ? a : [];
      })(),

      Photos,
    };

    const saved = await new EnergyProject(payload).save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("createProjectEnergy error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Title already exists" });
    }
    return res.status(500).json({ message: "Failed to create project" });
  }
};



const readProjectEnergy = async (req, res) => {
  try {
    const projects = await EnergyProject.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// Read single
const readSignleProjectEnergy = async (req, res) => {
  try {
    const doc = await EnergyProject.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Project not found" });
    res.json(doc);
  } catch (err) {
    console.error("readSignleProjectEnergy error:", err);
    res.status(500).json({ message: "Failed to fetch project" });
  }
};


// update
// const updateEnergyProject = async (req, res) => {
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

// lates update
const updateEnergyProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id format" });
    }

    // --- normalize req.files -> { field: [files] } ---
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

    // --- text fields (update only what was provided) ---
    const set = {};
    const fields = [
      "title","desc","overview",
      "objective","geogrpahic",
      "componentTitle","componentOne","componentTwo","componentThree","componentFour",
    ];
    for (const f of fields) if (req.body[f] !== undefined) set[f] = req.body[f];

    // --- upload any new single-file fields ---
    if (coverFile)      set.coverImage      = await uploadOne(coverFile,      "energy/cover");
    if (objectiveFile)  set.objectiveImage  = await uploadOne(objectiveFile,  "energy/objective");
    if (geographicFile) set.GeographicImage = await uploadOne(geographicFile, "energy/geographic");

    if (holder1File) set.stackeHolder1 = await uploadOne(holder1File, "energy/stakeholders");
    if (holder2File) set.stakeHolder2  = await uploadOne(holder2File, "energy/stakeholders");
    if (holder3File) set.stakeHolder3  = await uploadOne(holder3File, "energy/stakeholders");
    if (holder4File) set.stakeHolder4  = await uploadOne(holder4File, "energy/stakeholders");

    // --- photos append (accept both "photos" and "Photos") ---
    const photoFiles = [...(filesByField.photos || []), ...(filesByField.Photos || [])];
    const photosToAppend = [];
    for (const f of photoFiles) {
      const url = await uploadOne(f, "energy/photos");
      photosToAppend.push({ Image: url });
    }

    // --- build update document ---
    const updateDoc = {};
    if (Object.keys(set).length) updateDoc.$set = set;
    if (photosToAppend.length) updateDoc.$push = { Photos: { $each: photosToAppend } };

    // If nothing changed, return current doc
    if (!Object.keys(updateDoc).length) {
      const current = await EnergyProject.findById(id);
      if (!current) return res.status(404).json({ message: "Project not found" });
      return res.json({ message: "No changes supplied", project: current });
    }

    const project = await EnergyProject.findByIdAndUpdate(id, updateDoc, {
      new: true,
      runValidators: true,
      projection: "-achievements",
    });

    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json({ message: "Project updated", project });
  } catch (err) {
    console.error("updateEnergyProject error:", err);
    return res.status(500).json({ message: "Failed to update project" });
  }
};



/**

 * Delete an EnergyProject (entire document)
 */
const deleteEnergyProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    const deleted = await EnergyProject.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });

    return res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("deleteEnergyProject error:", err);
    return res.status(500).json({ error: "Failed to delete project" });
  }
};


// Add one achievement
const addAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, detail, progress } = req.body;

    const project = await EnergyProject.findById(id);
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
    const project = await EnergyProject.findById(id, "title achievements");
    if (!project) return res.status(404).json({ message: "Project not found" });

    return res.json({ title: project.title, achievements: project.achievements || [] });
  } catch (err) {
    console.error("getAchievements error:", err);
    return res.status(500).json({ error: "Failed to fetch achievements" });
  }
};


// update achiements
// PATCH /createEnergyAchiev/:id/achievements/:index
 const updateEnergyAchievement = async (req, res) => {
  try {
    const { id, index } = req.params;
    const { title, detail, progress } = req.body;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    const project = await EnergyProject.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Make sure achievements is an array and index is valid
    if (!Array.isArray(project.achievements)) {
      return res.status(404).json({ message: "No achievements found" });
    }

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= project.achievements.length) {
      return res.status(404).json({ message: "Achievement index out of range" });
    }

    const achievement = project.achievements[idx];

    if (title !== undefined) achievement.title = title;
    if (detail !== undefined) achievement.detail = detail;
    if (progress !== undefined) {
      const n = Number(progress);
      if (Number.isNaN(n)) {
        return res.status(400).json({ error: "progress must be a number" });
      }
      achievement.progress = n;
    }

    project.achievements[idx] = achievement;
    await project.save();

    return res.json({
      message: "Achievement updated successfully",
      achievement,
      achievements: project.achievements,
    });
  } catch (err) {
    console.error("updateEnergyAchievement error:", err);
    return res.status(500).json({ error: "Failed to update achievement" });
  }
};



// Delete Achievments
// DELETE /createEnergyAchiev/:id/achievements/:index
 const deleteEnergyAchievement = async (req, res) => {
  try {
    const { id, index } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: "Achievement index must be a non-negative number" });
    }

    const project = await EnergyProject.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!Array.isArray(project.achievements) || idx >= project.achievements.length) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    // Remove achievement at index
    project.achievements.splice(idx, 1);
    await project.save();

    return res.json({
      message: "Achievement deleted successfully",
      achievements: project.achievements,
    });
  } catch (err) {
    console.error("deleteEnergyAchievement error:", err);
    return res.status(500).json({ error: "Failed to delete achievement" });
  }
};



// readsingal Achievments
const readSingleEnergyAchievement = async (req, res) => {
  try {
    const { id, index } = req.params;

    // Validate project id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    // Validate index
    const idx = parseInt(index, 10);
    if (Number.isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: "Achievement index must be a non-negative number" });
    }

    // Fetch only what's needed
    const project = await EnergyProject.findById(id, "title achievements");
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!Array.isArray(project.achievements) || idx >= project.achievements.length) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    const achievement = project.achievements[idx];

    return res.json({
      projectId: project._id,
      projectTitle: project.title,
      index: idx,
      total: project.achievements.length,
      achievement, // { title, detail, progress, ... }
    });
  } catch (err) {
    console.error("readSingleEnergyAchievement error:", err);
    return res.status(500).json({ error: "Failed to read achievement" });
  }
};



// project photos============================================================

// const PostProjectPhotos = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id format" });

//     const files = req.files || {};
//     const photoFiles = files.photos || files.Photos || (req.file ? [req.file] : []);
//     if (!photoFiles.length) return res.status(400).json({ error: "No photos uploaded" });

//     const photosToAppend = photoFiles.map(f => ({ Image: f.filename || f.path }));

//     const project = await EnergyProject.findByIdAndUpdate(
//       id,
//       { $push: { Photos: { $each: photosToAppend } } },
//       { new: true, runValidators: true }
//     );
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     res.json({ message: "Photos appended", project });
//   } catch (err) {
//     console.error("appendProjectPhotos error:", err);
//     res.status(500).json({ error: "Failed to append photos" });
//   }
// };

const PostProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    // ---- normalize files (array or fields) ----
    let photoFiles = [];
    if (Array.isArray(req.files)) {
      photoFiles = req.files; // upload.array('photos')
    } else if (req.files?.photos) {
      photoFiles = req.files.photos; // upload.fields([{ name: 'photos' }])
    } else if (req.files?.Photos) {
      photoFiles = req.files.Photos;
    } else if (req.file) {
      photoFiles = [req.file];
    }

    if (!photoFiles.length) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    // ---- get a URL for each uploaded file ----
    // If you're using memoryStorage + R2: use buffer/originalname/mimetype
    // Otherwise fall back to existing path/location fields.
    const toUrl = async (f) => {
      // S3-like or disk-like storages with ready-made URLs/paths
      const ready =
        f?.location || f?.Location || f?.path || f?.filepath || f?.url || f?.URL;
      if (ready) return ready; // already a public/serving path

      // memory storage: must upload to R2 (same helpers you use in createProjectEnergy)
      if (f?.buffer && f?.originalname && f?.mimetype) {
        const key = makeObjectKey(f.originalname, "energy/photos");
        await putImageToR2(f.buffer, f.mimetype, key);
        return buildPublicUrl(key); // e.g. "https://r2-bucket/energy/photos/..."
      }

      // some storages provide key/filename only
      if (f?.key || f?.Key || f?.filename) {
        const k = f.key || f.Key || `energy/photos/${f.filename}`;
        // if that key is not public, you could: return buildPublicUrl(k);
        return buildPublicUrl(k);
      }

      return ""; // nothing usable
    };

    const urls = [];
    for (const f of photoFiles) {
      const url = await toUrl(f);
      if (url) urls.push(url);
    }

    if (!urls.length) {
      return res.status(400).json({ error: "Could not resolve file paths for uploads" });
    }

    // ---- persist: your schema uses objects { Image: String } ----
    const docs = urls.map((u) => ({ Image: u }));

    const project = await EnergyProject.findByIdAndUpdate(
      id,
      { $push: { Photos: { $each: docs } } },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ message: "Photos appended", count: docs.length, project });
  } catch (err) {
    console.error("appendEnergyProjectPhotos error:", err);
    return res.status(500).json({ error: "Failed to append photos" });
  }
};

// Replace ALL photos (dangerous): overwrites Photos[]
// const UpdateProjectPhotos = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid project id format" });

//     const files = req.files || {};
//     const photoFiles = files.photos || files.Photos || (req.file ? [req.file] : []);
//     const newPhotos = photoFiles.map(f => ({ Image: f.filename || f.path }));

//     const project = await EnergyProject.findByIdAndUpdate(
//       id,
//       { $set: { Photos: newPhotos } },
//       { new: true, runValidators: true }
//     );
//     if (!project) return res.status(404).json({ message: "Project not found" });

//     res.json({ message: "Photos replaced", project });
//   } catch (err) {
//     console.error("replaceProjectPhotos error:", err);
//     res.status(500).json({ error: "Failed to replace photos" });
//   }
// };

const UpdateProjectPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid project id format" });
    }

    // normalize files
    let photoFiles = [];
    if (Array.isArray(req.files)) {
      photoFiles = req.files; // upload.array('photos')
    } else if (req.files?.photos) {
      photoFiles = req.files.photos;
    } else if (req.files?.Photos) {
      photoFiles = req.files.Photos;
    } else if (req.file) {
      photoFiles = [req.file];
    }

    if (!photoFiles.length) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    // upload each photo to R2 and build URLs
    const uploaded = [];
    for (const f of photoFiles) {
      let url;
      if (f.buffer && f.originalname && f.mimetype) {
        const key = makeObjectKey(f.originalname, "energy/photos");
        await putImageToR2(f.buffer, f.mimetype, key);
        url = buildPublicUrl(key);
      } else if (f.location || f.Location) {
        url = f.location || f.Location;
      } else if (f.path) {
        url = f.path;
      }
      if (url) uploaded.push({ Image: url });
    }

    if (!uploaded.length) {
      return res.status(400).json({ error: "Could not resolve file paths for uploads" });
    }

    // replace old photos with new ones
    const project = await EnergyProject.findByIdAndUpdate(
      id,
      { $set: { Photos: uploaded } },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Photos replaced", count: uploaded.length, project });
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

    const project = await EnergyProject.findById(id, "Photos");
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

    const project = await EnergyProject.findById(id);
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





module.exports = {
  createProjectEnergy,
  readProjectEnergy,
  readSignleProjectEnergy,
  addAchievement,
  getAchievements,
  updateEnergyAchievement,
  deleteEnergyAchievement,
  readSingleEnergyAchievement,
  updateEnergyProject,
  deleteEnergyProject,
  PostProjectPhotos,
  UpdateProjectPhotos,
  DeleteProjectPhoto,
  ReadProjectPhotos
};


// acheivments Done