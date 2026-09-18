const Assessment = require(
  "../../modules/waterPoint/waterPointAssessmentModel",
);

const {
  WaterPoint,
  send,
  pagination,
  meta,
} = require("./common");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const safeText = (value) =>
  value == null ? "" : String(value);

const enumLabel = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .split("_")
        .map(
          (part) =>
            part.charAt(0).toUpperCase() +
            part.slice(1),
        )
        .join(" ")
    : "";

const dateOnly = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
};

/*
|--------------------------------------------------------------------------
| YIELD -> m3/day
|--------------------------------------------------------------------------
|
| Official 42-column assessment template uses:
|
| Current Yield / Capacity (m3/day)
|
| Registry currently supports:
|
| M3_PER_HOUR
| LITERS_PER_SECOND
| LITERS_PER_MINUTE
|
| Convert them for the official export.
|
*/

function yieldM3PerDay(
  value,
  unit,
) {
  if (
    value == null ||
    !Number.isFinite(
      Number(value),
    )
  ) {
    return "";
  }

  const number =
    Number(value);

  switch (unit) {
    case "M3_PER_HOUR":
      return number * 24;

    case "LITERS_PER_SECOND":
      return number * 86.4;

    case "LITERS_PER_MINUTE":
      return number * 1.44;

    default:
      return "";
  }
}

/*
|--------------------------------------------------------------------------
| GPS
|--------------------------------------------------------------------------
|
| GeoJSON order:
|
| coordinates[0] = Longitude
| coordinates[1] = Latitude
|
*/

const latitude = (point) =>
  Array.isArray(
    point?.location?.coordinates,
  )
    ? point.location.coordinates[1]
    : "";

const longitude = (point) =>
  Array.isArray(
    point?.location?.coordinates,
  )
    ? point.location.coordinates[0]
    : "";

/*
|--------------------------------------------------------------------------
| WATER QUALITY / CHLORINATION
|--------------------------------------------------------------------------
*/

