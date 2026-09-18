// // // const express = require("express");
// // // const {
// // //   authenticateAccount,
// // //   allowRoles,
// // // } = require("../../middleWare/authenticateAccount");
// // // const v = require("../../controller/waterPoint/validation");
// // // const { handleError } = require("../../controller/waterPoint/common");
// // // const region = require("../../controller/waterPoint/regionController");
// // // const district = require("../../controller/waterPoint/districtController");
// // // const point = require("../../controller/waterPoint/waterPointController");
// // // const assessment = require("../../controller/waterPoint/assessmentController");
// // // const report = require("../../controller/waterPoint/waterPointReportController");
// // // const file = require("../../controller/waterPoint/fileController");
// // // const router = express.Router();
// // // router.use(require("../../controller/waterPoint/initialize"));
// // // router.use(authenticateAccount, allowRoles("admin", "water"));
// // // router.use(express.json({ limit: "256kb" }));
// // // const admin = allowRoles("admin"),
// // //   body = (s) => v.validate(s),
// // //   query = (s) => v.validate(s, "query");
// // // router.post("/regions", admin, body(v.regionCreate), region.create);
// // // router.get("/regions", query(v.masterQuery), region.list);
// // // router.get("/regions/:id", v.params("id"), region.get);
// // // router.put(
// // //   "/regions/:id",
// // //   admin,
// // //   v.params("id"),
// // //   body(v.regionUpdate),
// // //   region.update,
// // // );
// // // router.delete("/regions/:id", admin, v.params("id"), region.remove);
// // // router.post("/districts", admin, body(v.districtCreate), district.create);
// // // router.get("/districts", query(v.districtQuery), district.list);
// // // router.get("/districts/:id", v.params("id"), district.get);
// // // router.put(
// // //   "/districts/:id",
// // //   admin,
// // //   v.params("id"),
// // //   body(v.regionUpdate),
// // //   district.update,
// // // );
// // // router.delete("/districts/:id", admin, v.params("id"), district.remove);
// // // router.post("/water-points", body(v.pointCreate), point.create);
// // // router.get("/water-points", query(v.pointQuery), point.list);
// // // router.get("/water-points/:id", v.params("id"), point.get);
// // // router.put(
// // //   "/water-points/:id",
// // //   v.params("id"),
// // //   body(v.pointUpdate),
// // //   point.update,
// // // );
// // // router.delete("/water-points/:id", admin, v.params("id"), point.remove);
// // // router.get("/gis", query(v.gisQuery), point.gis);
// // // router.get("/nearby", query(v.nearbyQuery), point.nearby);
// // // router.get("/summary", query(v.reportQuery), report.summary);
// // // router.post(
// // //   "/water-points/:id/assessments",
// // //   v.params("id"),
// // //   body(v.assessmentCreate),
// // //   assessment.create,
// // // );
// // // router.get(
// // //   "/water-points/:id/assessments",
// // //   v.params("id"),
// // //   query(v.historyQuery),
// // //   assessment.list,
// // // );
// // // router.get(
// // //   "/assessments/:assessmentId",
// // //   v.params("assessmentId"),
// // //   assessment.get,
// // // );
// // // router.post(
// // //   "/water-points/:id/photos",
// // //   v.params("id"),
// // //   file.uploadSlot,
// // //   file.parse("photos"),
// // //   file.upload("photos"),
// // // );
// // // router.post(
// // //   "/water-points/:id/documents",
// // //   v.params("id"),
// // //   file.uploadSlot,
// // //   file.parse("documents"),
// // //   file.upload("documents"),
// // // );
// // // router.post(
// // //   "/assessments/:assessmentId/photos",
// // //   v.params("assessmentId"),
// // //   file.uploadSlot,
// // //   file.parse("photos"),
// // //   file.upload("photos", true),
// // // );
// // // router.get(
// // //   "/water-points/:id/files/:fileId",
// // //   v.params("id", "fileId"),
// // //   file.download(false),
// // // );
// // // router.get(
// // //   "/assessments/:assessmentId/files/:fileId",
// // //   v.params("assessmentId", "fileId"),
// // //   file.download(true),
// // // );
// // // router.use((_req, res) =>
// // //   res
// // //     .status(404)
// // //     .json({
// // //       success: false,
// // //       message: "Registry endpoint not found",
// // //       errors: [],
// // //     }),
// // // );
// // // router.use(handleError);
// // // module.exports = router;


