const router = require("express").Router();
const {
  scanFingerprint,
  getToday,
  getSummary,syncZKTeco
} = require("../../controller/staffCotroller/attendanceController");

router.post("/scan", scanFingerprint);
router.get("/today", getToday);
router.get("/summary", getSummary);
router.get("/zkteco/sync", syncZKTeco);

module.exports = router;