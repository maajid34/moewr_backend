


// const Assessment = require(
//   "../../modules/waterPoint/waterPointAssessmentModel",
// );

// const {
//   WaterPoint,
//   error,
//   send,
//   transaction,
//   lockPoint,
//   pagination,
//   meta,
// } = require("./common");

// /*
// |--------------------------------------------------------------------------
// | CREATE ASSESSMENT
// |--------------------------------------------------------------------------
// |
// | One WaterPoint can have many assessments.
// |
// | Important:
// | - WaterPoint must exist.
// | - authenticated user becomes createdBy.
// | - riskScore/riskCategory are NOT trusted from request.
// | - model calculates riskScore/riskCategory.
// | - previous assessments are never overwritten.
// |
// */

// exports.create = async (req, res) => {
//   const result = await transaction(
//     async (session) => {
//       /*
//        * Locks and verifies the WaterPoint.
//        */
//       await lockPoint(
//         req.params.id,
//         session,
//       );

//       const body = {
//         ...req.registryBody,
//       };

//       /*
//        * Defense in depth.
//        *
//        * validation.js already rejects these
//        * fields, but remove them here as well.
//        */
//       delete body.riskScore;
//       delete body.riskCategory;

//       /*
//        * Do not allow client to choose the
//        * authenticated creator.
//        */
//       delete body.createdBy;

//       /*
//        * Create a completely new assessment.
//        *
//        * No previous assessment is updated.
//        */
//       const [created] =
//         await Assessment.create(
//           [
//             {
//               ...body,

//               waterPoint:
//                 req.params.id,

//               createdBy:
//                 req.user.id,
//             },
//           ],
//           {
//             session,
//           },
//         );

//       return created;
//     },
//   );

//   /*
//    * Convert to normal object after save.
//    */
//   const assessment =
//     result.toObject
//       ? result.toObject()
//       : result;

//   send(
//     res,
//     assessment,
//     "Assessment recorded successfully",
//     201,
//   );
// };

// /*
// |--------------------------------------------------------------------------
// | ASSESSMENT HISTORY FOR ONE WATER SOURCE
// |--------------------------------------------------------------------------
// |
// | GET assessments belonging to a WaterPoint.
// |
// | Newest assessment appears first.
// |
// */

// // exports.list = async (
// //   req,
// //   res,
// // ) => {
// //   const waterPoint =
// //     await WaterPoint.findById(
// //       req.params.id,
// //     )
// //       .select(
// //         "_id waterPointCode waterPointName waterSourceType status region district villageOrSite",
// //       )
// //       .lean();

// //   if (!waterPoint) {
// //     error(
// //       404,
// //       "Water point not found",
// //     );
// //   }

// //   const p = pagination(
// //     req.registryQuery,
// //   );

// //   const match = {
// //     waterPoint:
// //       req.params.id,
// //   };

// //   const [data, total] =
// //     await Promise.all([
// //       Assessment.find(match)
// //         .sort({
// //           assessmentDate: -1,
// //           _id: -1,
// //         })
// //         .skip(p.skip)
// //         .limit(p.limit)
// //         .populate(
// //           "createdBy",
// //           "name email role",
// //         )
// //         .lean(),

// //       Assessment.countDocuments(
// //         match,
// //       ),
// //     ]);

// //   send(
// //     res,
// //     {
// //       waterPoint,
// //       assessments: data,
// //     },
// //     "Assessment history",
// //     200,
// //     meta(p, total),
// //   );
// // };

// /*
// |--------------------------------------------------------------------------
// | GET SINGLE ASSESSMENT
// |--------------------------------------------------------------------------
// */
// exports.list = async (req, res) => {
//   if (
//     !(await WaterPoint.exists({
//       _id: req.params.id,
//     }))
//   ) {
//     error(
//       404,
//       "Water point not found",
//     );
//   }

//   const p = pagination(
//     req.registryQuery,
//   );

//   const match = {
//     waterPoint: req.params.id,
//   };

//   const [data, total] =
//     await Promise.all([
//       Assessment.find(match)
//         .sort({
//           assessmentDate: -1,
//           _id: -1,
//         })
//         .skip(p.skip)
//         .limit(p.limit)
//         .populate(
//           "createdBy",
//           "name email role",
//         )
//         .lean(),

//       Assessment.countDocuments(
//         match,
//       ),
//     ]);

