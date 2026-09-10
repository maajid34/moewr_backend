const Counter = require("../../modules/waterPoint/counterModel");
const {
  WaterPoint,
  error,
  send,
  transaction,
  validLocation,
  filters,
  pagination,
  sorting,
  meta,
  populateLocation,
  mapProjection,
} = require("./common");
exports.create = async (req, res) => {
  const create = () =>
    transaction(async (session) => {
      const b = req.registryBody;
      await validLocation(b.region, b.district, session);
      const prefix = b.waterSourceType === "BOREHOLE" ? "BH" : "SW";
      const count = await Counter.findOneAndUpdate(
        { _id: prefix },
        { $inc: { value: 1 } },
        { new: true, upsert: true, session },
      );
      const waterPointCode =
        prefix + "-" + String(count.value).padStart(6, "0");
      return (
        await WaterPoint.create(
          [
            {
              ...b,
              waterPointCode,
              createdBy: req.user.id,
              updatedBy: req.user.id,
            },
          ],
          { session },
        )
      )[0];
    });
  // Concurrent first use of a counter can race its upsert before the row exists.
  // Retry only that specific duplicate; never hide a business-key conflict.
  let result;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      result = await create();
      break;
    } catch (err) {
      if (
        attempt === 4 ||
        err.code !== 11000 ||
        !["BH", "SW"].includes(err.keyValue?._id)
      )
        throw err;
    }
  }
  send(res, result, "Water point created", 201);
};
exports.list = async (req, res) => {
  const q = req.registryQuery,
    p = pagination(q),
    match = filters(q);
  const [data, total] = await Promise.all([
    populateLocation(
      WaterPoint.find(match)
        .select("-photos -documents -notes")
        .sort(sorting(q))
        .skip(p.skip)
        .limit(p.limit),
    ).lean(),
    WaterPoint.countDocuments(match),
  ]);
  send(res, data, "Water points", 200, meta(p, total));
};
exports.get = async (req, res) => {
  const doc = await populateLocation(WaterPoint.findById(req.params.id)).lean();
  if (!doc) error(404, "Water point not found");
  send(res, doc);
};
exports.update = async (req, res) => {
  const result = await transaction(async (session) => {
    const doc = await WaterPoint.findById(req.params.id).session(session);
    if (!doc) error(404, "Water point not found");
    if (!doc.isActive) error(409, "Archived water point cannot be changed");
    const b = req.registryBody;
    await validLocation(
      b.region || doc.region,
      b.district || doc.district,
      session,
    );
    for (const [key, value] of Object.entries(b)) doc.set(key, value);
    doc.updatedBy = req.user.id;
    await doc.save({ session });
    return doc;
  });
  send(res, result, "Water point updated");
};
exports.remove = async (req, res) => {
  const result = await WaterPoint.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    {
      $set: {
        isActive: false,
        archivedAt: new Date(),
        archivedBy: req.user.id,
        updatedBy: req.user.id,
      },
      $inc: { registryVersion: 1, __v: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!result) {
    if (!(await WaterPoint.exists({ _id: req.params.id })))
      error(404, "Water point not found");
    error(409, "Water point already archived");
  }
  send(res, result, "Water point archived; history retained");
};
exports.gis = async (req, res) => {
  const q = req.registryQuery,
    p = pagination(q),
    match = filters(q);
  const [data, total] = await Promise.all([
    populateLocation(
      WaterPoint.find(match)
        .select(mapProjection)
        .sort(sorting(q))
        .skip(p.skip)
        .limit(p.limit),
    ).lean(),
    WaterPoint.countDocuments(match),
  ]);
  send(res, data, "GIS markers", 200, meta(p, total));
};
exports.nearby = async (req, res) => {
  const q = req.registryQuery;
  const data = await WaterPoint.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [q.lng, q.lat] },
        distanceField: "distanceMeters",
        maxDistance: q.radiusKm * 1000,
        spherical: true,
        key: "location",
        query: filters(q),
      },
    },
    { $limit: Number(q.limit) },
    { $project: { ...mapProjection, distanceMeters: 1 } },
  ]).option({ maxTimeMS: 10000 });
  await WaterPoint.populate(data, [
    { path: "region", select: "name code isActive" },
    { path: "district", select: "name code region isActive" },
  ]);
  send(res, data, "Nearby water points", 200, {
    limit: Number(q.limit),
    radiusKm: q.radiusKm,
  });
};
