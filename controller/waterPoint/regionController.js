const {
  Region,
  District,
  WaterPoint,
  error,
  send,
  transaction,
  pagination,
  meta,
  escapeRegex,
} = require("./common");
exports.create = async (req, res) =>
  send(
    res,
    await Region.create({
      ...req.registryBody,
      code: req.registryBody.code || undefined,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    }),
    "Region created",
    201,
  );
exports.list = async (req, res) => {
  const q = req.registryQuery,
    p = pagination(q),
    match = { isActive: q.isActive };
  if (q.search) match.name = { $regex: escapeRegex(q.search), $options: "i" };
  const [data, total] = await Promise.all([
    Region.find(match)
      .sort({ name: 1, _id: 1 })
      .skip(p.skip)
      .limit(p.limit)
      .lean(),
    Region.countDocuments(match),
  ]);
  send(res, data, "Regions", 200, meta(p, total));
};
exports.get = async (req, res) => {
  const doc = await Region.findById(req.params.id).lean();
  if (!doc) error(404, "Region not found");
  send(res, doc);
};
async function update(req, res, disable = false) {
  const result = await transaction(async (session) => {
    const doc = await Region.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { registryVersion: 1 } },
      { new: true, session },
    );
    if (!doc) error(404, "Region not found");
    const body = disable ? { isActive: false } : req.registryBody;
    if (
      body.isActive === false &&
      ((await District.exists({ region: doc._id, isActive: true }).session(
        session,
      )) ||
        (await WaterPoint.exists({ region: doc._id, isActive: true }).session(
          session,
        )))
    )
      error(409, "Region still contains active Districts or Water Points");
    for (const [key, value] of Object.entries(body))
      doc.set(key, key === "code" ? value || undefined : value);
    doc.updatedBy = req.user.id;
    await doc.save({ session });
    return doc;
  });
  send(res, result, disable ? "Region deactivated" : "Region updated");
}
exports.update = (req, res) => update(req, res);
exports.remove = (req, res) => update(req, res, true);
