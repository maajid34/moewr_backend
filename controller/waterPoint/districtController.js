const {
  District,
  WaterPoint,
  error,
  send,
  transaction,
  activeRegion,
  pagination,
  meta,
  escapeRegex,
} = require("./common");
exports.create = async (req, res) => {
  const result = await transaction(async (session) => {
    await activeRegion(req.registryBody.region, session);
    return (
      await District.create(
        [
          {
            ...req.registryBody,
            code: req.registryBody.code || undefined,
            createdBy: req.user.id,
            updatedBy: req.user.id,
          },
        ],
        { session },
      )
    )[0];
  });
  send(res, result, "District created", 201);
};
exports.list = async (req, res) => {
  const q = req.registryQuery,
    p = pagination(q),
    match = { isActive: q.isActive };
  if (q.region) match.region = q.region;
  if (q.search) match.name = { $regex: escapeRegex(q.search), $options: "i" };
  const [data, total] = await Promise.all([
    District.find(match)
      .populate("region", "name code isActive")
      .sort({ name: 1, _id: 1 })
      .skip(p.skip)
      .limit(p.limit)
      .lean(),
    District.countDocuments(match),
  ]);
  send(res, data, "Districts", 200, meta(p, total));
};
exports.get = async (req, res) => {
  const doc = await District.findById(req.params.id)
    .populate("region", "name code isActive")
    .lean();
  if (!doc) error(404, "District not found");
  send(res, doc);
};
async function update(req, res, disable = false) {
  const result = await transaction(async (session) => {
    const before = await District.findById(req.params.id).session(session);
    if (!before) error(404, "District not found");
    const body = disable ? { isActive: false } : req.registryBody;
    if (body.isActive !== false) await activeRegion(before.region, session);
    const doc = await District.findOneAndUpdate(
      { _id: before._id },
      { $inc: { registryVersion: 1 } },
      { new: true, session },
    );
    if (
      body.isActive === false &&
      (await WaterPoint.exists({ district: doc._id, isActive: true }).session(
        session,
      ))
    )
      error(409, "District still contains active Water Points");
    for (const [key, value] of Object.entries(body))
      doc.set(key, key === "code" ? value || undefined : value);
    doc.updatedBy = req.user.id;
    await doc.save({ session });
    return doc;
  });
  send(res, result, disable ? "District deactivated" : "District updated");
}
exports.update = (req, res) => update(req, res);
exports.remove = (req, res) => update(req, res, true);