//   send(
//     res,
//     data,
//     "Assessment history",
//     200,
//     meta(p, total),
//   );
// };
// exports.get = async (
//   req,
//   res,
// ) => {
//   const doc =
//     await Assessment.findById(
//       req.params.assessmentId,
//     )
//       .populate(
//         "waterPoint",
//         [
//           "waterPointCode",
//           "waterPointName",
//           "waterSourceType",
//           "status",
//           "region",
//           "district",
//           "villageOrSite",
//           "location",
//         ].join(" "),
//       )
//       .populate(
//         "createdBy",
//         "name email role",
//       )
//       .lean();

//   if (!doc) {
//     error(
//       404,
//       "Assessment not found",
//     );
//   }

//   send(
//     res,
//     doc,
//     "Assessment details",
//   );
// };

// /*
// |--------------------------------------------------------------------------
// | GET LATEST ASSESSMENT FOR ONE WATER SOURCE
// |--------------------------------------------------------------------------
// |
// | Useful later for:
// | - Water Source details
// | - dashboard
// | - latest risk category
// | - current assessment summary
// |
// */

// exports.latest = async (
//   req,
//   res,
// ) => {
//   const waterPoint =
//     await WaterPoint.findById(
//       req.params.id,
//     )
//       .select(
//         "_id waterPointCode waterPointName waterSourceType status region district villageOrSite",
//       )
//       .lean();

//   if (!waterPoint) {
//     error(
//       404,
//       "Water point not found",
//     );
//   }

//   const assessment =
//     await Assessment.findOne({
//       waterPoint:
//         req.params.id,
//     })
//       .sort({
//         assessmentDate: -1,
//         _id: -1,
//       })
//       .populate(
//         "createdBy",
//         "name email role",
//       )
//       .lean();

//   send(
//     res,
//     {
//       waterPoint,
//       assessment:
//         assessment || null,
//     },
//     assessment
//       ? "Latest assessment"
//       : "No assessments recorded for this water point",
//   );
// };

// /*
// |--------------------------------------------------------------------------
// | GET ASSESSMENTS CREATED BY CURRENT USER
// |--------------------------------------------------------------------------
// |
// | This will later support:
// |
// | Staff Dashboard
// |     ↓
// | My Assessments
// |
// */

// exports.myAssessments = async (
//   req,
//   res,
// ) => {
//   const p = pagination(
//     req.registryQuery,
//   );

//   const match = {
//     createdBy:
//       req.user.id,
//   };

//   const [data, total] =
//     await Promise.all([
//       Assessment.find(match)
//         .sort({
//           assessmentDate: -1,
//           _id: -1,
//         })
//         .skip(p.skip)
//         .limit(p.limit)
//         .populate(
//           "waterPoint",
//           [
//             "waterPointCode",
//             "waterPointName",
//             "waterSourceType",
//             "status",
//             "region",
//             "district",
//             "villageOrSite",
//           ].join(" "),
//         )
//         .lean(),

//       Assessment.countDocuments(
//         match,
//       ),
//     ]);

//   send(
//     res,
//     data,
//     "My assessments",
//     200,
//     meta(p, total),
//   );
// };


const Assessment = require(
  "../../modules/waterPoint/waterPointAssessmentModel",
);

const {
  WaterPoint,
  error,
  send,
  transaction,
  lockPoint,
  pagination,
  meta,
} = require("./common");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/*
 * Standard Water Source fields used when an Assessment
 * needs information about its parent Water Source.
 */
const WATER_POINT_FIELDS = [
  "waterPointCode",
  "waterPointName",
  "waterSourceType",
  "status",
  "region",
  "district",
  "villageOrSite",
  "location",
].join(" ");

/*
 * Adds Region and District names when a WaterPoint
 * has already been populated into an Assessment query.
 */
const waterPointPopulation = {
  path: "waterPoint",
  select: WATER_POINT_FIELDS,

  populate: [
    {
      path: "region",
      select: "name code isActive",
    },
    {
      path: "district",
      select: "name code region isActive",
    },
  ],
};

/*
|--------------------------------------------------------------------------
| CREATE ASSESSMENT
|--------------------------------------------------------------------------
|
| One Water Source may have many Assessments.
|
| Each call creates a completely NEW Assessment.
| Previous Assessments are never overwritten.
|
*/

exports.create = async (req, res) => {
  const result = await transaction(
    async (session) => {
      /*
       * Verify that the Water Source exists,
       * is active, and serialize concurrent writes.
       */
      await lockPoint(
        req.params.id,
        session,
      );

      const body = {
        ...req.registryBody,
      };

      /*
       * Defense in depth:
       *
       * The validation layer already rejects
       * riskScore and riskCategory.
       *
       * Remove them again here so they can never
       * be trusted from a client request.
       */
      delete body.riskScore;
      delete body.riskCategory;

      /*
       * The authenticated account is authoritative.
       * Client cannot choose createdBy.
       */
      delete body.createdBy;

      const [created] =
        await Assessment.create(
          [
            {
              ...body,

              waterPoint:
                req.params.id,

              createdBy:
                req.user.id,
            },
          ],
          {
            session,
          },
        );

      return created;
    },
  );

  const assessment =
    result.toObject
      ? result.toObject()
      : result;

  send(
    res,
    assessment,
    "Assessment recorded successfully",
    201,
  );
};

