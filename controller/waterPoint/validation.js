



const { z } = require("zod");

const {
  TYPES,
  STATUSES,
  ORGS,
  UNITS,
  QUALITY,
  PUMPS,
  POWER,

  CHLORINATION_STATUSES,
  MANAGEMENT_TYPES,
  FLOOD_IMPACTS,
  FLOOD_EXPOSURES,
  RISK_LEVELS,
  STRUCTURAL_CONDITIONS,
  YES_NO_UNKNOWN,
  RISK_CATEGORIES,
  ACTION_PRIORITIES,
  ACTION_STATUSES,

  cleanName,
} = require("../../modules/waterPoint/shared");

/*
|--------------------------------------------------------------------------
| COMMON VALIDATION RULES
|--------------------------------------------------------------------------
*/

const id = z
  .string()
  .regex(
    /^[a-f\d]{24}$/i,
    "Expected a MongoDB ObjectId",
  );

const text = (max = 200) =>
  z.string().trim().max(max);

const name = z
  .string()
  .transform(cleanName)
  .pipe(
    z
      .string()
      .min(1)
      .max(120),
  );

const code = text(30)
  .transform((value) =>
    value.toUpperCase(),
  )
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z0-9_-]*$/,
        "Invalid code format",
      ),
  )
  .nullable()
  .optional();

const number = z
  .number()
  .finite()
  .nonnegative();

const integer = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);

const scoreInput = z
  .number()
  .int()
  .min(1)
  .max(5);

const year = z
  .number()
  .int()
  .min(1800)
  .refine(
    (value) =>
      value <=
      new Date().getUTCFullYear(),
    "Construction year cannot be in the future",
  );

/*
|--------------------------------------------------------------------------
| PAST / CURRENT DATE
|--------------------------------------------------------------------------
*/

const date = z
  .union([
    z.iso.date(),
    z.iso.datetime({
      offset: true,
    }),
  ])
  .transform(
    (value) =>
      new Date(value),
  )
  .refine(
    (value) =>
      Number.isFinite(
        value.getTime(),
      ) &&
      value <= new Date(),
    "Date must be valid and not in the future",
  );

/*
|--------------------------------------------------------------------------
| ANY VALID DATE
|--------------------------------------------------------------------------
|
| Used for Target Completion Date,
| because that date may be in the future.
|
*/

const anyDate = z
  .union([
    z.iso.date(),
    z.iso.datetime({
      offset: true,
    }),
  ])
  .transform(
    (value) =>
      new Date(value),
  )
  .refine(
    (value) =>
      Number.isFinite(
        value.getTime(),
      ),
    "Date must be valid",
  );

/*
|--------------------------------------------------------------------------
| YIELD VALIDATION
|--------------------------------------------------------------------------
*/

const yieldRule = (
  value,
  ctx,
) => {
  if (
    value.yieldValue !==
      undefined &&
    !value.yieldUnit
  ) {
    ctx.addIssue({
      code: "custom",

      path: [
        "yieldUnit",
      ],

      message:
        "Yield value requires a unit",
    });
  }
};

/*
|--------------------------------------------------------------------------
| IMPLEMENTATION DETAILS
|--------------------------------------------------------------------------
*/

const implementation = z
  .object({
    organizationType:
      z.enum(ORGS).optional(),

    implementingOrganization:
      text().optional(),

    fundingPartner:
      text().optional(),

    contractorCompany:
      text().optional(),

    projectOrProgramName:
      text().optional(),

    yearConstructed:
      year.optional(),

    completionDate:
      date.optional(),
  })
  .strict()
  .superRefine(
    (value, ctx) => {
      if (
        value.completionDate &&
        value.yearConstructed !==
          undefined &&
        value.completionDate.getUTCFullYear() !==
          value.yearConstructed
      ) {
        ctx.addIssue({
          code: "custom",

          path: [
            "completionDate",
          ],

          message:
            "Completion date must match construction year",
        });
      }
    },
  );

