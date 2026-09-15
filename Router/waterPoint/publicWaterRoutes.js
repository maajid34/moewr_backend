



// const router = require("express").Router();

// const WaterPoint = require("../../modules/waterPoint/waterPointModel");
// const Region = require("../../modules/waterPoint/regionModel");
// const District = require("../../modules/waterPoint/districtModel");

// const labels = {
//   BOREHOLE: "Borehole",
//   SHALLOW_WELL: "Shallow Well",
//   BARKAD: "Barkad",
//   WATER_PAN: "Water Pan",
//   WATER_KIOSK: "Water Kiosk",

//   FUNCTIONAL: "Functional",
//   NON_FUNCTIONAL: "Non-Functional",
//   UNDER_MAINTENANCE: "Under Maintenance",
//   PARTIALLY_FUNCTIONAL: "Partially Functional",
//   ABANDONED: "Abandoned",
//   UNKNOWN: "Unknown",
// };

// const PUBLIC_WATER_TYPES = [
//   "BOREHOLE",
//   "SHALLOW_WELL",
//   "BARKAD",
//   "WATER_PAN",
//   "WATER_KIOSK",
// ];

// const PUBLIC_STATUSES = [
//   "FUNCTIONAL",
//   "NON_FUNCTIONAL",
//   "UNDER_MAINTENANCE",
//   "PARTIALLY_FUNCTIONAL",
//   "ABANDONED",
//   "UNKNOWN",
// ];

// const sum = (field, value) => ({
//   $sum: {
//     $cond: [
//       {
//         $eq: [`$${field}`, value],
//       },
//       1,
//       0,
//     ],
//   },
// });

// // Anonymous, read-only projection.
// // No admin controller or full document response.
// router.get(
//   "/water-infrastructure",
//   require("../../middleWare/requireDatabaseReady"),
//   async (_req, res) => {
//     try {
//       const [result] = await WaterPoint.aggregate([
//         {
//           $match: {
//             isActive: true,
//           },
//         },

//         {
//           $facet: {
//             totals: [
//               {
//                 $group: {
//                   _id: null,

//                   total: {
//                     $sum: 1,
//                   },

//                   boreholes: sum(
//                     "waterSourceType",
//                     "BOREHOLE",
//                   ),

//                   shallowWells: sum(
//                     "waterSourceType",
//                     "SHALLOW_WELL",
//                   ),

//                   barkads: sum(
//                     "waterSourceType",
//                     "BARKAD",
//                   ),

//                   waterPans: sum(
//                     "waterSourceType",
//                     "WATER_PAN",
//                   ),

//                   waterKiosks: sum(
//                     "waterSourceType",
//                     "WATER_KIOSK",
//                   ),

//                   functional: sum(
//                     "status",
//                     "FUNCTIONAL",
//                   ),

//                   nonFunctional: sum(
//                     "status",
//                     "NON_FUNCTIONAL",
//                   ),

//                   underMaintenance: sum(
//                     "status",
//                     "UNDER_MAINTENANCE",
//                   ),
//                 },
//               },

//               {
//                 $project: {
//                   _id: 0,
//                 },
//               },
//             ],

//             regions: [
//               {
//                 $group: {
//                   _id: "$region",
//                   count: {
//                     $sum: 1,
//                   },
//                 },
//               },
//             ],

//             points: [
//               {
//                 $sort: {
//                   _id: 1,
//                 },
//               },

//               {
//                 $limit: 1000,
//               },

//               {
//                 $project: {
//                   _id: 0,
//                   waterPointCode: 1,
//                   waterSourceType: 1,
//                   region: 1,
//                   district: 1,
//                   villageOrSite: 1,
//                   status: 1,
//                   location: 1,
//                 },
//               },
//             ],
//           },
//         },
//       ]).option({
//         maxTimeMS: 10000,
//       });

//       const regionIds = result.regions
//         .map((region) => region._id)
//         .filter(Boolean);

//       const districtIds = result.points
//         .map((point) => point.district)
//         .filter(Boolean);

//       const [regions, districts] =
//         await Promise.all([
//           Region.find({
//             _id: {
//               $in: regionIds,
//             },
//           })
//             .select("name")
//             .lean()
//             .maxTimeMS(10000),

//           District.find({
//             _id: {
//               $in: districtIds,
//             },
//           })
//             .select("name")
//             .lean()
//             .maxTimeMS(10000),
//         ]);

//       const names = (rows) =>
//         new Map(
//           rows.map((row) => [
//             String(row._id),
//             row.name,
//           ]),
//         );

