const express = require("express");
const projectWaterCntrl = require("../../controller/water/waterCntrlProject");
const uploadImage = require("../../middleWare/aploadImage");
// const AdminLogin = require("../../controller/login/loginCntrl");
const { verifyToken, isAdmin } = require("../../middleWare/Auth");

const router = express.Router();

router.post(
  "/createProjectWater/waterProject",
  uploadImage.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "objectiveImage", maxCount: 1 },
      { name: "GeographicImage", maxCount: 1 },
     { name: "stackeHolder1", maxCount: 1 }, // schema typo

    { name: "stakeHolder2", maxCount: 1 },
    { name: "stakeHolder3", maxCount: 1 },
    { name: "stakeHolder4", maxCount: 1 },
     { name: "photos", maxCount: 20 },
    { name: "Photos", maxCount: 20 },
  ]),
  projectWaterCntrl.createProjectWater
);

router.get("/readProjectWater/waterProject", projectWaterCntrl.readProjectWater);
router.get("/readProjectWaterSingal/waterProject/:id",projectWaterCntrl.readSignleProjectWater);
// PATCH: update water project (no achievements touched)
// router.patch("/UpdateWaterProject/waterProject/:id", verifyToken, isAdmin, projectWaterCntrl.updateWaterProject);
router.patch(
  "/UpdateWaterProject/waterProject/:id",
  // verifyToken,
  // isAdmin,
  uploadImage.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "objectiveImage", maxCount: 1 },
    { name: "GeographicImage", maxCount: 1 },
    { name: "stackeHolder1", maxCount: 1 },
    { name: "stakeHolder2", maxCount: 1 },
    { name: "stakeHolder3", maxCount: 1 },
    { name: "stakeHolder4", maxCount: 1 },
     { name: "photos", maxCount: 20 },
    { name: "Photos", maxCount: 20 },
  ]),
  projectWaterCntrl.updateWaterProject
);

// DELETE: delete water project
router.delete("/DeleteWaterProject/waterProject/:id", 
  // verifyToken, isAdmin,
   projectWaterCntrl.deleteWaterProject);
// Achievements  =========================================================================
router.post("/createWaterAchiev/:id/achievements", projectWaterCntrl.addAchievement);
router.get("/createWaterAchiev/:id/achievements",verifyToken,isAdmin, projectWaterCntrl.getAchievements); // ✅ beddel
// Update a single achievement (by its index)
router.put("/Update/:id/achievements/:index", projectWaterCntrl.updateAchievement);

// Delete one achievement (by its index)
router.delete("/Delete/:id/achievements/:index", projectWaterCntrl.deleteAchievement);
// readsingal achievments
router.get("/ReadSigngalWaterAchiev/:id/achievements/:index",
  //  verifyToken, isAdmin,
    projectWaterCntrl.readSingleAchievement);


// // admin login
// router.post("/createAdmin/Admin",AdminLogin.createAdmin)
// router.post("/customerLogin/Admin",AdminLogin.AminLogin)


router.post(
  "/WaterProject/:id/photos",
  uploadImage.fields([{ name: "photos", maxCount: 20 }, { name: "Photos", maxCount: 20 }]),
  projectWaterCntrl.PostProjectPhotos
);

router.put(
  "/WaterProject/:id/photos",
  uploadImage.fields([{ name: "photos", maxCount: 20 }, { name: "Photos", maxCount: 20 }]),
  projectWaterCntrl.UpdateProjectPhotos
);


// 
router.get("/ReadWaterProjectPhoto/:id/photos", projectWaterCntrl.ReadProjectPhotos);

router.delete("/DeleteWaterProject/:id/photos", projectWaterCntrl.DeleteProjectPhoto);

module.exports = router;



// all backens finished waana wada tijaabisay only delete baa kuu haray