// // const express = require("express");

// // const {
// //   authenticateAccount,
// //   allowRoles,
// // } = require(
// //   "../../middleWare/authenticateAccount",
// // );

// // const v = require(
// //   "../../controller/waterPoint/validation",
// // );

// // const {
// //   handleError,
// // } = require(
// //   "../../controller/waterPoint/common",
// // );

// // const region = require(
// //   "../../controller/waterPoint/regionController",
// // );

// // const district = require(
// //   "../../controller/waterPoint/districtController",
// // );

// // const point = require(
// //   "../../controller/waterPoint/waterPointController",
// // );

// // const assessment = require(
// //   "../../controller/waterPoint/assessmentController",
// // );

// // const report = require(
// //   "../../controller/waterPoint/waterPointReportController",
// // );

// // const file = require(
// //   "../../controller/waterPoint/fileController",
// // );

// // const router = express.Router();

// // /*
// // |--------------------------------------------------------------------------
// // | INITIALIZATION
// // |--------------------------------------------------------------------------
// // */

// // router.use(
// //   require(
// //     "../../controller/waterPoint/initialize",
// //   ),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | AUTHENTICATION
// // |--------------------------------------------------------------------------
// // |
// // | Keep existing roles for now.
// // |
// // | water_assessor will be added after we review
// // | the authentication/role implementation.
// // |
// // */

// // router.use(
// //   authenticateAccount,
// //   allowRoles(
// //     "admin",
// //     "water",
// //   ),
// // );

// // router.use(
// //   express.json({
// //     limit: "256kb",
// //   }),
// // );

// // const admin =
// //   allowRoles("admin");

// // const body = (schema) =>
// //   v.validate(schema);

// // const query = (schema) =>
// //   v.validate(
// //     schema,
// //     "query",
// //   );

// // /*
// // |--------------------------------------------------------------------------
// // | REGIONS
// // |--------------------------------------------------------------------------
// // */

// // router.post(
// //   "/regions",
// //   admin,
// //   body(v.regionCreate),
// //   region.create,
// // );

// // router.get(
// //   "/regions",
// //   query(v.masterQuery),
// //   region.list,
// // );

// // router.get(
// //   "/regions/:id",
// //   v.params("id"),
// //   region.get,
// // );

// // router.put(
// //   "/regions/:id",
// //   admin,
// //   v.params("id"),
// //   body(v.regionUpdate),
// //   region.update,
// // );

// // router.delete(
// //   "/regions/:id",
// //   admin,
// //   v.params("id"),
// //   region.remove,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | DISTRICTS
// // |--------------------------------------------------------------------------
// // */

// // router.post(
// //   "/districts",
// //   admin,
// //   body(v.districtCreate),
// //   district.create,
// // );

// // router.get(
// //   "/districts",
// //   query(v.districtQuery),
// //   district.list,
// // );

// // router.get(
// //   "/districts/:id",
// //   v.params("id"),
// //   district.get,
// // );

// // router.put(
// //   "/districts/:id",
// //   admin,
// //   v.params("id"),
// //   body(v.regionUpdate),
// //   district.update,
// // );

// // router.delete(
// //   "/districts/:id",
// //   admin,
// //   v.params("id"),
// //   district.remove,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | WATER POINTS
// // |--------------------------------------------------------------------------
// // */

// // router.post(
// //   "/water-points",
// //   body(v.pointCreate),
// //   point.create,
// // );

// // router.get(
// //   "/water-points",
// //   query(v.pointQuery),
// //   point.list,
// // );

// // router.get(
// //   "/water-points/:id",
// //   v.params("id"),
// //   point.get,
// // );

// // router.put(
// //   "/water-points/:id",
// //   v.params("id"),
// //   body(v.pointUpdate),
// //   point.update,
// // );

// // router.delete(
// //   "/water-points/:id",
// //   admin,
// //   v.params("id"),
// //   point.remove,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | GIS
// // |--------------------------------------------------------------------------
// // */

// // router.get(
// //   "/gis",
// //   query(v.gisQuery),
// //   point.gis,
// // );

