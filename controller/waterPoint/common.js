const mongoose = require("mongoose");
const Region = require("../../modules/waterPoint/regionModel");
const District = require("../../modules/waterPoint/districtModel");
const WaterPoint = require("../../modules/waterPoint/waterPointModel");
class RegistryError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const error = (status, message) => {
  throw new RegistryError(status, message);
};
const send = (res, data, message = "Success", status = 200, meta) =>
  res
    .status(status)
    .json({ success: true, message, data, ...(meta ? { meta } : {}) });
const transaction = (work) =>
  mongoose.connection.transaction(work, {
    readPreference: "primary",
    maxCommitTimeMS: 10000,
  });
// Parent writes serialize deactivation against concurrent child creation/update.
async function activeRegion(id, session) {
  const doc = await Region.findOneAndUpdate(
    { _id: id, isActive: true },
    { $inc: { registryVersion: 1 } },
    { new: true, session, timestamps: false },
  );
  if (!doc) error(422, "Region must exist and be active");
  return doc;
}
async function validLocation(region, district, session) {
  await activeRegion(region, session);
  const doc = await District.findOneAndUpdate(
    { _id: district, region, isActive: true },
    { $inc: { registryVersion: 1 } },
    { new: true, session, timestamps: false },
  );
  if (!doc) error(422, "District must be active and belong to selected Region");
}
async function lockPoint(id, session) {
  const doc = await WaterPoint.findOneAndUpdate(
    { _id: id, isActive: true },
    { $inc: { registryVersion: 1 } },
    { new: true, session, timestamps: false },
  );
  if (!doc) {
    if (!(await WaterPoint.exists({ _id: id }).session(session)))
      error(404, "Water point not found");
    error(409, "Water point is archived");
  }
  return doc;
}
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const literal = (value) => ({
  $regex: "^" + escapeRegex(value) + "$",
  $options: "i",
});
function filters(q) {
  const match = { isActive: q.isActive };
  for (const k of ["region", "district"])
    if (q[k]) match[k] = new mongoose.Types.ObjectId(q[k]);
  for (const k of ["waterSourceType", "status"]) if (q[k]) match[k] = q[k];
  if (q.villageOrSite) match.villageOrSite = literal(q.villageOrSite);
  for (const k of ["organizationType", "yearConstructed"])
    if (q[k] !== undefined) match["implementation." + k] = q[k];
  for (const k of [
    "implementingOrganization",
    "fundingPartner",
    "contractorCompany",
  ])
    if (q[k]) match["implementation." + k] = literal(q[k]);
  if (q.search)
    match.$or = [
      "waterPointCode",
      "waterPointName",
      "villageOrSite",
      "implementation.implementingOrganization",
      "implementation.fundingPartner",
      "implementation.contractorCompany",
      "implementation.projectOrProgramName",
    ].map((k) => ({ [k]: { $regex: escapeRegex(q.search), $options: "i" } }));
  return match;
}
const pagination = (q) => ({
  page: Number(q.page),
  limit: Number(q.limit),
  skip: (Number(q.page) - 1) * Number(q.limit),
});
const sorting = (q) => {
  const descending = q.sort.startsWith("-");
  const key = q.sort.replace(/^-/, "");
  return {
    [key === "yearConstructed" ? "implementation.yearConstructed" : key]:
      descending ? -1 : 1,
    _id: descending ? -1 : 1,
  };
};
const meta = (p, total) => ({
  page: p.page,
  limit: p.limit,
  total,
  pages: Math.ceil(total / p.limit),
});
const populateLocation = (query) =>
  query
    .populate("region", "name code isActive")
    .populate("district", "name code region isActive");
const mapProjection = {
  waterPointCode: 1,
  waterPointName: 1,
  waterSourceType: 1,
  status: 1,
  region: 1,
  district: 1,
  villageOrSite: 1,
  location: 1,
};
function handleError(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = 500,
    message = "Unexpected registry error",
    errors = [];
  if (err instanceof RegistryError) {
    status = err.status;
    message = err.message;
  } else if (err.code === 11000) {
    status = 409;
    message = "A record with this name or code already exists";
  } else if (err.name === "VersionError") {
    status = 409;
    message = "Record changed concurrently; reload and retry";
  } else if (
    ["ValidationError", "CastError", "StrictModeError"].includes(err.name)
  ) {
    status = 400;
    message = "Invalid record data";
  } else if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = "Upload exceeds file, field or count limits";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  } else if (err.code === 20 || err.codeName === "IllegalOperation") {
    status = 503;
    message = "Registry writes require MongoDB replica-set transactions";
  }
  // Do not log request bodies, credentials, or raw storage/driver messages.
  if (status === 500)
    console.error("Registry operation failed", { type: err.name || "Error" });
  return res.status(status).json({ success: false, message, errors });
}
module.exports = {
  Region,
  District,
  WaterPoint,
  RegistryError,
  error,
  send,
  transaction,
  activeRegion,
  validLocation,
  lockPoint,
  escapeRegex,
  literal,
  filters,
  pagination,
  sorting,
  meta,
  populateLocation,
  mapProjection,
  handleError,
};