/*
|--------------------------------------------------------------------------
| TECHNICAL DETAILS
|--------------------------------------------------------------------------
*/

const technical = z
  .object({
    depthMeters:
      number.optional(),

    yieldValue:
      number.optional(),

    yieldUnit:
      z
        .enum(UNITS)
        .optional(),

    waterQuality:
      z
        .enum(QUALITY)
        .optional(),

    pumpType:
      z
        .enum(PUMPS)
        .optional(),

    powerSource:
      z
        .enum(POWER)
        .optional(),
  })
  .strict()
  .superRefine(
    yieldRule,
  );

/*
|--------------------------------------------------------------------------
| WATER POINT MASTER PROFILE
|--------------------------------------------------------------------------
*/

const pointFields = {
  waterPointName:
    text().optional(),

  waterSourceType:
    z.enum(TYPES),

  region:
    id,

  district:
    id,

  villageOrSite:
    text()
      .min(1),

  location: z
    .object({
      type:
        z.literal("Point"),

      coordinates:
        z.tuple([
          z
            .number()
            .finite()
            .min(-180)
            .max(180),

          z
            .number()
            .finite()
            .min(-90)
            .max(90),
        ]),
    })
    .strict(),

  status:
    z.enum(STATUSES),

  implementation:
    implementation.optional(),

  technical:
    technical.optional(),

  beneficiaries: z
    .object({
      estimatedPopulationServed:
        integer.optional(),

      estimatedHouseholdsServed:
        integer.optional(),

      /*
       * Existing WaterPoint model stores
       * managementType as text.
       *
       * Keep this compatible with old data.
       */
      managementType:
        text().optional(),
    })
    .strict()
    .optional(),

  notes:
    text(5000)
      .optional(),
};

const pointCreate = z
  .object(
    pointFields,
  )
  .strict();

const pointUpdate =
  pointCreate
    .omit({
      waterSourceType:
        true,
    })
    .partial()
    .refine(
      (value) =>
        Object.keys(
          value,
        ).length > 0,
      "No changes supplied",
    );

/*
|--------------------------------------------------------------------------
| REGION
|--------------------------------------------------------------------------
*/

const regionCreate = z
  .object({
    name,

    code,

    isActive:
      z
        .boolean()
        .optional(),
  })
  .strict();

const regionUpdate =
  regionCreate
    .partial()
    .refine(
      (value) =>
        Object.keys(
          value,
        ).length > 0,
      "No changes supplied",
    );

/*
|--------------------------------------------------------------------------
| DISTRICT
|--------------------------------------------------------------------------
*/

const districtCreate =
  regionCreate.extend({
    region: id,
  });

/*
|--------------------------------------------------------------------------
| ASSESSMENT CREATE
|--------------------------------------------------------------------------
|
| riskScore and riskCategory are deliberately
| NOT accepted from the client.
|
| Backend/model calculates them from:
|
| likelihood × impact
|
*/