// // router.get(
// //   "/nearby",
// //   query(v.nearbyQuery),
// //   point.nearby,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | REPORTS
// // |--------------------------------------------------------------------------
// // */

// // router.get(
// //   "/summary",
// //   query(v.reportQuery),
// //   report.summary,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | ASSESSMENTS — CREATE
// // |--------------------------------------------------------------------------
// // |
// // | Creates a NEW assessment.
// // | Previous assessments are not overwritten.
// // |
// // */

// // router.post(
// //   "/water-points/:id/assessments",
// //   v.params("id"),
// //   body(v.assessmentCreate),
// //   assessment.create,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | ASSESSMENTS — HISTORY
// // |--------------------------------------------------------------------------
// // */

// // router.get(
// //   "/water-points/:id/assessments",
// //   v.params("id"),
// //   query(v.historyQuery),
// //   assessment.list,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | ASSESSMENTS — LATEST
// // |--------------------------------------------------------------------------
// // |
// // | Example:
// // |
// // | GET
// // | /water-points/:id/assessments/latest
// // |
// // */

// // router.get(
// //   "/water-points/:id/assessments/latest",
// //   v.params("id"),
// //   assessment.latest,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | MY ASSESSMENTS
// // |--------------------------------------------------------------------------
// // |
// // | IMPORTANT:
// // | This route must remain BEFORE:
// // |
// // | /assessments/:assessmentId
// // |
// // | otherwise Express could interpret "mine"
// // | as an assessment ID.
// // |
// // */

// // router.get(
// //   "/assessments/mine",
// //   query(v.historyQuery),
// //   assessment.myAssessments,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | SINGLE ASSESSMENT
// // |--------------------------------------------------------------------------
// // */

// // router.get(
// //   "/assessments/:assessmentId",
// //   v.params("assessmentId"),
// //   assessment.get,
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | WATER POINT PHOTOS
// // |--------------------------------------------------------------------------
// // */

// // router.post(
// //   "/water-points/:id/photos",
// //   v.params("id"),
// //   file.uploadSlot,
// //   file.parse("photos"),
// //   file.upload("photos"),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | WATER POINT DOCUMENTS
// // |--------------------------------------------------------------------------
// // */

// // router.post(
// //   "/water-points/:id/documents",
// //   v.params("id"),
// //   file.uploadSlot,
// //   file.parse("documents"),
// //   file.upload("documents"),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | ASSESSMENT PHOTOS
// // |--------------------------------------------------------------------------
// // */

// // router.post(
// //   "/assessments/:assessmentId/photos",
// //   v.params(
// //     "assessmentId",
// //   ),
// //   file.uploadSlot,
// //   file.parse("photos"),
// //   file.upload(
// //     "photos",
// //     true,
// //   ),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | WATER POINT FILE DOWNLOAD
// // |--------------------------------------------------------------------------
// // */

// // router.get(
// //   "/water-points/:id/files/:fileId",
// //   v.params(
// //     "id",
// //     "fileId",
// //   ),
// //   file.download(false),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | ASSESSMENT FILE DOWNLOAD
// // |--------------------------------------------------------------------------
// // */

// // router.get(
// //   "/assessments/:assessmentId/files/:fileId",
// //   v.params(
// //     "assessmentId",
// //     "fileId",
// //   ),
// //   file.download(true),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | REGISTRY 404
// // |--------------------------------------------------------------------------
// // */

// // router.use(
// //   (_req, res) =>
// //     res
// //       .status(404)
// //       .json({
// //         success: false,
// //         message:
// //           "Registry endpoint not found",
// //         errors: [],
// //       }),
// // );

// // /*
// // |--------------------------------------------------------------------------
// // | ERROR HANDLER
// // |--------------------------------------------------------------------------
// // */

// // router.use(handleError);

// // module.exports = router;


// const express = require("express");

// const {
//   authenticateAccount,
//   allowRoles,
// } = require("../../middleWare/authenticateAccount");

// const v = require("../../controller/waterPoint/validation");

// const {
//   handleError,
// } = require("../../controller/waterPoint/common");

