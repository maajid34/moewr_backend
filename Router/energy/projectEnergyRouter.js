const express = require("express");
const projectEnergyCntrl = require("../../controller/energy/energyProjectCntrl");
// const uploadImage = require("../../middleWare/aploadImage");
const {
  uploadBuffer
} = require("../../middleWare/aploadImage");

const AdminLogin = require("../../controller/login/loginCntrl");
const { verifyToken, isAdmin } = require("../../middleWare/Auth");

const router = express.Router();



router.post("/createProjectEnergy/EnergyProject",
   uploadBuffer.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "objectiveImage", maxCount: 1 },
    { name: "GeographicImage", maxCount: 1 },

    // Accept BOTH names for logo #1 to avoid human error
    { name: "stackeHolder1", maxCount: 1 }, // schema typo

    { name: "stakeHolder2", maxCount: 1 },
    { name: "stakeHolder3", maxCount: 1 },
    { name: "stakeHolder4", maxCount: 1 },
     // Photos (appendable)
    { name: "photos", maxCount: 20 },
    { name: "Photos", maxCount: 20 },
  ]),
  projectEnergyCntrl.createProjectEnergy
);

router.get("/readProjectEnergy/EnergyProject", 
  // verifyToken,
  // isAdmin,
   projectEnergyCntrl.readProjectEnergy);
router.get("/readProjectEnergySingal/EnergyProject/:id",
  //  verifyToken,
  //  isAdmin,
  projectEnergyCntrl.readSignleProjectEnergy);
router.get("/readProjectEnergyStage",
  //  verifyToken,
  // isAdmin,
   projectEnergyCntrl.readStageProjectEnergy);

// update 
router.patch(
  "/UpdateEnergyProject/energy/:id",
  verifyToken,
  isAdmin,
  uploadBuffer.fields([
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
  projectEnergyCntrl.updateEnergyProject
);

// DELETE whole project
router.delete("/DeleteEnergyProject/energy/:id",  verifyToken,
  isAdmin,projectEnergyCntrl.deleteEnergyProject);

// Achievements---------------------------
router.post("/createAchiev/:id/achievements",  
  // verifyToken,
  // isAdmin,
   projectEnergyCntrl.addAchievement);
router.get("/createAchiev/:id/achievements",verifyToken, projectEnergyCntrl.getAchievements); // ✅ beddel

// update and delete achiements
router.patch(
  "/UpdateEnergyAchiev/:id/achievements/:index",
  // verifyToken,
  // isAdmin,
  projectEnergyCntrl.updateEnergyAchievement
);

// delete
router.delete(
  "/DeleteEnergyAchiev/:id/achievements/:index",
  // verifyToken,
  // isAdmin,
  projectEnergyCntrl.deleteEnergyAchievement
);


// readsingal achievments
router.get(
  "/ReadSingalEnergyAchiev/:id/achievements/:index",
  verifyToken,
  // isAdmin,
  projectEnergyCntrl.readSingleEnergyAchievement
);


// -------------------achiemnets

// admin login
router.post("/createAdmin", AdminLogin.createAdmin);
router.post("/customerLogin", AdminLogin.AminLogin);




// project photos ==========================
router.post(
  "/energyProject/:id/photos",
  uploadBuffer.fields([{ name: "photos", maxCount: 20 }, { name: "Photos", maxCount: 20 }]),
   verifyToken,
  // isAdmin,
  projectEnergyCntrl.PostProjectPhotos
);

router.put(
  "/energyProject/:id/photos",
  uploadBuffer.fields([{ name: "photos", maxCount: 20 }, { name: "Photos", maxCount: 20 }]),
   verifyToken,
   isAdmin,
  projectEnergyCntrl.UpdateProjectPhotos
);


// 
router.get("/ReadEnergyProjectPhoto/:id/photos",
  //  verifyToken,
  // isAdmin,
   projectEnergyCntrl.ReadProjectPhotos);

router.delete("/energyProject/:id/photos",
   verifyToken,
  isAdmin, 
  projectEnergyCntrl.DeleteProjectPhoto);

module.exports = router;



// All backend finished waxba kuuma harin waa tijaabisay xata