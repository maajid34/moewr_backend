// routes/achievementRoutes.js
const express = require("express");
const router = express.Router();

const {
  createAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement,
} = require("../../controller/summaryControlls/summarycontroll");

router.post("/", createAchievement);
router.get("/", getAchievements);
router.put("/:id", updateAchievement);
router.delete("/:id", deleteAchievement);

module.exports = router;