//       const regionNames = names(regions);
//       const districtNames = names(districts);

//       const summary =
//         result.totals[0] || {
//           total: 0,
//           boreholes: 0,
//           shallowWells: 0,
//           barkads: 0,
//           waterPans: 0,
//           waterKiosks: 0,
//           functional: 0,
//           nonFunctional: 0,
//           underMaintenance: 0,
//         };

//       res
//         .set("Cache-Control", "no-store")
//         .json({
//           public: true,

//           summary,

//           regions: result.regions
//             .map((region) => ({
//               name:
//                 regionNames.get(
//                   String(region._id),
//                 ) || "Unknown",

//               count: region.count,
//             }))
//             .sort((a, b) =>
//               a.name.localeCompare(b.name),
//             ),

//           gis: {
//             type: "FeatureCollection",

//             features: result.points
//               .filter(
//                 (point) =>
//                   point?.location?.type ===
//                     "Point" &&
//                   Array.isArray(
//                     point.location.coordinates,
//                   ) &&
//                   point.location.coordinates
//                     .length === 2,
//               )
//               .map((point) => ({
//                 type: "Feature",

//                 geometry: {
//                   type: "Point",

//                   coordinates:
//                     point.location.coordinates,
//                 },

//                 properties: {
//                   code:
//                     point.waterPointCode,

//                   type:
//                     labels[
//                       point.waterSourceType
//                     ] || "Unknown",

//                   region:
//                     regionNames.get(
//                       String(point.region),
//                     ) || "Unknown",

//                   district:
//                     districtNames.get(
//                       String(point.district),
//                     ) || "Unknown",

//                   village:
//                     point.villageOrSite || "",

//                   status:
//                     labels[point.status] ||
//                     "Unknown",
//                 },
//               })),
//           },
//         });
//     } catch {
//       res.status(503).json({
//         message:
//           "Public water infrastructure data is temporarily unavailable.",
//       });
//     }
//   },
// );

// const publicFields =
//   "waterPointCode waterSourceType region district villageOrSite status location updatedAt";

// function publicPoint(point) {
//   return {
//     code: point.waterPointCode,

//     type:
//       labels[point.waterSourceType] ||
//       "Unknown",

//     region:
//       point.region?.name || "Unknown",

//     district:
//       point.district?.name || "Unknown",

//     village:
//       point.villageOrSite || "",

//     status:
//       labels[point.status] || "Unknown",

//     coordinates:
//       point.location?.coordinates || null,

//     updatedAt:
//       point.updatedAt || null,
//   };
// }

// router.get(
//   "/water-infrastructure/points",
//   require("../../middleWare/requireDatabaseReady"),
//   async (req, res) => {
//     try {
//       const q = req.query;

//       const allowedQueryParameters = [
//         "q",
//         "region",
//         "district",
//         "type",
//         "status",
//         "page",
//       ];

//       if (
//         Object.keys(q).some(
//           (key) =>
//             !allowedQueryParameters.includes(
//               key,
//             ),
//         ) ||
//         Object.values(q).some(
//           (value) =>
//             typeof value !== "string" ||
//             value.length > 160,
//         )
//       ) {
//         return res.status(400).json({
//           message: "Invalid filters",
//         });
//       }

//       const page = Number(q.page || 1);
//       const limit = 12;

//       if (
//         !Number.isSafeInteger(page) ||
//         page < 1 ||
//         page > 100000
//       ) {
//         return res.status(400).json({
//           message: "Invalid page",
//         });
//       }

//       const match = {
//         isActive: true,
//       };

//       for (const field of [
//         "region",
//         "district",
//       ]) {
//         if (q[field]) {
//           if (
//             !/^[a-f\d]{24}$/i.test(
//               q[field],
//             )
//           ) {
//             return res.status(400).json({
//               message:
//                 "Invalid location filter",
//             });
//           }

//           match[field] = q[field];
//         }
//       }

//       const enumFilters = [
//         [
//           "type",
//           "waterSourceType",
//           PUBLIC_WATER_TYPES,
//         ],

//         [
//           "status",
//           "status",
//           PUBLIC_STATUSES,
//         ],
//       ];

//       for (const [
//         param,
//         field,
//         allowed,
//       ] of enumFilters) {
//         if (q[param]) {
//           if (!allowed.includes(q[param])) {
//             return res.status(400).json({
//               message: "Invalid filter",
//             });
//           }

//           match[field] = q[param];
//         }
//       }

//       if (q.q?.trim()) {
//         const text = q.q
//           .trim()
//           .replace(
//             /[.*+?^${}()|[\]\\]/g,
//             "\\$&",
//           );