const assessmentCreate = z
  .object({
    /*
    |--------------------------------------------------------------------------
    | BASIC ASSESSMENT
    |--------------------------------------------------------------------------
    */

    assessmentDate:
      date,

    status:
      z.enum(STATUSES),

    /*
    |--------------------------------------------------------------------------
    | CURRENT TECHNICAL CONDITION
    |--------------------------------------------------------------------------
    */

    yieldValue:
      number.optional(),

    yieldUnit:
      z
        .enum(UNITS)
        .optional(),

    storageAvailableM3:
      number.optional(),

    waterQuality:
      z
        .enum(QUALITY)
        .optional(),

    chlorinationStatus:
      z
        .enum(
          CHLORINATION_STATUSES,
        )
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | BENEFICIARIES & MANAGEMENT
    |--------------------------------------------------------------------------
    */

    estimatedPopulationServed:
      integer.optional(),

    estimatedHouseholdsServed:
      integer.optional(),

    managementType:
      z
        .enum(
          MANAGEMENT_TYPES,
        )
        .optional(),

    managementOperatorName:
      text(300)
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | FLOOD RISK ASSESSMENT
    |--------------------------------------------------------------------------
    */

    floodImpact2023:
      z
        .enum(
          FLOOD_IMPACTS,
        )
        .optional(),

    floodDamageDisruption2023:
      text(5000)
        .optional(),

    currentFloodExposure:
      z
        .enum(
          FLOOD_EXPOSURES,
        )
        .optional(),

    distanceToRiverWadiDrainageM:
      number.optional(),

    accessRisk:
      z
        .enum(
          RISK_LEVELS,
        )
        .optional(),

    contaminationRisk:
      z
        .enum(
          RISK_LEVELS,
        )
        .optional(),

    structuralProtectionCondition:
      z
        .enum(
          STRUCTURAL_CONDITIONS,
        )
        .optional(),

    alternativeWaterSourceAvailable:
      z
        .enum(
          YES_NO_UNKNOWN,
        )
        .optional(),

    alternativeSourceDistanceKm:
      number.optional(),

    criticalFacilitiesSettlementsServed:
      text(5000)
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | RISK SCORING
    |--------------------------------------------------------------------------
    */

    likelihood:
      scoreInput,

    impact:
      scoreInput,

    /*
    |--------------------------------------------------------------------------
    | MITIGATION & ACTION PLAN
    |--------------------------------------------------------------------------
    */

    recommendedImmediateAction:
      text(5000)
        .optional(),

    preFloodMitigationRequired:
      text(5000)
        .optional(),

    actionPriority:
      z
        .enum(
          ACTION_PRIORITIES,
        )
        .optional(),

    responsibleFocalAgency:
      text(500)
        .optional(),

    targetCompletionDate:
      anyDate.optional(),

    estimatedCostUSD:
      number.optional(),

    actionStatus:
      z
        .enum(
          ACTION_STATUSES,
        )
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | ASSESSOR INFORMATION
    |--------------------------------------------------------------------------
    */

    assessorName:
      text(300)
        .optional(),

    assessorContact:
      text(300)
        .optional(),

    /*
     * Existing legacy field.
     */
    assessedByName:
      text(300)
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | LEGACY ASSESSMENT FIELDS
    |--------------------------------------------------------------------------
    */

    conditionNotes:
      text(5000)
        .optional(),

    maintenanceRequired:
      z
        .boolean()
        .optional(),
  })
  .strict()
  .superRefine(
    (value, ctx) => {
      /*
       * Current yield requires a unit.
       */
      yieldRule(
        value,
        ctx,
      );

      /*
       * Alternative Source Distance can only
       * be supplied when an alternative source
       * is available.
       */
      if (
        value.alternativeSourceDistanceKm !==
          undefined &&
        value.alternativeWaterSourceAvailable !==
          "YES"
      ) {
        ctx.addIssue({
          code: "custom",

          path: [
            "alternativeSourceDistanceKm",
          ],

          message:
            "Alternative source distance is only applicable when Alternative Water Source Available is YES",
        });
      }

      /*
       * If Alternative Water Source = YES,
       * its distance is required.
       */
      if (
        value.alternativeWaterSourceAvailable ===
          "YES" &&
        value.alternativeSourceDistanceKm ===
          undefined
      ) {
        ctx.addIssue({
          code: "custom",

          path: [
            "alternativeSourceDistanceKm",
          ],

          message:
            "Alternative source distance is required when an alternative water source is available",
        });
      }
    },
  );

/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

const integerQuery = (
  fallback,
  max,
) =>
  z
    .string()
    .regex(
      /^\d+$/,
    )
    .transform(
      Number,
    )
    .pipe(
      z
        .number()
        .int()
        .min(1)
        .max(max),
    )
    .prefault(
      String(
        fallback,
      ),
    );

/*
|--------------------------------------------------------------------------
| BOOLEAN QUERY
|--------------------------------------------------------------------------
*/

const boolQuery = z
  .enum([
    "true",
    "false",
  ])
  .transform(
    (value) =>
      value === "true",
  )
  .prefault(
    "true",
  );