// const region = require("../../controller/waterPoint/regionController");
// const district = require("../../controller/waterPoint/districtController");
// const point = require("../../controller/waterPoint/waterPointController");
// const assessment = require("../../controller/waterPoint/assessmentController");
// const report = require("../../controller/waterPoint/waterPointReportController");
// const file = require("../../controller/waterPoint/fileController");

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | INITIALIZATION
// |--------------------------------------------------------------------------
// */

// router.use(
//   require("../../controller/waterPoint/initialize"),
// );

// /*
// |--------------------------------------------------------------------------
// | AUTHENTICATION
// |--------------------------------------------------------------------------
// |
// | All Registry routes require authentication.
// |
// | Specific permissions are applied route-by-route below.
// |
// */

// router.use(authenticateAccount);

// router.use(
//   express.json({
//     limit: "256kb",
//   }),
// );

// /*
// |--------------------------------------------------------------------------
// | ROLE GROUPS
// |--------------------------------------------------------------------------
// */

// const adminOnly = allowRoles("admin");

// const registryManagers = allowRoles(
//   "admin",
//   "water",
// );

// const assessmentUsers = allowRoles(
//   "admin",
//   "water",
//   "water_assessor",
// );

// const body = (schema) =>
//   v.validate(schema);

// const query = (schema) =>
//   v.validate(schema, "query");

// /*
// |--------------------------------------------------------------------------
// | REGIONS
// |--------------------------------------------------------------------------
// |
// | water_assessor:
// | - may VIEW regions
// | - may NOT create/edit/delete regions
// |
// */

// router.post(
//   "/regions",
//   adminOnly,
//   body(v.regionCreate),
//   region.create,
// );

// router.get(
//   "/regions",
//   assessmentUsers,
//   query(v.masterQuery),
//   region.list,
// );

// router.get(
//   "/regions/:id",
//   assessmentUsers,
//   v.params("id"),
//   region.get,
// );

// router.put(
//   "/regions/:id",
//   adminOnly,
//   v.params("id"),
//   body(v.regionUpdate),
//   region.update,
// );

// router.delete(
//   "/regions/:id",
//   adminOnly,
//   v.params("id"),
//   region.remove,
// );

// /*
// |--------------------------------------------------------------------------
// | DISTRICTS
// |--------------------------------------------------------------------------
// |
// | Assessor needs read access because Water Sources use
// | Region -> District information.
// |
// */

// router.post(
//   "/districts",
//   adminOnly,
//   body(v.districtCreate),
//   district.create,
// );

// router.get(
//   "/districts",
//   assessmentUsers,
//   query(v.districtQuery),
//   district.list,
// );

// router.get(
//   "/districts/:id",
//   assessmentUsers,
//   v.params("id"),
//   district.get,
// );

// router.put(
//   "/districts/:id",
//   adminOnly,
//   v.params("id"),
//   body(v.regionUpdate),
//   district.update,
// );

// router.delete(
//   "/districts/:id",
//   adminOnly,
//   v.params("id"),
//   district.remove,
// );

// /*
// |--------------------------------------------------------------------------
// | WATER POINTS — MANAGEMENT
// |--------------------------------------------------------------------------
// |
// | admin / water:
// | ✅ Create
// | ✅ Update
// |
// | water_assessor:
// | ❌ Create
// | ❌ Update
// |
// */

// router.post(
//   "/water-points",
//   registryManagers,
//   body(v.pointCreate),
//   point.create,
// );

// /*
// |--------------------------------------------------------------------------
// | WATER POINTS — READ
// |--------------------------------------------------------------------------
// |
// | water_assessor must be able to find/select a Water Source
// | before creating an assessment.
// |
// */

// router.get(
//   "/water-points",
//   assessmentUsers,
//   query(v.pointQuery),
//   point.list,
// );

// router.get(
//   "/water-points/:id",
//   assessmentUsers,
//   v.params("id"),
//   point.get,
// );

// router.put(
//   "/water-points/:id",
//   registryManagers,
//   v.params("id"),
//   body(v.pointUpdate),
//   point.update,
// );

// /*
// |--------------------------------------------------------------------------
// | WATER POINT DELETE
// |--------------------------------------------------------------------------
// |
// | Only admin.
// |
// */

// router.delete(
//   "/water-points/:id",
//   adminOnly,
//   v.params("id"),
//   point.remove,
// );