//         match.$or = [
//           "waterPointCode",
//           "villageOrSite",
//         ].map((field) => ({
//           [field]: {
//             $regex: text,
//             $options: "i",
//           },
//         }));
//       }

//       const [
//         points,
//         total,
//         regionIds,
//         districtIds,
//       ] = await Promise.all([
//         WaterPoint.find(match)
//           .select(publicFields)
//           .populate("region", "name")
//           .populate("district", "name")
//           .sort({
//             waterPointCode: 1,
//             _id: 1,
//           })
//           .skip((page - 1) * limit)
//           .limit(limit)
//           .lean()
//           .maxTimeMS(10000),

//         WaterPoint.countDocuments(
//           match,
//         ).maxTimeMS(10000),

//         WaterPoint.distinct("region", {
//           isActive: true,
//         }).maxTimeMS(10000),

//         WaterPoint.distinct("district", {
//           isActive: true,

//           ...(q.region
//             ? {
//                 region: q.region,
//               }
//             : {}),
//         }).maxTimeMS(10000),
//       ]);

//       const [regions, districts] =
//         await Promise.all([
//           Region.find({
//             _id: {
//               $in: regionIds,
//             },
//           })
//             .select("name")
//             .sort({
//               name: 1,
//             })
//             .lean()
//             .maxTimeMS(10000),

//           District.find({
//             _id: {
//               $in: districtIds,
//             },
//           })
//             .select("name")
//             .sort({
//               name: 1,
//             })
//             .lean()
//             .maxTimeMS(10000),
//         ]);

//       const options = (rows) =>
//         rows.map((row) => ({
//           value: String(row._id),
//           label: row.name,
//         }));

//       res
//         .set("Cache-Control", "no-store")
//         .json({
//           public: true,

//           items: points.map(publicPoint),

//           total,

//           page,

//           limit,

//           regions: options(regions),

//           districts: options(districts),
//         });
//     } catch {
//       res.status(503).json({
//         message:
//           "Public water infrastructure data is temporarily unavailable.",
//       });
//     }
//   },
// );

// router.get(
//   "/water-infrastructure/points/:code",
//   require("../../middleWare/requireDatabaseReady"),
//   async (req, res) => {
//     try {
//       if (
//         req.params.code.length > 160
//       ) {
//         return res.status(400).json({
//           message: "Invalid code",
//         });
//       }

//       const point =
//         await WaterPoint.findOne({
//           waterPointCode:
//             req.params.code,

//           isActive: true,
//         })
//           .select(publicFields)
//           .populate("region", "name")
//           .populate(
//             "district",
//             "name",
//           )
//           .lean()
//           .maxTimeMS(10000);

//       if (!point) {
//         return res.status(404).json({
//           message:
//             "Water point not found",
//         });
//       }

//       res
//         .set("Cache-Control", "no-store")
//         .json({
//           public: true,

//           item: publicPoint(point),
//         });
//     } catch {
//       res.status(503).json({
//         message:
//           "Public water infrastructure data is temporarily unavailable.",
//       });
//     }
//   },
// );

// module.exports = router;

const router = require("express").Router();

const WaterPoint = require(
  "../../modules/waterPoint/waterPointModel",
);
const Region = require(
  "../../modules/waterPoint/regionModel",
);
const District = require(
  "../../modules/waterPoint/districtModel",
);

const requireDatabaseReady = require(
  "../../middleWare/requireDatabaseReady",
);
const WaterPointAssessment = require(
  "../../modules/waterPoint/waterPointAssessmentModel",
);
/* =========================================================
   PUBLIC LABELS
   ========================================================= */

const labels = {
  // Water Source Types
  BOREHOLE: "Borehole",
  SHALLOW_WELL: "Shallow Well",
  BARKAD: "Barkad",
  WATER_PAN: "Water Pan",
  WATER_KIOSK: "Water Kiosk",

  // Operational Statuses
  FUNCTIONAL: "Functional",
  NON_FUNCTIONAL: "Non-Functional",
  UNDER_MAINTENANCE: "Under Maintenance",
  PARTIALLY_FUNCTIONAL: "Partially Functional",
  ABANDONED: "Abandoned",
  UNKNOWN: "Unknown",
};

const PUBLIC_WATER_TYPES = [
  "BOREHOLE",
  "SHALLOW_WELL",
  "BARKAD",
  "WATER_PAN",
  "WATER_KIOSK",
];

const PUBLIC_STATUSES = [
  "FUNCTIONAL",
  "NON_FUNCTIONAL",
  "UNDER_MAINTENANCE",
  "PARTIALLY_FUNCTIONAL",
  "ABANDONED",
  "UNKNOWN",
];

