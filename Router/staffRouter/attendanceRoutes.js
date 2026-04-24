const router = require("express").Router();
const {
  scanFingerprint,
  getToday,
  getSummary,syncZKTeco,getReport,getAbsentToday,syncFromDevice,getAbsentRange
} = require("../../controller/staffCotroller/attendanceController");

router.post("/scan", scanFingerprint);
router.get("/today", getToday);
router.get("/summary", getSummary);
router.get("/zkteco/sync", syncZKTeco);
router.get("/report", getReport);
router.get("/absent-today", getAbsentToday);
router.post("/sync", syncFromDevice);
router.get("/absent-range", getAbsentRange);

module.exports = router;