// /*
// |--------------------------------------------------------------------------
// | GIS
// |--------------------------------------------------------------------------
// |
// | Assessor may use GIS/map information to identify a Water Source.
// |
// */

// router.get(
//   "/gis",
//   assessmentUsers,
//   query(v.gisQuery),
//   point.gis,
// );

// router.get(
//   "/nearby",
//   assessmentUsers,
//   query(v.nearbyQuery),
//   point.nearby,
// );

// /*
// |--------------------------------------------------------------------------
// | REGISTRY SUMMARY
// |--------------------------------------------------------------------------
// |
// | Full registry report/summary remains for registry managers.
// |
// */

// router.get(
//   "/summary",
//   registryManagers,
//   query(v.reportQuery),
//   report.summary,
// );

// /*
// |--------------------------------------------------------------------------
// | CREATE ASSESSMENT
// |--------------------------------------------------------------------------
// |
// | admin
// | water
// | water_assessor
// |
// | Every request creates a NEW assessment.
// |
// */

// router.post(
//   "/water-points/:id/assessments",
//   assessmentUsers,
//   v.params("id"),
//   body(v.assessmentCreate),
//   assessment.create,
// );

// /*
// |--------------------------------------------------------------------------
// | ASSESSMENT HISTORY
// |--------------------------------------------------------------------------
// */

// router.get(
//   "/water-points/:id/assessments",
//   assessmentUsers,
//   v.params("id"),
//   query(v.historyQuery),
//   assessment.list,
// );

// /*
// |--------------------------------------------------------------------------
// | LATEST ASSESSMENT
// |--------------------------------------------------------------------------
// |
// | IMPORTANT:
// | Must be declared explicitly before generic assessment routes.
// |
// */

// router.get(
//   "/water-points/:id/assessments/latest",
//   assessmentUsers,
//   v.params("id"),
//   assessment.latest,
// );

// /*
// |--------------------------------------------------------------------------
// | MY ASSESSMENTS
// |--------------------------------------------------------------------------
// |
// | Used later by the Staff Assessment Dashboard.
// |
// */

// router.get(
//   "/assessments/mine",
//   assessmentUsers,
//   query(v.historyQuery),
//   assessment.myAssessments,
// );

// /*
// |--------------------------------------------------------------------------
// | SINGLE ASSESSMENT
// |--------------------------------------------------------------------------
// */

// router.get(
//   "/assessments/:assessmentId",
//   assessmentUsers,
//   v.params("assessmentId"),
//   assessment.get,
// );

// /*
// |--------------------------------------------------------------------------
// | WATER POINT PHOTOS
// |--------------------------------------------------------------------------
// |
// | Profile photos belong to Water Source management.
// | Assessor cannot modify them.
// |
// */

// router.post(
//   "/water-points/:id/photos",
//   registryManagers,
//   v.params("id"),
//   file.uploadSlot,
//   file.parse("photos"),
//   file.upload("photos"),
// );

// /*
// |--------------------------------------------------------------------------
// | WATER POINT DOCUMENTS
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/water-points/:id/documents",
//   registryManagers,
//   v.params("id"),
//   file.uploadSlot,
//   file.parse("documents"),
//   file.upload("documents"),
// );

// /*
// |--------------------------------------------------------------------------
// | ASSESSMENT EVIDENCE / PHOTOS
// |--------------------------------------------------------------------------
// |
// | Assessment users may upload evidence to an assessment.
// |
// */

// router.post(
//   "/assessments/:assessmentId/photos",
//   assessmentUsers,
//   v.params("assessmentId"),
//   file.uploadSlot,
//   file.parse("photos"),
//   file.upload("photos", true),
// );

// /*
// |--------------------------------------------------------------------------
// | ASSESSMENT EVIDENCE
// |--------------------------------------------------------------------------
// |
// | Supports:
// | JPEG
// | PNG
// | PDF
// |
// | Stored in:
// | assessmentDocuments[]
// |
// */

// router.post(
//   "/assessments/:assessmentId/evidence",
//   assessmentUsers,
//   v.params("assessmentId"),
//   file.uploadSlot,
//   file.parse("evidence"),
//   file.upload(
//     "assessmentDocuments",
//     true,
//   ),
// );
// /*
// |--------------------------------------------------------------------------
// | WATER POINT FILE DOWNLOAD
// |--------------------------------------------------------------------------
// */