function qualityAndChlorination(
  assessment,
) {
  const quality =
    enumLabel(
      assessment.waterQuality,
    );

  const chlorination =
    enumLabel(
      assessment.chlorinationStatus,
    );

  if (
    quality &&
    chlorination
  ) {
    return `${quality} / ${chlorination}`;
  }

  return (
    quality ||
    chlorination ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| MANAGEMENT / OPERATOR
|--------------------------------------------------------------------------
*/

function managementOperator(
  assessment,
) {
  const type =
    enumLabel(
      assessment.managementType,
    );

  const operator =
    safeText(
      assessment.managementOperatorName,
    );

  if (
    type &&
    operator
  ) {
    return `${type} - ${operator}`;
  }

  return (
    operator ||
    type ||
    ""
  );
}

/*
|--------------------------------------------------------------------------
| EVIDENCE LINKS
|--------------------------------------------------------------------------
*/

function evidenceLinks(
  assessment,
) {
  const files = [
    ...(assessment.assessmentDocuments ||
      []),

    /*
     * Legacy assessment photos remain
     * included for backward compatibility.
     */
    ...(assessment.photos ||
      []),
  ];

  return files
    .map((file) => file.url)
    .filter(Boolean)
    .join(" | ");
}

/*
|--------------------------------------------------------------------------
| CSV
|--------------------------------------------------------------------------
*/

function csvCell(value) {
  const string =
    value == null
      ? ""
      : String(value);

  return `"${string.replace(
    /"/g,
    '""',
  )}"`;
}

/*
|--------------------------------------------------------------------------
| EXACT 42-COLUMN OFFICIAL EXPORT
|--------------------------------------------------------------------------
*/

const EXPORT_COLUMNS = [
  {
    header: "S/N",
    value: (_a, _p, index) =>
      index + 1,
  },

  {
    header: "Assessment Date",
    value: (a) =>
      dateOnly(
        a.assessmentDate,
      ),
  },

  {
    header: "Region",
    value: (_a, p) =>
      p?.region?.name || "",
  },

  {
    header: "District",
    value: (_a, p) =>
      p?.district?.name || "",
  },

  {
    header:
      "Village / Settlement",
    value: (_a, p) =>
      p?.villageOrSite || "",
  },

  {
    header:
      "Water Point / Scheme Name",
    value: (_a, p) =>
      p?.waterPointName || "",
  },

  {
    header: "GPS Latitude",
    value: (_a, p) =>
      latitude(p),
  },

  {
    header: "GPS Longitude",
    value: (_a, p) =>
      longitude(p),
  },

  {
    header:
      "Estimated HH Served",
    value: (a) =>
      a.estimatedHouseholdsServed ??
      "",
  },

  {
    header:
      "Estimated Population Served",
    value: (a) =>
      a.estimatedPopulationServed ??
      "",
  },

  {
    header:
      "Water Source Type",
    value: (_a, p) =>
      enumLabel(
        p?.waterSourceType,
      ),
  },

  {
    header:
      "Management / Operator",
    value: (a) =>
      managementOperator(a),
  },

  {
    header:
      "Operational Status",
    value: (a) =>
      enumLabel(a.status),
  },

  {
    header:
      "Current Yield / Capacity (m³/day)",
    value: (a) =>
      yieldM3PerDay(
        a.yieldValue,
        a.yieldUnit,
      ),
  },

  {
    header:
      "Storage Available (m³)",
    value: (a) =>
      a.storageAvailableM3 ??
      "",
  },

  {
    header: "Power Source",
    value: (_a, p) =>
      enumLabel(
        p?.technical
          ?.powerSource,
      ),
  },

  {
    header:
      "Water Quality / Chlorination Status",
    value: (a) =>
      qualityAndChlorination(
        a,
      ),
  },

  {
    header:
      "2023 Flood Impact",
    value: (a) =>
      enumLabel(
        a.floodImpact2023,
      ),
  },

  {
    header:
      "2023 Damage / Service Disruption",
    value: (a) =>
      a.floodDamageDisruption2023 ||
      "",
  },

  {
    header:
      "Current Flood Exposure",
    value: (a) =>
      enumLabel(
        a.currentFloodExposure,
      ),
  },

  {
    header:
      "Distance to River / Wadi / Drainage (m)",
    value: (a) =>
      a.distanceToRiverWadiDrainageM ??
      "",
  },

  {
    header: "Access Risk",
    value: (a) =>
      enumLabel(
        a.accessRisk,
      ),
  },

  {
    header:
      "Contamination Risk",
    value: (a) =>
      enumLabel(
        a.contaminationRisk,
      ),
  },

  {
    header:
      "Structural / Protection Condition",
    value: (a) =>
      enumLabel(
        a.structuralProtectionCondition,
      ),
  },

  {
    header:
      "Alternative Water Source Available?",
    value: (a) =>
      enumLabel(
        a.alternativeWaterSourceAvailable,
      ),
  },

  {
    header:
      "Alternative Source Distance (km)",
    value: (a) =>
      a.alternativeSourceDistanceKm ??
      "",
  },

  {
    header:
      "Critical Facilities / Settlements Served",
    value: (a) =>
      a.criticalFacilitiesSettlementsServed ||
      "",
  },

  {
    header:
      "Likelihood (1–5)",
    value: (a) =>
      a.likelihood ?? "",
  },

  {
    header:
      "Impact (1–5)",
    value: (a) =>
      a.impact ?? "",
  },

  {
    header: "Risk Score",
    value: (a) =>
      a.riskScore ?? "",
  },

  {
    header:
      "Risk Category",
    value: (a) =>
      enumLabel(
        a.riskCategory,
      ),
  },

  {
    header:
      "Recommended Immediate Action",
    value: (a) =>
      a.recommendedImmediateAction ||
      "",
  },

  {
    header:
      "Pre-Flood Mitigation Required",
    value: (a) =>
      a.preFloodMitigationRequired ||
      "",
  },

  {
    header:
      "Action Priority",
    value: (a) =>
      enumLabel(
        a.actionPriority,
      ),
  },

  {
    header:
      "Responsible Focal / Agency",
    value: (a) =>
      a.responsibleFocalAgency ||
      "",
  },

  {
    header:
      "Target Completion Date",
    value: (a) =>
      dateOnly(
        a.targetCompletionDate,
      ),
  },

  {
    header:
      "Estimated Cost (USD)",
    value: (a) =>
      a.estimatedCostUSD ??
      "",
  },

  {
    header:
      "Action Status",
    value: (a) =>
      enumLabel(
        a.actionStatus,
      ),
  },

  {
    header:
      "Photo / Document Link",
    value: (a) =>
      evidenceLinks(a),
  },

  {
    header:
      "Assessor Name",
    value: (a) =>
      a.assessorName ||
      a.assessedByName ||
      a.createdBy?.name ||
      "",
  },

  {
    header:
      "Assessor Contact",
    value: (a) =>
      a.assessorContact ||
      a.createdBy?.email ||
      "",
  },

  {
    header: "Remarks",
    value: (a) =>
      a.conditionNotes || "",
  },
];

/*
|--------------------------------------------------------------------------
| BUILD FILTER
|--------------------------------------------------------------------------
*/

async function buildMatch(q) {
  const match = {};

  /*
   * Assessment-level filters
   */
  if (q.status) {
    match.status = q.status;
  }

  if (q.riskCategory) {
    match.riskCategory =
      q.riskCategory;
  }

  if (q.actionPriority) {
    match.actionPriority =
      q.actionPriority;
  }

  if (q.actionStatus) {
    match.actionStatus =
      q.actionStatus;
  }

  if (q.createdBy) {
    match.createdBy =
      q.createdBy;
  }

  /*
   * Assessment date range
   */
  if (
    q.dateFrom ||
    q.dateTo
  ) {
    match.assessmentDate =
      {};

    if (q.dateFrom) {
      match.assessmentDate.$gte =
        new Date(
          `${q.dateFrom}T00:00:00.000Z`,
        );
    }

    if (q.dateTo) {
      match.assessmentDate.$lte =
        new Date(
          `${q.dateTo}T23:59:59.999Z`,
        );
    }
  }

  /*
   * Water Source-level filters
   */
  const pointMatch = {};

  if (q.region) {
    pointMatch.region =
      q.region;
  }

  if (q.district) {
    pointMatch.district =
      q.district;
  }

  if (q.waterSourceType) {
    pointMatch.waterSourceType =
      q.waterSourceType;
  }

  if (
    Object.keys(pointMatch)
      .length
  ) {
    const pointIds =
      await WaterPoint.find(
        pointMatch,
      ).distinct("_id");

    /*
     * No matching Water Sources means
     * no matching Assessments.
     */
    match.waterPoint = {
      $in: pointIds,
    };
  }

  return match;
}

/*
|--------------------------------------------------------------------------
| POPULATION
|--------------------------------------------------------------------------
*/

function populateAssessment(
  query,
) {
  return query
    .populate({
      path: "waterPoint",

      select: [
        "waterPointCode",
        "waterPointName",
        "waterSourceType",
        "region",
        "district",
        "villageOrSite",
        "location",
        "technical",
      ].join(" "),

      populate: [
        {
          path: "region",
          select:
            "name code",
        },

        {
          path: "district",
          select:
            "name code region",
        },
      ],
    })

    .populate(
      "createdBy",
      "name email role",
    );
}

/*
|--------------------------------------------------------------------------
| ASSESSMENT REPORT LIST
|--------------------------------------------------------------------------
*/

exports.list = async (
  req,
  res,
) => {
  const q =
    req.registryQuery;

  const p =
    pagination(q);

  const match =
    await buildMatch(q);

  const [data, total] =
    await Promise.all([
      populateAssessment(
        Assessment.find(match)
          .sort({
            assessmentDate:
              -1,

            _id: -1,
          })
          .skip(p.skip)
          .limit(p.limit),
      ).lean(),

      Assessment.countDocuments(
        match,
      ),
    ]);

  send(
    res,
    data,
    "Assessment report",
    200,
    meta(p, total),
  );
};

/*
|--------------------------------------------------------------------------
| ASSESSMENT REPORT SUMMARY
|--------------------------------------------------------------------------
*/

exports.summary = async (
  req,
  res,
) => {
  const q =
    req.registryQuery;

  const match =
    await buildMatch(q);

  const [result] =
    await Assessment.aggregate([
      {
        $match: match,
      },

      {
        $facet: {
          total: [
            {
              $count: "count",
            },
          ],

          riskCategories: [
            {
              $group: {
                _id:
                  "$riskCategory",

                count: {
                  $sum: 1,
                },
              },
            },
          ],

          operationalStatuses: [
            {
              $group: {
                _id:
                  "$status",

                count: {
                  $sum: 1,
                },
              },
            },
          ],

          actionStatuses: [
            {
              $group: {
                _id:
                  "$actionStatus",

                count: {
                  $sum: 1,
                },
              },
            },
          ],

          estimatedCost: [
            {
              $group: {
                _id: null,

                total: {
                  $sum: {
                    $ifNull: [
                      "$estimatedCostUSD",
                      0,
                    ],
                  },
                },
              },
            },
          ],

          population: [
            {
              $group: {
                _id: null,

                populationServed:
                  {
                    $sum: {
                      $ifNull: [
                        "$estimatedPopulationServed",
                        0,
                      ],
                    },
                  },

                householdsServed:
                  {
                    $sum: {
                      $ifNull: [
                        "$estimatedHouseholdsServed",
                        0,
                      ],
                    },
                  },
              },
            },
          ],
        },
      },
    ]).option({
      maxTimeMS: 10000,
    });

  const toObject = (
    rows,
  ) =>
    Object.fromEntries(
      rows
        .filter(
          (row) => row._id,
        )
        .map((row) => [
          row._id,
          row.count,
        ]),
    );

  send(
    res,
    {
      totalAssessments:
        result.total[0]
          ?.count || 0,

      riskCategories:
        toObject(
          result.riskCategories,
        ),

      operationalStatuses:
        toObject(
          result.operationalStatuses,
        ),

      actionStatuses:
        toObject(
          result.actionStatuses,
        ),

      estimatedCostUSD:
        result.estimatedCost[0]
          ?.total || 0,

      estimatedPopulationServed:
        result.population[0]
          ?.populationServed ||
        0,

      estimatedHouseholdsServed:
        result.population[0]
          ?.householdsServed ||
        0,
    },

    "Assessment report summary",
  );
};

/*
|--------------------------------------------------------------------------
| OFFICIAL 42-COLUMN CSV EXPORT
|--------------------------------------------------------------------------
|
| No new npm dependency is required.
|
*/

exports.exportCsv = async (
  req,
  res,
) => {
  const q =
    req.registryQuery;

  const match =
    await buildMatch(q);

  /*
   * Protect server memory from accidental
   * unlimited export requests.
   */
  const MAX_EXPORT_ROWS =
    10000;

  const assessments =
    await populateAssessment(
      Assessment.find(match)
        .sort({
          assessmentDate: 1,
          _id: 1,
        })
        .limit(
          MAX_EXPORT_ROWS,
        ),
    ).lean();

  const header =
    EXPORT_COLUMNS.map(
      (column) =>
        csvCell(
          column.header,
        ),
    ).join(",");

  const rows =
    assessments.map(
      (
        assessment,
        index,
      ) => {
        const point =
          assessment.waterPoint ||
          {};

        return EXPORT_COLUMNS.map(
          (column) =>
            csvCell(
              column.value(
                assessment,
                point,
                index,
              ),
            ),
        ).join(",");
      },
    );

  /*
   * UTF-8 BOM improves Excel compatibility,
   * especially for non-English names.
   */
  const csv =
    "\uFEFF" +
    [
      header,
      ...rows,
    ].join("\r\n");

  const fileName =
    `jubaland-water-assessment-` +
    `${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  res.status(200);

  res.set({
    "Content-Type":
      "text/csv; charset=utf-8",

    "Content-Disposition":
      `attachment; filename="${fileName}"`,

    "Cache-Control":
      "private, no-store",

    "X-Content-Type-Options":
      "nosniff",
  });

  return res.send(csv);
};

/*
|--------------------------------------------------------------------------
| EXPORT COLUMN INFORMATION
|--------------------------------------------------------------------------
|
| Useful for backend tests and future frontend.
|
*/

exports.EXPORT_COLUMNS =
  EXPORT_COLUMNS;