/* =========================================================
   AGGREGATION HELPERS
   ========================================================= */

const sum = (field, value) => ({
  $sum: {
    $cond: [
      {
        $eq: [`$${field}`, value],
      },
      1,
      0,
    ],
  },
});

const summaryGroup = () => ({
  _id: null,

  total: {
    $sum: 1,
  },

  // Water Source Types
  boreholes: sum(
    "waterSourceType",
    "BOREHOLE",
  ),

  shallowWells: sum(
    "waterSourceType",
    "SHALLOW_WELL",
  ),

  barkads: sum(
    "waterSourceType",
    "BARKAD",
  ),

  waterPans: sum(
    "waterSourceType",
    "WATER_PAN",
  ),

  waterKiosks: sum(
    "waterSourceType",
    "WATER_KIOSK",
  ),

  // Statuses
  functional: sum(
    "status",
    "FUNCTIONAL",
  ),

  nonFunctional: sum(
    "status",
    "NON_FUNCTIONAL",
  ),

  underMaintenance: sum(
    "status",
    "UNDER_MAINTENANCE",
  ),

  partiallyFunctional: sum(
    "status",
    "PARTIALLY_FUNCTIONAL",
  ),

  abandoned: sum(
    "status",
    "ABANDONED",
  ),

  unknown: sum(
    "status",
    "UNKNOWN",
  ),
});

const emptySummary = () => ({
  total: 0,

  boreholes: 0,
  shallowWells: 0,
  barkads: 0,
  waterPans: 0,
  waterKiosks: 0,

  functional: 0,
  nonFunctional: 0,
  underMaintenance: 0,
  partiallyFunctional: 0,
  abandoned: 0,
  unknown: 0,
});

/* =========================================================
   PUBLIC WATER INFRASTRUCTURE OVERVIEW
   GET /api/public/water-infrastructure

   Anonymous + read-only.
   ========================================================= */