/*
|--------------------------------------------------------------------------
| ASSESSMENT HISTORY FOR ONE WATER SOURCE
|--------------------------------------------------------------------------
|
| GET:
| /water-points/:id/assessments
|
| Important:
| - Keeps existing ARRAY response format.
| - Newest Assessment first.
| - Includes authenticated creator information.
| - Pagination remains supported.
|
*/

exports.list = async (req, res) => {
  const waterPointExists =
    await WaterPoint.exists({
      _id: req.params.id,
    });

  if (!waterPointExists) {
    error(
      404,
      "Water point not found",
    );
  }

  const p = pagination(
    req.registryQuery,
  );

  const match = {
    waterPoint:
      req.params.id,
  };

  const [data, total] =
    await Promise.all([
      Assessment.find(match)
        .sort({
          assessmentDate: -1,
          _id: -1,
        })
        .skip(p.skip)
        .limit(p.limit)
        .populate(
          "createdBy",
          "name email role",
        )
        .lean(),

      Assessment.countDocuments(
        match,
      ),
    ]);

  /*
   * Keep the old response shape:
   *
   * data: [assessment, assessment, ...]
   *
   * This protects the existing frontend.
   */
  send(
    res,
    data,
    "Assessment history",
    200,
    meta(p, total),
  );
};

/*
|--------------------------------------------------------------------------
| LATEST ASSESSMENT FOR ONE WATER SOURCE
|--------------------------------------------------------------------------
|
| GET:
| /water-points/:id/assessments/latest
|
*/

exports.latest = async (
  req,
  res,
) => {
  /*
   * Return parent Water Source information,
   * including readable Region and District.
   */
  const waterPoint =
    await WaterPoint.findById(
      req.params.id,
    )
      .select(
        WATER_POINT_FIELDS,
      )
      .populate(
        "region",
        "name code isActive",
      )
      .populate(
        "district",
        "name code region isActive",
      )
      .lean();

  if (!waterPoint) {
    error(
      404,
      "Water point not found",
    );
  }

  const assessment =
    await Assessment.findOne({
      waterPoint:
        req.params.id,
    })
      .sort({
        assessmentDate: -1,
        _id: -1,
      })
      .populate(
        "createdBy",
        "name email role",
      )
      .lean();

  send(
    res,
    {
      waterPoint,

      assessment:
        assessment || null,
    },

    assessment
      ? "Latest assessment"
      : "No assessments recorded for this water point",
  );
};

/*
|--------------------------------------------------------------------------
| SINGLE ASSESSMENT DETAILS
|--------------------------------------------------------------------------
|
| GET:
| /assessments/:assessmentId
|
| Returns:
| - full Assessment
| - Water Source profile
| - Region
| - District
| - Assessor/account information
| - Evidence metadata
|
*/

exports.get = async (
  req,
  res,
) => {
  const doc =
    await Assessment.findById(
      req.params.assessmentId,
    )
      .populate(
        waterPointPopulation,
      )
      .populate(
        "createdBy",
        "name email role",
      )
      .lean();

  if (!doc) {
    error(
      404,
      "Assessment not found",
    );
  }

  send(
    res,
    doc,
    "Assessment details",
  );
};

/*
|--------------------------------------------------------------------------
| MY ASSESSMENTS
|--------------------------------------------------------------------------
|
| GET:
| /assessments/mine
|
| Used by:
| Staff Dashboard -> My Assessments
|
| Only returns Assessments created by the
| currently authenticated account.
|
*/

exports.myAssessments = async (
  req,
  res,
) => {
  const p = pagination(
    req.registryQuery,
  );

  const match = {
    createdBy:
      req.user.id,
  };

  const [data, total] =
    await Promise.all([
      Assessment.find(match)
        .sort({
          assessmentDate: -1,
          _id: -1,
        })
        .skip(p.skip)
        .limit(p.limit)
        .populate(
          waterPointPopulation,
        )
        .lean(),

      Assessment.countDocuments(
        match,
      ),
    ]);

  send(
    res,
    data,
    "My assessments",
    200,
    meta(p, total),
  );
};