/*
|--------------------------------------------------------------------------
| WATER POINT FILTERS
|--------------------------------------------------------------------------
*/

const filterFields = {
  region:
    id.optional(),

  district:
    id.optional(),

  villageOrSite:
    text(200)
      .min(1)
      .optional(),

  waterSourceType:
    z
      .enum(TYPES)
      .optional(),

  status:
    z
      .enum(STATUSES)
      .optional(),

  organizationType:
    z
      .enum(ORGS)
      .optional(),

  implementingOrganization:
    text()
      .min(1)
      .optional(),

  fundingPartner:
    text()
      .min(1)
      .optional(),

  contractorCompany:
    text()
      .min(1)
      .optional(),

  yearConstructed:
    z
      .string()
      .regex(
        /^\d{4}$/,
      )
      .transform(
        Number,
      )
      .pipe(
        year,
      )
      .optional(),

  search:
    text(100)
      .min(1)
      .optional(),

  isActive:
    boolQuery,
};

/*
|--------------------------------------------------------------------------
| WATER POINT SORTING
|--------------------------------------------------------------------------
*/

const sort = z
  .enum([
    "createdAt",
    "-createdAt",

    "waterPointCode",
    "-waterPointCode",

    "waterPointName",
    "-waterPointName",

    "yearConstructed",
    "-yearConstructed",
  ])
  .default(
    "-createdAt",
  );

/*
|--------------------------------------------------------------------------
| WATER POINT LIST
|--------------------------------------------------------------------------
*/

const pointQuery = z
  .object({
    ...filterFields,

    page:
      integerQuery(
        1,
        10000,
      ),

    limit:
      integerQuery(
        50,
        100,
      ),

    sort,
  })
  .strict();

/*
|--------------------------------------------------------------------------
| GIS QUERY
|--------------------------------------------------------------------------
*/

const gisQuery =
  pointQuery.extend({
    limit:
      integerQuery(
        200,
        500,
      ),
  });

/*
|--------------------------------------------------------------------------
| NUMERIC QUERY
|--------------------------------------------------------------------------
*/

const numericQuery = (
  min,
  max,
) =>
  z
    .string()
    .regex(
      /^-?(?:\d+(?:\.\d*)?|\.\d+)$/,
    )
    .transform(
      Number,
    )
    .pipe(
      z
        .number()
        .finite()
        .min(min)
        .max(max),
    );

/*
|--------------------------------------------------------------------------
| NEARBY QUERY
|--------------------------------------------------------------------------
*/