router.get(
  "/water-infrastructure",
  requireDatabaseReady,
  async (_req, res) => {
    try {
      const [result] =
        await WaterPoint.aggregate([
          {
            $match: {
              isActive: true,
            },
          },

          {
            $facet: {
              totals: [
                {
                  $group:
                    summaryGroup(),
                },

                {
                  $project: {
                    _id: 0,
                  },
                },
              ],

              regions: [
                {
                  $group: {
                    _id: "$region",

                    count: {
                      $sum: 1,
                    },
                  },
                },
              ],

              points: [
                {
                  $sort: {
                    _id: 1,
                  },
                },

                {
                  $limit: 1000,
                },

                {
                  $project: {
                    _id: 0,

                    waterPointCode: 1,
                    waterSourceType: 1,

                    region: 1,
                    district: 1,
                    villageOrSite: 1,

                    status: 1,
                    location: 1,
                  },
                },
              ],
            },
          },
        ]).option({
          maxTimeMS: 10000,
        });

      const safeResult = result || {
        totals: [],
        regions: [],
        points: [],
      };

      const regionIds = (
        safeResult.regions || []
      )
        .map(
          (region) => region._id,
        )
        .filter(Boolean);

      const districtIds = (
        safeResult.points || []
      )
        .map(
          (point) => point.district,
        )
        .filter(Boolean);

      const [regions, districts] =
        await Promise.all([
          Region.find({
            _id: {
              $in: regionIds,
            },
          })
            .select("name")
            .lean()
            .maxTimeMS(10000),

          District.find({
            _id: {
              $in: districtIds,
            },
          })
            .select("name")
            .lean()
            .maxTimeMS(10000),
        ]);

      const names = (rows) =>
        new Map(
          rows.map((row) => [
            String(row._id),
            row.name,
          ]),
        );

      const regionNames =
        names(regions);

      const districtNames =
        names(districts);

      const summary =
        safeResult.totals?.[0] ||
        emptySummary();

      const publicRegions = (
        safeResult.regions || []
      )
        .map((region) => ({
          name:
            regionNames.get(
              String(region._id),
            ) || "Unknown",

          count:
            region.count || 0,
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
          ),
        );

      const features = (
        safeResult.points || []
      )
        .filter((point) => {
          const coordinates =
            point?.location
              ?.coordinates;

          return (
            point?.location?.type ===
              "Point" &&
            Array.isArray(
              coordinates,
            ) &&
            coordinates.length ===
              2 &&
            Number.isFinite(
              Number(
                coordinates[0],
              ),
            ) &&
            Number.isFinite(
              Number(
                coordinates[1],
              ),
            ) &&
            Math.abs(
              Number(
                coordinates[0],
              ),
            ) <= 180 &&
            Math.abs(
              Number(
                coordinates[1],
              ),
            ) <= 90
          );
        })
        .map((point) => ({
          type: "Feature",

          geometry: {
            type: "Point",

            coordinates:
              point.location
                .coordinates,
          },

          properties: {
            code:
              point.waterPointCode,

            type:
              labels[
                point.waterSourceType
              ] || "Unknown",

            region:
              regionNames.get(
                String(
                  point.region,
                ),
              ) || "Unknown",

            district:
              districtNames.get(
                String(
                  point.district,
                ),
              ) || "Unknown",

            village:
              point.villageOrSite ||
              "",

            status:
              labels[
                point.status
              ] || "Unknown",
          },
        }));

      res
        .set(
          "Cache-Control",
          "no-store",
        )
        .json({
          public: true,

          summary,

          regions:
            publicRegions,

          gis: {
            type:
              "FeatureCollection",

            features,
          },
        });
    } catch (error) {
      console.error(
        "Public water infrastructure overview error:",
        error,
      );

      res.status(503).json({
        message:
          "Public water infrastructure data is temporarily unavailable.",
      });
    }
  },
);

/* =========================================================
   PUBLIC WATER SOURCE REPORTS
   GET /api/public/water-infrastructure/reports

   Examples:

   ?groupBy=region
   ?groupBy=district
   ?groupBy=waterSourceType
   ?groupBy=status

   Aggregate data ONLY.
   No full WaterPoint documents are exposed.
   ========================================================= */

router.get(
  "/water-infrastructure/reports",
  requireDatabaseReady,
  async (req, res) => {
    try {
      const allowedGroups = [
        "region",
        "district",
        "waterSourceType",
        "status",
      ];

      const groupBy =
        typeof req.query.groupBy ===
        "string"
          ? req.query.groupBy
          : "region";

      if (
        !allowedGroups.includes(
          groupBy,
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid report grouping",
          });
      }

      /*
       * The public report only
       * includes active records.
       */
      const match = {
        isActive: true,
      };

      const groupFields = {
        region: "$region",

        district: "$district",

        waterSourceType:
          "$waterSourceType",

        status: "$status",
      };

      const groupField =
        groupFields[groupBy];

      const [result] =
        await WaterPoint.aggregate([
          {
            $match: match,
          },

          {
            $facet: {
              summary: [
                {
                  $group:
                    summaryGroup(),
                },

                {
                  $project: {
                    _id: 0,
                  },
                },
              ],

              groups: [
                {
                  $group: {
                    ...summaryGroup(),

                    _id: groupField,
                  },
                },

                {
                  $sort: {
                    total: -1,
                    _id: 1,
                  },
                },
              ],
            },
          },
        ]).option({
          maxTimeMS: 10000,
        });

      const summary =
        result?.summary?.[0] ||
        emptySummary();

      const rawGroups =
        Array.isArray(
          result?.groups,
        )
          ? result.groups
          : [];

      let nameMap =
        new Map();

      /*
       * Region and District groups
       * contain MongoDB references.
       *
       * Resolve ONLY their names
       * for the public response.
       */
      if (
        groupBy === "region"
      ) {
        const ids = rawGroups
          .map(
            (row) => row._id,
          )
          .filter(Boolean);

        const rows =
          await Region.find({
            _id: {
              $in: ids,
            },
          })
            .select("name")
            .lean()
            .maxTimeMS(10000);

        nameMap = new Map(
          rows.map((row) => [
            String(row._id),
            row.name,
          ]),
        );
      }

      if (
        groupBy === "district"
      ) {
        const ids = rawGroups
          .map(
            (row) => row._id,
          )
          .filter(Boolean);

        const rows =
          await District.find({
            _id: {
              $in: ids,
            },
          })
            .select("name")
            .lean()
            .maxTimeMS(10000);

        nameMap = new Map(
          rows.map((row) => [
            String(row._id),
            row.name,
          ]),
        );
      }

      const groups =
        rawGroups.map((row) => {
          let name =
            "Unknown";

          if (
            groupBy ===
              "region" ||
            groupBy ===
              "district"
          ) {
            name =
              nameMap.get(
                String(row._id),
              ) || "Unknown";
          } else {
            name =
              labels[row._id] ||
              String(
                row._id ||
                  "Unknown",
              );
          }

          return {
            name,

            total:
              row.total || 0,

            boreholes:
              row.boreholes || 0,

            shallowWells:
              row.shallowWells ||
              0,

            barkads:
              row.barkads || 0,

            waterPans:
              row.waterPans || 0,

            waterKiosks:
              row.waterKiosks ||
              0,

            functional:
              row.functional || 0,

            nonFunctional:
              row.nonFunctional ||
              0,

            underMaintenance:
              row.underMaintenance ||
              0,

            partiallyFunctional:
              row.partiallyFunctional ||
              0,

            abandoned:
              row.abandoned || 0,

            unknown:
              row.unknown || 0,
          };
        });

      res
        .set(
          "Cache-Control",
          "no-store",
        )
        .json({
          public: true,

          groupBy,

          summary,

          groups,
        });
    } catch (error) {
      console.error(
        "Public water source reports error:",
        error,
      );

      res.status(503).json({
        message:
          "Public water source reports are temporarily unavailable.",
      });
    }
  },
);

