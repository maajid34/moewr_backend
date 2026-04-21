const router = require("express").Router();
const {
  scanFingerprint,
  getToday,
  getSummary,
} = require("../../controller/staffCotroller/attendanceController");

router.post("/scan", scanFingerprint);
router.get("/today", getToday);
router.get("/summary", getSummary);

module.exports = router;