const nearbyQuery = z
  .object({
    ...filterFields,

    lat:
      numericQuery(
        -90,
        90,
      ),

    lng:
      numericQuery(
        -180,
        180,
      ),

    radiusKm:
      numericQuery(
        0.001,
        100,
      ).prefault(
        "10",
      ),

    limit:
      integerQuery(
        50,
        100,
      ),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| WATER POINT REPORT QUERY
|--------------------------------------------------------------------------
*/

const reportQuery = z
  .object({
    ...filterFields,

    groupBy: z
      .enum([
        "region",
        "district",
        "villageOrSite",
        "waterSourceType",
        "status",
        "implementingOrganization",
        "contractorCompany",
        "fundingPartner",
        "yearConstructed",
      ])
      .default(
        "region",
      ),

    page:
      integerQuery(
        1,
        10000,
      ),

    limit:
      integerQuery(
        50,
        100,
      ),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| MASTER DATA QUERY
|--------------------------------------------------------------------------
*/

const masterQuery = z
  .object({
    search:
      text(100)
        .min(1)
        .optional(),

    isActive:
      boolQuery,

    page:
      integerQuery(
        1,
        10000,
      ),

    limit:
      integerQuery(
        50,
        100,
      ),
  })
  .strict();

const districtQuery =
  masterQuery.extend({
    region:
      id.optional(),
  });

/*
|--------------------------------------------------------------------------
| ASSESSMENT HISTORY QUERY
|--------------------------------------------------------------------------
*/

const historyQuery = z
  .object({
    page:
      integerQuery(
        1,
        10000,
      ),

    limit:
      integerQuery(
        50,
        100,
      ),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| ASSESSMENT REPORT DATE
|--------------------------------------------------------------------------
*/

const reportDateQuery = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Expected date in YYYY-MM-DD format",
  )
  .refine(
    (value) => {
      const parsed =
        new Date(
          `${value}T00:00:00.000Z`,
        );

      if (
        !Number.isFinite(
          parsed.getTime(),
        )
      ) {
        return false;
      }

      /*
       * Prevent invalid dates such as:
       * 2026-02-31
       */
      return (
        parsed
          .toISOString()
          .slice(
            0,
            10,
          ) === value
      );
    },

    "Invalid date",
  );

/*
|--------------------------------------------------------------------------
| ASSESSMENT REPORT QUERY
|--------------------------------------------------------------------------
|
| Used by:
|
| GET /assessment-reports
| GET /assessment-reports/summary
| GET /assessment-reports/export
|
*/

const assessmentReportQuery = z
  .object({
    /*
    |--------------------------------------------------------------------------
    | WATER SOURCE FILTERS
    |--------------------------------------------------------------------------
    */

    region:
      id.optional(),

    district:
      id.optional(),

    waterSourceType:
      z
        .enum(TYPES)
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | ASSESSMENT FILTERS
    |--------------------------------------------------------------------------
    */

    status:
      z
        .enum(STATUSES)
        .optional(),

    riskCategory:
      z
        .enum(
          RISK_CATEGORIES,
        )
        .optional(),

    actionPriority:
      z
        .enum(
          ACTION_PRIORITIES,
        )
        .optional(),

    actionStatus:
      z
        .enum(
          ACTION_STATUSES,
        )
        .optional(),

    /*
     * Account that created the Assessment.
     */
    createdBy:
      id.optional(),

    /*
    |--------------------------------------------------------------------------
    | ASSESSMENT DATE RANGE
    |--------------------------------------------------------------------------
    */

    dateFrom:
      reportDateQuery
        .optional(),

    dateTo:
      reportDateQuery
        .optional(),

    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    page:
      integerQuery(
        1,
        10000,
      ),

    limit:
      integerQuery(
        50,
        100,
      ),
  })
  .strict()
  .superRefine(
    (value, ctx) => {
      if (
        value.dateFrom &&
        value.dateTo &&
        value.dateFrom >
          value.dateTo
      ) {
        ctx.addIssue({
          code: "custom",

          path: [
            "dateTo",
          ],

          message:
            "dateTo cannot be earlier than dateFrom",
        });
      }
    },
  );

/*
|--------------------------------------------------------------------------
| VALIDATION MIDDLEWARE
|--------------------------------------------------------------------------
*/

const validate =
  (
    schema,
    target = "body",
  ) =>
  (
    req,
    res,
    next,
  ) => {
    const result =
      schema.safeParse(
        req[target],
      );

    if (
      !result.success
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid request",

          errors:
            result.error.issues.map(
              (issue) => ({
                field:
                  issue.path.join(
                    ".",
                  ),

                message:
                  issue.message,
              }),
            ),
        });
    }

    req[
      target === "query"
        ? "registryQuery"
        : "registryBody"
    ] = result.data;

    next();
  };

/*
|--------------------------------------------------------------------------
| PARAM VALIDATION
|--------------------------------------------------------------------------
*/

const params =
  (...names) =>
  (
    req,
    res,
    next,
  ) => {
    for (
      const key of names
    ) {
      if (
        !id.safeParse(
          req.params[key],
        ).success
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid " +
              key,

            errors: [],
          });
      }
    }

    next();
  };

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  pointCreate,
  pointUpdate,

  regionCreate,
  regionUpdate,
  districtCreate,

  assessmentCreate,

  pointQuery,
  gisQuery,
  nearbyQuery,

  reportQuery,
  assessmentReportQuery,

  masterQuery,
  districtQuery,

  historyQuery,

  validate,
  params,
};