/* =========================================================
   PUBLIC WATER SOURCE DIRECTORY
   ========================================================= */

const publicFields = [
  "waterPointCode",
  "waterSourceType",
  "region",
  "district",
  "villageOrSite",
  "status",
  "location",
  "updatedAt",
].join(" ");

function publicPoint(
  point,
) {
  return {
    code:
      point.waterPointCode,

    type:
      labels[
        point.waterSourceType
      ] || "Unknown",

    region:
      point.region?.name ||
      "Unknown",

    district:
      point.district?.name ||
      "Unknown",

    village:
      point.villageOrSite ||
      "",

    status:
      labels[point.status] ||
      "Unknown",

    coordinates:
      point.location
        ?.coordinates ||
      null,

    updatedAt:
      point.updatedAt ||
      null,
  };
}

/* =========================================================
   PUBLIC WATER SOURCE LIST
   GET /api/public/water-infrastructure/points
   ========================================================= */

router.get(
  "/water-infrastructure/points",
  requireDatabaseReady,
  async (req, res) => {
    try {
      const q = req.query;

      const allowedQueryParameters =
        [
          "q",
          "region",
          "district",
          "type",
          "status",
          "page",
        ];

      if (
        Object.keys(q).some(
          (key) =>
            !allowedQueryParameters.includes(
              key,
            ),
        ) ||
        Object.values(q).some(
          (value) =>
            typeof value !==
              "string" ||
            value.length > 160,
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid filters",
          });
      }

      const page = Number(
        q.page || 1,
      );

      const limit = 12;

      if (
        !Number.isSafeInteger(
          page,
        ) ||
        page < 1 ||
        page > 100000
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid page",
          });
      }

      const match = {
        isActive: true,
      };

      /*
       * Region / District filters
       */
      for (const field of [
        "region",
        "district",
      ]) {
        if (q[field]) {
          if (
            !/^[a-f\d]{24}$/i.test(
              q[field],
            )
          ) {
            return res
              .status(400)
              .json({
                message:
                  "Invalid location filter",
              });
          }

          match[field] =
            q[field];
        }
      }

      /*
       * Type / Status filters
       */
      const enumFilters = [
        [
          "type",
          "waterSourceType",
          PUBLIC_WATER_TYPES,
        ],

        [
          "status",
          "status",
          PUBLIC_STATUSES,
        ],
      ];

      for (const [
        param,
        field,
        allowed,
      ] of enumFilters) {
        if (q[param]) {
          if (
            !allowed.includes(
              q[param],
            )
          ) {
            return res
              .status(400)
              .json({
                message:
                  "Invalid filter",
              });
          }

          match[field] =
            q[param];
        }
      }

      /*
       * Search by source code
       * or Village / Site.
       */
      if (q.q?.trim()) {
        const text = q.q
          .trim()
          .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );

        match.$or = [
          "waterPointCode",
          "villageOrSite",
        ].map((field) => ({
          [field]: {
            $regex: text,
            $options: "i",
          },
        }));
      }

      const [
        points,
        total,
        regionIds,
        districtIds,
      ] = await Promise.all([
        WaterPoint.find(
          match,
        )
          .select(
            publicFields,
          )
          .populate(
            "region",
            "name",
          )
          .populate(
            "district",
            "name",
          )
          .sort({
            waterPointCode: 1,
            _id: 1,
          })
          .skip(
            (page - 1) *
              limit,
          )
          .limit(limit)
          .lean()
          .maxTimeMS(10000),

        WaterPoint.countDocuments(
          match,
        ).maxTimeMS(
          10000,
        ),

        WaterPoint.distinct(
          "region",
          {
            isActive: true,
          },
        ).maxTimeMS(
          10000,
        ),

        WaterPoint.distinct(
          "district",
          {
            isActive: true,

            ...(q.region
              ? {
                  region:
                    q.region,
                }
              : {}),
          },
        ).maxTimeMS(
          10000,
        ),
      ]);

      const [
        regions,
        districts,
      ] =
        await Promise.all([
          Region.find({
            _id: {
              $in: regionIds,
            },
          })
            .select("name")
            .sort({
              name: 1,
            })
            .lean()
            .maxTimeMS(
              10000,
            ),

          District.find({
            _id: {
              $in: districtIds,
            },
          })
            .select("name")
            .sort({
              name: 1,
            })
            .lean()
            .maxTimeMS(
              10000,
            ),
        ]);

      const options = (
        rows,
      ) =>
        rows.map(
          (row) => ({
            value: String(
              row._id,
            ),

            label:
              row.name,
          }),
        );

      res
        .set(
          "Cache-Control",
          "no-store",
        )
        .json({
          public: true,

          items:
            points.map(
              publicPoint,
            ),

          total,

          page,

          limit,

          regions:
            options(
              regions,
            ),

          districts:
            options(
              districts,
            ),
        });
    } catch (error) {
      console.error(
        "Public water source directory error:",
        error,
      );

      res.status(503).json({
        message:
          "Public water infrastructure data is temporarily unavailable.",
      });
    }
  },
);