// router.get(
//   "/water-points/:id/files/:fileId",
//   assessmentUsers,
//   v.params(
//     "id",
//     "fileId",
//   ),
//   file.download(false),
// );

// /*
// |--------------------------------------------------------------------------
// | ASSESSMENT FILE DOWNLOAD
// |--------------------------------------------------------------------------
// */

// router.get(
//   "/assessments/:assessmentId/files/:fileId",
//   assessmentUsers,
//   v.params(
//     "assessmentId",
//     "fileId",
//   ),
//   file.download(true),
// );

// /*
// |--------------------------------------------------------------------------
// | 404
// |--------------------------------------------------------------------------
// */

// router.use((_req, res) =>
//   res.status(404).json({
//     success: false,
//     message: "Registry endpoint not found",
//     errors: [],
//   }),
// );

// /*
// |--------------------------------------------------------------------------
// | ERROR HANDLER
// |--------------------------------------------------------------------------
// */

// router.use(handleError);

// module.exports = router;


const express = require("express");

const {
  authenticateAccount,
  allowRoles,
} = require(
  "../../middleWare/authenticateAccount",
);

const v = require(
  "../../controller/waterPoint/validation",
);

const {
  handleError,
} = require(
  "../../controller/waterPoint/common",
);

const region = require(
  "../../controller/waterPoint/regionController",
);

const district = require(
  "../../controller/waterPoint/districtController",
);

const point = require(
  "../../controller/waterPoint/waterPointController",
);

const assessment = require(
  "../../controller/waterPoint/assessmentController",
);

const report = require(
  "../../controller/waterPoint/waterPointReportController",
);

const assessmentReport = require(
  "../../controller/waterPoint/assessmentReportController",
);

