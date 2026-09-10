const express = require("express");
const {
  authenticateAccount,
  allowRoles,
} = require("../../middleWare/authenticateAccount");
const v = require("../../controller/waterPoint/validation");
const { handleError } = require("../../controller/waterPoint/common");
const region = require("../../controller/waterPoint/regionController");
const district = require("../../controller/waterPoint/districtController");
const point = require("../../controller/waterPoint/waterPointController");
const assessment = require("../../controller/waterPoint/assessmentController");
const report = require("../../controller/waterPoint/waterPointReportController");
const file = require("../../controller/waterPoint/fileController");
const router = express.Router();
router.use(require("../../controller/waterPoint/initialize"));
router.use(authenticateAccount, allowRoles("admin", "water"));
router.use(express.json({ limit: "256kb" }));
const admin = allowRoles("admin"),
  body = (s) => v.validate(s),
  query = (s) => v.validate(s, "query");
router.post("/regions", admin, body(v.regionCreate), region.create);
router.get("/regions", query(v.masterQuery), region.list);
router.get("/regions/:id", v.params("id"), region.get);
router.put(
  "/regions/:id",
  admin,
  v.params("id"),
  body(v.regionUpdate),
  region.update,
);
router.delete("/regions/:id", admin, v.params("id"), region.remove);
router.post("/districts", admin, body(v.districtCreate), district.create);
router.get("/districts", query(v.districtQuery), district.list);
router.get("/districts/:id", v.params("id"), district.get);
router.put(
  "/districts/:id",
  admin,
  v.params("id"),
  body(v.regionUpdate),
  district.update,
);
router.delete("/districts/:id", admin, v.params("id"), district.remove);
router.post("/water-points", body(v.pointCreate), point.create);
router.get("/water-points", query(v.pointQuery), point.list);
router.get("/water-points/:id", v.params("id"), point.get);
router.put(
  "/water-points/:id",
  v.params("id"),
  body(v.pointUpdate),
  point.update,
);
router.delete("/water-points/:id", admin, v.params("id"), point.remove);
router.get("/gis", query(v.gisQuery), point.gis);
router.get("/nearby", query(v.nearbyQuery), point.nearby);
router.get("/summary", query(v.reportQuery), report.summary);
router.post(
  "/water-points/:id/assessments",
  v.params("id"),
  body(v.assessmentCreate),
  assessment.create,
);
router.get(
  "/water-points/:id/assessments",
  v.params("id"),
  query(v.historyQuery),
  assessment.list,
);
router.get(
  "/assessments/:assessmentId",
  v.params("assessmentId"),
  assessment.get,
);
router.post(
  "/water-points/:id/photos",
  v.params("id"),
  file.uploadSlot,
  file.parse("photos"),
  file.upload("photos"),
);
router.post(
  "/water-points/:id/documents",
  v.params("id"),
  file.uploadSlot,
  file.parse("documents"),
  file.upload("documents"),
);
router.post(
  "/assessments/:assessmentId/photos",
  v.params("assessmentId"),
  file.uploadSlot,
  file.parse("photos"),
  file.upload("photos", true),
);
router.get(
  "/water-points/:id/files/:fileId",
  v.params("id", "fileId"),
  file.download(false),
);
router.get(
  "/assessments/:assessmentId/files/:fileId",
  v.params("assessmentId", "fileId"),
  file.download(true),
);
router.use((_req, res) =>
  res
    .status(404)
    .json({
      success: false,
      message: "Registry endpoint not found",
      errors: [],
    }),
);
router.use(handleError);
module.exports = router;