/* =========================================================
   PUBLIC WATER SOURCE DETAIL
   GET /api/public/water-infrastructure/points/:code
   ========================================================= */

router.get(
  "/water-infrastructure/points/:code",
  requireDatabaseReady,
  async (req, res) => {
    try {
      const code =
        req.params.code;

      if (
        typeof code !==
          "string" ||
        code.length < 1 ||
        code.length > 160
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid code",
          });
      }

      const point =
        await WaterPoint.findOne(
          {
            waterPointCode:
              code,

            isActive: true,
          },
        )
          .select(
            publicFields,
          )
          .populate(
            "region",
            "name",
          )
          .populate(
            "district",
            "name",
          )
          .lean()
          .maxTimeMS(
            10000,
          );

      if (!point) {
        return res
          .status(404)
          .json({
            message:
              "Water source not found",
          });
      }

      res
        .set(
          "Cache-Control",
          "no-store",
        )
        .json({
          public: true,

          item:
            publicPoint(
              point,
            ),
        });
    } catch (error) {
      console.error(
        "Public water source detail error:",
        error,
      );

      res.status(503).json({
        message:
          "Public water infrastructure data is temporarily unavailable.",
      });
    }
  },
);

/* =========================================================
   PUBLIC WATER SOURCE ASSESSMENTS
   GET /api/public/water-infrastructure/assessments

   Public-safe assessment information only.

   NOT PUBLIC:
   - conditionNotes
   - photos
   - assessedByName
   - createdBy
   - internal audit information
   ========================================================= */