const file = require(
  "../../controller/waterPoint/fileController",
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| INITIALIZATION
|--------------------------------------------------------------------------
*/

router.use(
  require(
    "../../controller/waterPoint/initialize",
  ),
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
|
| Every private Water Registry endpoint
| requires a valid authenticated account.
|
*/

router.use(
  authenticateAccount,
);

router.use(
  express.json({
    limit: "256kb",
  }),
);

/*
|--------------------------------------------------------------------------
| ROLE GROUPS
|--------------------------------------------------------------------------
*/

const adminOnly =
  allowRoles(
    "admin",
  );

const registryManagers =
  allowRoles(
    "admin",
    "water",
  );

const assessmentUsers =
  allowRoles(
    "admin",
    "water",
    "water_assessor",
  );

const body = (
  schema,
) =>
  v.validate(
    schema,
  );

const query = (
  schema,
) =>
  v.validate(
    schema,
    "query",
  );

/*
|--------------------------------------------------------------------------
| REGIONS — CREATE
|--------------------------------------------------------------------------
*/

router.post(
  "/regions",

  adminOnly,

  body(
    v.regionCreate,
  ),

  region.create,
);

/*
|--------------------------------------------------------------------------
| REGIONS — LIST
|--------------------------------------------------------------------------
*/

router.get(
  "/regions",

  assessmentUsers,

  query(
    v.masterQuery,
  ),

  region.list,
);

/*
|--------------------------------------------------------------------------
| REGIONS — SINGLE
|--------------------------------------------------------------------------
*/

router.get(
  "/regions/:id",

  assessmentUsers,

  v.params("id"),

  region.get,
);

/*
|--------------------------------------------------------------------------
| REGIONS — UPDATE
|--------------------------------------------------------------------------
*/

router.put(
  "/regions/:id",

  adminOnly,

  v.params("id"),

  body(
    v.regionUpdate,
  ),

  region.update,
);

/*
|--------------------------------------------------------------------------
| REGIONS — DELETE
|--------------------------------------------------------------------------
*/

router.delete(
  "/regions/:id",

  adminOnly,

  v.params("id"),

  region.remove,
);

/*
|--------------------------------------------------------------------------
| DISTRICTS — CREATE
|--------------------------------------------------------------------------
*/

router.post(
  "/districts",

  adminOnly,

  body(
    v.districtCreate,
  ),

  district.create,
);

/*
|--------------------------------------------------------------------------
| DISTRICTS — LIST
|--------------------------------------------------------------------------
*/

router.get(
  "/districts",

  assessmentUsers,

  query(
    v.districtQuery,
  ),

  district.list,
);

/*
|--------------------------------------------------------------------------
| DISTRICTS — SINGLE
|--------------------------------------------------------------------------
*/

router.get(
  "/districts/:id",

  assessmentUsers,

  v.params("id"),

  district.get,
);

/*
|--------------------------------------------------------------------------
| DISTRICTS — UPDATE
|--------------------------------------------------------------------------
*/

router.put(
  "/districts/:id",

  adminOnly,

  v.params("id"),

  body(
    v.regionUpdate,
  ),

  district.update,
);

/*
|--------------------------------------------------------------------------
| DISTRICTS — DELETE
|--------------------------------------------------------------------------
*/

router.delete(
  "/districts/:id",

  adminOnly,

  v.params("id"),

  district.remove,
);

/*
|--------------------------------------------------------------------------
| WATER POINTS — CREATE
|--------------------------------------------------------------------------
|
| water_assessor cannot create Water Sources.
|
*/

router.post(
  "/water-points",

  registryManagers,

  body(
    v.pointCreate,
  ),

  point.create,
);

/*
|--------------------------------------------------------------------------
| WATER POINTS — LIST
|--------------------------------------------------------------------------
|
| Assessor may view Water Sources so that
| they can select a source for assessment.
|
*/

router.get(
  "/water-points",

  assessmentUsers,

  query(
    v.pointQuery,
  ),

  point.list,
);

/*
|--------------------------------------------------------------------------
| WATER POINTS — SINGLE
|--------------------------------------------------------------------------
*/

router.get(
  "/water-points/:id",

  assessmentUsers,

  v.params("id"),

  point.get,
);

/*
|--------------------------------------------------------------------------
| WATER POINTS — UPDATE
|--------------------------------------------------------------------------
*/

router.put(
  "/water-points/:id",

  registryManagers,

  v.params("id"),

  body(
    v.pointUpdate,
  ),

  point.update,
);

/*
|--------------------------------------------------------------------------
| WATER POINTS — DELETE
|--------------------------------------------------------------------------
|
| Only Admin can archive/delete a Water Source.
|
*/

router.delete(
  "/water-points/:id",

  adminOnly,

  v.params("id"),

  point.remove,
);

/*
|--------------------------------------------------------------------------
| GIS
|--------------------------------------------------------------------------
*/

router.get(
  "/gis",

  assessmentUsers,

  query(
    v.gisQuery,
  ),

  point.gis,
);

/*
|--------------------------------------------------------------------------
| NEARBY WATER SOURCES
|--------------------------------------------------------------------------
*/

router.get(
  "/nearby",

  assessmentUsers,

  query(
    v.nearbyQuery,
  ),

  point.nearby,
);

/*
|--------------------------------------------------------------------------
| WATER REGISTRY SUMMARY
|--------------------------------------------------------------------------
|
| Water Source Registry report.
|
| Separate from Assessment Reports.
|
*/

router.get(
  "/summary",

  registryManagers,

  query(
    v.reportQuery,
  ),

  report.summary,
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT REPORT SUMMARY
|--------------------------------------------------------------------------
|
| admin / water only.
|
| water_assessor does NOT receive the full
| official Registry Assessment Report.
|
*/

router.get(
  "/assessment-reports/summary",

  registryManagers,

  query(
    v.assessmentReportQuery,
  ),

  assessmentReport.summary,
);

/*
|--------------------------------------------------------------------------
| OFFICIAL 42-COLUMN ASSESSMENT EXPORT
|--------------------------------------------------------------------------
|
| CSV export compatible with spreadsheet tools.
|
*/

router.get(
  "/assessment-reports/export",

  registryManagers,

  query(
    v.assessmentReportQuery,
  ),

  assessmentReport.exportCsv,
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT REPORT LIST
|--------------------------------------------------------------------------
*/

router.get(
  "/assessment-reports",

  registryManagers,

  query(
    v.assessmentReportQuery,
  ),

  assessmentReport.list,
);

/*
|--------------------------------------------------------------------------
| CREATE ASSESSMENT
|--------------------------------------------------------------------------
|
| admin
| water
| water_assessor
|
| Every request creates a NEW Assessment.
|
*/

router.post(
  "/water-points/:id/assessments",

  assessmentUsers,

  v.params("id"),

  body(
    v.assessmentCreate,
  ),

  assessment.create,
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT HISTORY
|--------------------------------------------------------------------------
*/

router.get(
  "/water-points/:id/assessments",

  assessmentUsers,

  v.params("id"),

  query(
    v.historyQuery,
  ),

  assessment.list,
);

/*
|--------------------------------------------------------------------------
| LATEST ASSESSMENT
|--------------------------------------------------------------------------
*/

router.get(
  "/water-points/:id/assessments/latest",

  assessmentUsers,

  v.params("id"),

  assessment.latest,
);

/*
|--------------------------------------------------------------------------
| MY ASSESSMENTS
|--------------------------------------------------------------------------
|
| Important:
|
| Keep this before:
| /assessments/:assessmentId
|
*/

router.get(
  "/assessments/mine",

  assessmentUsers,

  query(
    v.historyQuery,
  ),

  assessment.myAssessments,
);

/*
|--------------------------------------------------------------------------
| SINGLE ASSESSMENT
|--------------------------------------------------------------------------
*/

router.get(
  "/assessments/:assessmentId",

  assessmentUsers,

  v.params(
    "assessmentId",
  ),

  assessment.get,
);

/*
|--------------------------------------------------------------------------
| WATER POINT PHOTOS
|--------------------------------------------------------------------------
*/

router.post(
  "/water-points/:id/photos",

  registryManagers,

  v.params("id"),

  file.uploadSlot,

  file.parse(
    "photos",
  ),

  file.upload(
    "photos",
  ),
);

/*
|--------------------------------------------------------------------------
| WATER POINT DOCUMENTS
|--------------------------------------------------------------------------
*/

router.post(
  "/water-points/:id/documents",

  registryManagers,

  v.params("id"),

  file.uploadSlot,

  file.parse(
    "documents",
  ),

  file.upload(
    "documents",
  ),
);

/*
|--------------------------------------------------------------------------
| LEGACY ASSESSMENT PHOTOS
|--------------------------------------------------------------------------
|
| Keep this route for backward compatibility.
|
*/

router.post(
  "/assessments/:assessmentId/photos",

  assessmentUsers,

  v.params(
    "assessmentId",
  ),

  file.uploadSlot,

  file.parse(
    "photos",
  ),

  file.upload(
    "photos",
    true,
  ),
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT EVIDENCE
|--------------------------------------------------------------------------
|
| Supports:
|
| JPEG
| PNG
| PDF
|
| Stored in:
|
| assessmentDocuments[]
|
*/

router.post(
  "/assessments/:assessmentId/evidence",

  assessmentUsers,

  v.params(
    "assessmentId",
  ),

  file.uploadSlot,

  file.parse(
    "evidence",
  ),

  file.upload(
    "assessmentDocuments",
    true,
  ),
);

/*
|--------------------------------------------------------------------------
| WATER POINT FILE DOWNLOAD
|--------------------------------------------------------------------------
*/

router.get(
  "/water-points/:id/files/:fileId",

  assessmentUsers,

  v.params(
    "id",
    "fileId",
  ),

  file.download(
    false,
  ),
);

/*
|--------------------------------------------------------------------------
| ASSESSMENT FILE DOWNLOAD
|--------------------------------------------------------------------------
|
| Works with:
|
| legacy photos
| assessmentDocuments
|
*/

router.get(
  "/assessments/:assessmentId/files/:fileId",

  assessmentUsers,

  v.params(
    "assessmentId",
    "fileId",
  ),

  file.download(
    true,
  ),
);

/*
|--------------------------------------------------------------------------
| REGISTRY 404
|--------------------------------------------------------------------------
*/

router.use(
  (
    _req,
    res,
  ) =>
    res
      .status(404)
      .json({
        success: false,

        message:
          "Registry endpoint not found",

        errors: [],
      }),
);

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

router.use(
  handleError,
);

module.exports =
  router;