// const {
//   WaterPoint,
//   Region,
//   District,
//   send,
//   filters,
//   pagination,
//   meta,
// } = require("./common");
// const { STATUSES } = require("../../modules/waterPoint/shared");
// const counts = {
//   totalWaterPoints: { $sum: 1 },
//   boreholes: {
//     $sum: { $cond: [{ $eq: ["$waterSourceType", "BOREHOLE"] }, 1, 0] },
//   },
//   shallowWells: {
//     $sum: { $cond: [{ $eq: ["$waterSourceType", "SHALLOW_WELL"] }, 1, 0] },
//   },
// };
// exports.summary = async (req, res) => {
//   const q = req.registryQuery,
//     p = pagination(q),
//     match = filters(q);
//   const field = [
//     "implementingOrganization",
//     "contractorCompany",
//     "fundingPartner",
//     "yearConstructed",
//   ].includes(q.groupBy)
//     ? "implementation." + q.groupBy
//     : q.groupBy;
//   const [result] = await WaterPoint.aggregate([
//     { $match: match },
//     {
//       $facet: {
//         totals: [{ $group: { _id: null, ...counts } }],
//         statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
//         groups: [
//           { $group: { _id: { $ifNull: ["$" + field, null] }, ...counts } },
//           { $sort: { _id: 1 } },
//           { $skip: p.skip },
//           { $limit: p.limit },
//         ],
//         groupCount: [
//           { $group: { _id: { $ifNull: ["$" + field, null] } } },
//           { $count: "count" },
//         ],
//       },
//     },
//   ]).option({ maxTimeMS: 10000 });
//   const totals = result.totals[0] || {
//     totalWaterPoints: 0,
//     boreholes: 0,
//     shallowWells: 0,
//   };
//   delete totals._id;
//   const statuses = Object.fromEntries(STATUSES.map((s) => [s, 0]));
//   for (const s of result.statuses) statuses[s._id] = s.count;
//   const groupModel =
//     q.groupBy === "region"
//       ? Region
//       : q.groupBy === "district"
//         ? District
//         : null;
//   const names = groupModel
//     ? await groupModel
//         .find({ _id: { $in: result.groups.map((g) => g._id).filter(Boolean) } })
//         .select("name region")
//         .lean()
//     : [];
//   const groups = result.groups.map((g) => ({
//     key: g._id,
//     name: names.find((n) => String(n._id) === String(g._id))?.name ?? g._id,
//     totalWaterPoints: g.totalWaterPoints,
//     boreholes: g.boreholes,
//     shallowWells: g.shallowWells,
//   }));
//   const { page, limit, groupBy, ...scope } = q;
//   send(
//     res,
//     { scope, ...totals, statuses, groupBy, groups },
//     "Registry summary",
//     200,
//     meta(p, result.groupCount[0]?.count || 0),
//   );
// };

const {
  WaterPoint,
  Region,
  District,
  send,
  filters,
  pagination,
  meta,
} = require("./common");

const { STATUSES } = require("../../modules/waterPoint/shared");

const counts = {
  totalWaterPoints: { $sum: 1 },

  boreholes: {
    $sum: {
      $cond: [{ $eq: ["$waterSourceType", "BOREHOLE"] }, 1, 0],
    },
  },

  shallowWells: {
    $sum: {
      $cond: [{ $eq: ["$waterSourceType", "SHALLOW_WELL"] }, 1, 0],
    },
  },

  barkads: {
    $sum: {
      $cond: [{ $eq: ["$waterSourceType", "BARKAD"] }, 1, 0],
    },
  },

  waterPans: {
    $sum: {
      $cond: [{ $eq: ["$waterSourceType", "WATER_PAN"] }, 1, 0],
    },
  },

  waterKiosks: {
    $sum: {
      $cond: [{ $eq: ["$waterSourceType", "WATER_KIOSK"] }, 1, 0],
    },
  },
};

exports.summary = async (req, res) => {
  const q = req.registryQuery,
    p = pagination(q),
    match = filters(q);

  const field = [
    "implementingOrganization",
    "contractorCompany",
    "fundingPartner",
    "yearConstructed",
  ].includes(q.groupBy)
    ? "implementation." + q.groupBy
    : q.groupBy;

  const [result] = await WaterPoint.aggregate([
    { $match: match },

    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              ...counts,
            },
          },
        ],

        statuses: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],

        groups: [
          {
            $group: {
              _id: {
                $ifNull: ["$" + field, null],
              },
              ...counts,
            },
          },

          {
            $sort: {
              _id: 1,
            },
          },

          {
            $skip: p.skip,
          },

          {
            $limit: p.limit,
          },
        ],

        groupCount: [
          {
            $group: {
              _id: {
                $ifNull: ["$" + field, null],
              },
            },
          },

          {
            $count: "count",
          },
        ],
      },
    },
  ]).option({ maxTimeMS: 10000 });

  const totals = result.totals[0] || {
    totalWaterPoints: 0,
    boreholes: 0,
    shallowWells: 0,
    barkads: 0,
    waterPans: 0,
    waterKiosks: 0,
  };

  delete totals._id;

  const statuses = Object.fromEntries(
    STATUSES.map((s) => [s, 0]),
  );

  for (const s of result.statuses) {
    statuses[s._id] = s.count;
  }

  const groupModel =
    q.groupBy === "region"
      ? Region
      : q.groupBy === "district"
        ? District
        : null;

  const names = groupModel
    ? await groupModel
        .find({
          _id: {
            $in: result.groups
              .map((g) => g._id)
              .filter(Boolean),
          },
        })
        .select("name region")
        .lean()
    : [];

  const groups = result.groups.map((g) => ({
    key: g._id,

    name:
      names.find(
        (n) => String(n._id) === String(g._id),
      )?.name ?? g._id,

    totalWaterPoints: g.totalWaterPoints,
    boreholes: g.boreholes,
    shallowWells: g.shallowWells,
    barkads: g.barkads,
    waterPans: g.waterPans,
    waterKiosks: g.waterKiosks,
  }));

  const { page, limit, groupBy, ...scope } = q;

  send(
    res,
    {
      scope,
      ...totals,
      statuses,
      groupBy,
      groups,
    },
    "Registry summary",
    200,
    meta(p, result.groupCount[0]?.count || 0),
  );
};