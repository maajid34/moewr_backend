const router = require("express").Router();
const {
  scanFingerprint,
  getToday,
  getSummary,syncZKTeco,getReport
} = require("../../controller/staffCotroller/attendanceController");

router.post("/scan", scanFingerprint);
router.get("/today", getToday);
router.get("/summary", getSummary);
router.get("/zkteco/sync", syncZKTeco);
router.get("/report", getReport);

module.exports = router;