router.get(
  "/water-infrastructure/assessments",
  requireDatabaseReady,
  async (_req, res) => {
    try {
      /*
       * Only assessments connected to
       * currently active Water Sources
       * should appear publicly.
       */

      const activeWaterSources =
        await WaterPoint.find({
          isActive: true,
        })
          .select(
            "_id waterPointCode waterSourceType region district villageOrSite",
          )
          .populate(
            "region",
            "name",
          )
          .populate(
            "district",
            "name",
          )
          .lean()
          .maxTimeMS(10000);

      const sourceIds =
        activeWaterSources.map(
          (source) => source._id,
        );

      /*
       * Create a safe lookup map.
       */
      const sourceMap =
        new Map(
          activeWaterSources.map(
            (source) => [
              String(
                source._id,
              ),

              {
                code:
                  source.waterPointCode,

                type:
                  labels[
                    source
                      .waterSourceType
                  ] ||
                  "Unknown",

                region:
                  source.region
                    ?.name ||
                  "Unknown",

                district:
                  source.district
                    ?.name ||
                  "Unknown",

                village:
                  source
                    .villageOrSite ||
                  "",
              },
            ],
          ),
        );

      /*
       * Fetch only fields that are
       * explicitly approved for
       * public use.
       */
      const assessments =
        await WaterPointAssessment.find(
          {
            waterPoint: {
              $in: sourceIds,
            },
          },
        )
          .select(
            [
              "waterPoint",
              "assessmentDate",
              "status",
              "waterQuality",
              "yieldValue",
              "yieldUnit",
              "maintenanceRequired",
            ].join(" "),
          )
          .sort({
            assessmentDate: -1,
            _id: -1,
          })
          .lean()
          .maxTimeMS(
            10000,
          );

      /*
       * Summary information
       */
      const statusCounts = {
        FUNCTIONAL: 0,
        NON_FUNCTIONAL: 0,
        UNDER_MAINTENANCE: 0,
        PARTIALLY_FUNCTIONAL: 0,
        ABANDONED: 0,
        UNKNOWN: 0,
      };

      const qualityCounts = {};

      let maintenanceRequired =
        0;

      const assessedSources =
        new Set();

      for (
        const assessment of
        assessments
      ) {
        assessedSources.add(
          String(
            assessment.waterPoint,
          ),
        );

        if (
          Object.prototype.hasOwnProperty.call(
            statusCounts,
            assessment.status,
          )
        ) {
          statusCounts[
            assessment.status
          ] += 1;
        }

        if (
          assessment.waterQuality
        ) {
          qualityCounts[
            assessment.waterQuality
          ] =
            (qualityCounts[
              assessment.waterQuality
            ] || 0) + 1;
        }

        if (
          assessment.maintenanceRequired ===
          true
        ) {
          maintenanceRequired +=
            1;
        }
      }

      /*
       * Regional coverage.
       *
       * Each Water Source is counted
       * once if it has at least one
       * assessment.
       */
      const regionCoverageMap =
        new Map();

      for (
        const sourceId of
        assessedSources
      ) {
        const source =
          sourceMap.get(
            sourceId,
          );

        if (!source) {
          continue;
        }

        const region =
          source.region ||
          "Unknown";

        regionCoverageMap.set(
          region,
          (regionCoverageMap.get(
            region,
          ) || 0) + 1,
        );
      }

      const regions =
        Array.from(
          regionCoverageMap.entries(),
        )
          .map(
            ([
              name,
              count,
            ]) => ({
              name,
              count,
            }),
          )
          .sort(
            (a, b) =>
              b.count -
                a.count ||
              a.name.localeCompare(
                b.name,
              ),
          );

      /*
       * Water Source Type coverage.
       *
       * Again, one source is counted
       * once regardless of how many
       * assessments it has.
       */
      const typeCoverageMap =
        new Map();

      for (
        const sourceId of
        assessedSources
      ) {
        const source =
          sourceMap.get(
            sourceId,
          );

        if (!source) {
          continue;
        }

        const type =
          source.type ||
          "Unknown";

        typeCoverageMap.set(
          type,
          (typeCoverageMap.get(
            type,
          ) || 0) + 1,
        );
      }

      const sourceTypes =
        Array.from(
          typeCoverageMap.entries(),
        )
          .map(
            ([
              name,
              count,
            ]) => ({
              name,
              count,
            }),
          )
          .sort(
            (a, b) =>
              b.count -
                a.count ||
              a.name.localeCompare(
                b.name,
              ),
          );

      /*
       * Public recent assessments.
       *
       * Limit the public response to
       * the 12 most recent records.
       */
      const recent =
        assessments
          .slice(0, 12)
          .map(
            (
              assessment,
            ) => {
              const source =
                sourceMap.get(
                  String(
                    assessment.waterPoint,
                  ),
                );

              if (!source) {
                return null;
              }

              return {
                source,

                assessmentDate:
                  assessment.assessmentDate,

                status:
                  labels[
                    assessment.status
                  ] ||
                  "Unknown",

                waterQuality:
                  assessment.waterQuality ||
                  null,

                yield:
                  assessment.yieldValue !=
                  null
                    ? {
                        value:
                          assessment.yieldValue,

                        unit:
                          assessment.yieldUnit ||
                          null,
                      }
                    : null,

                maintenanceRequired:
                  Boolean(
                    assessment.maintenanceRequired,
                  ),
              };
            },
          )
          .filter(Boolean);

      /*
       * Latest assessment date.
       */
      const latestAssessment =
        assessments.length
          ? assessments[0]
              .assessmentDate
          : null;

      res
        .set(
          "Cache-Control",
          "no-store",
        )
        .json({
          public: true,

          summary: {
            totalAssessments:
              assessments.length,

            sourcesAssessed:
              assessedSources.size,

            maintenanceRequired,

            latestAssessment,
          },

          statuses:
            statusCounts,

          waterQuality:
            qualityCounts,

          coverage: {
            regions,
            sourceTypes,
          },

          recent,
        });
    } catch (error) {
      console.error(
        "Public water source assessments error:",
        error,
      );

      res.status(503).json({
        message:
          "Public water source assessment data is temporarily unavailable.",
      });
    }
  },
);

module.exports = router;