const { z } = require("zod");
const {
  TYPES,
  STATUSES,
  ORGS,
  UNITS,
  QUALITY,
  PUMPS,
  POWER,
  cleanName,
} = require("../../modules/waterPoint/shared");
const id = z.string().regex(/^[a-f\d]{24}$/i, "Expected a MongoDB ObjectId");
const text = (max = 200) => z.string().trim().max(max);
const name = z.string().transform(cleanName).pipe(z.string().min(1).max(120));
const code = text(30)
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9_-]*$/))
  .nullable()
  .optional();
const number = z.number().finite().nonnegative();
const year = z
  .number()
  .int()
  .min(1800)
  .refine(
    (v) => v <= new Date().getUTCFullYear(),
    "Construction year cannot be in the future",
  );
const date = z
  .union([z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((v) => new Date(v))
  .refine(
    (v) => Number.isFinite(v.getTime()) && v <= new Date(),
    "Date must be valid and not in the future",
  );
const yieldRule = (v, ctx) => {
  if (v.yieldValue !== undefined && !v.yieldUnit)
    ctx.addIssue({
      code: "custom",
      path: ["yieldUnit"],
      message: "Yield value requires a unit",
    });
};
const implementation = z
  .object({
    organizationType: z.enum(ORGS).optional(),
    implementingOrganization: text().optional(),
    fundingPartner: text().optional(),
    contractorCompany: text().optional(),
    projectOrProgramName: text().optional(),
    yearConstructed: year.optional(),
    completionDate: date.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.completionDate &&
      v.yearConstructed !== undefined &&
      v.completionDate.getUTCFullYear() !== v.yearConstructed
    )
      ctx.addIssue({
        code: "custom",
        path: ["completionDate"],
        message: "Completion date must match construction year",
      });
  });
const technical = z
  .object({
    depthMeters: number.optional(),
    yieldValue: number.optional(),
    yieldUnit: z.enum(UNITS).optional(),
    waterQuality: z.enum(QUALITY).optional(),
    pumpType: z.enum(PUMPS).optional(),
    powerSource: z.enum(POWER).optional(),
  })
  .strict()
  .superRefine(yieldRule);
const pointFields = {
  waterPointName: text().optional(),
  waterSourceType: z.enum(TYPES),
  region: id,
  district: id,
  villageOrSite: text().min(1),
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([
        z.number().finite().min(-180).max(180),
        z.number().finite().min(-90).max(90),
      ]),
    })
    .strict(),
  status: z.enum(STATUSES),
  implementation: implementation.optional(),
  technical: technical.optional(),
  beneficiaries: z
    .object({
      estimatedPopulationServed: number
        .int()
        .max(Number.MAX_SAFE_INTEGER)
        .optional(),
      estimatedHouseholdsServed: number
        .int()
        .max(Number.MAX_SAFE_INTEGER)
        .optional(),
      managementType: text().optional(),
    })
    .strict()
    .optional(),
  notes: text(5000).optional(),
};
const pointCreate = z.object(pointFields).strict();
const pointUpdate = pointCreate
  .omit({ waterSourceType: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No changes supplied");
const regionCreate = z
  .object({ name, code, isActive: z.boolean().optional() })
  .strict();
const regionUpdate = regionCreate
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No changes supplied");
const districtCreate = regionCreate.extend({ region: id });
const assessmentCreate = z
  .object({
    assessmentDate: date,
    status: z.enum(STATUSES),
    waterQuality: z.enum(QUALITY).optional(),
    yieldValue: number.optional(),
    yieldUnit: z.enum(UNITS).optional(),
    conditionNotes: text(5000).optional(),
    maintenanceRequired: z.boolean().optional(),
    assessedByName: text().optional(),
  })
  .strict()
  .superRefine(yieldRule);
const integerQuery = (fallback, max) =>
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(max))
    .prefault(String(fallback));
const boolQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .prefault("true");
const filterFields = {
  region: id.optional(),
  district: id.optional(),
  villageOrSite: text(200).min(1).optional(),
  waterSourceType: z.enum(TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  organizationType: z.enum(ORGS).optional(),
  implementingOrganization: text().min(1).optional(),
  fundingPartner: text().min(1).optional(),
  contractorCompany: text().min(1).optional(),
  yearConstructed: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number)
    .pipe(year)
    .optional(),
  search: text(100).min(1).optional(),
  isActive: boolQuery,
};
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
  .default("-createdAt");
const pointQuery = z
  .object({
    ...filterFields,
    page: integerQuery(1, 10000),
    limit: integerQuery(50, 100),
    sort,
  })
  .strict();
const gisQuery = pointQuery.extend({ limit: integerQuery(200, 500) });
const numericQuery = (min, max) =>
  z
    .string()
    .regex(/^-?(?:\d+(?:\.\d*)?|\.\d+)$/)
    .transform(Number)
    .pipe(z.number().finite().min(min).max(max));
const nearbyQuery = z
  .object({
    ...filterFields,
    lat: numericQuery(-90, 90),
    lng: numericQuery(-180, 180),
    radiusKm: numericQuery(0.001, 100).prefault("10"),
    limit: integerQuery(50, 100),
  })
  .strict();
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
      .default("region"),
    page: integerQuery(1, 10000),
    limit: integerQuery(50, 100),
  })
  .strict();
const masterQuery = z
  .object({
    search: text(100).min(1).optional(),
    isActive: boolQuery,
    page: integerQuery(1, 10000),
    limit: integerQuery(50, 100),
  })
  .strict();
const districtQuery = masterQuery.extend({ region: id.optional() });
const historyQuery = z
  .object({ page: integerQuery(1, 10000), limit: integerQuery(50, 100) })
  .strict();
const validate =
  (schema, target = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid request",
          errors: result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        });
    req[target === "query" ? "registryQuery" : "registryBody"] = result.data;
    next();
  };
const params =
  (...names) =>
  (req, res, next) => {
    for (const key of names)
      if (!id.safeParse(req.params[key]).success)
        return res
          .status(400)
          .json({ success: false, message: "Invalid " + key, errors: [] });
    next();
  };
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
  masterQuery,
  districtQuery,
  historyQuery,
  validate,
  params,
};
