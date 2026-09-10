const Assessment = require("../../modules/waterPoint/waterPointAssessmentModel");
const {
  WaterPoint,
  error,
  send,
  transaction,
  lockPoint,
  pagination,
  meta,
} = require("./common");
exports.create = async (req, res) => {
  const result = await transaction(async (session) => {
    await lockPoint(req.params.id, session);
    return (
      await Assessment.create(
        [
          {
            ...req.registryBody,
            waterPoint: req.params.id,
            createdBy: req.user.id,
          },
        ],
        { session },
      )
    )[0];
  });
  send(
    res,
    result,
    "Assessment recorded; current WaterPoint status is managed separately",
    201,
  );
};
exports.list = async (req, res) => {
  if (!(await WaterPoint.exists({ _id: req.params.id })))
    error(404, "Water point not found");
  const p = pagination(req.registryQuery),
    match = { waterPoint: req.params.id };
  const [data, total] = await Promise.all([
    Assessment.find(match)
      .sort({ assessmentDate: -1, _id: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .lean(),
    Assessment.countDocuments(match),
  ]);
  send(res, data, "Assessment history", 200, meta(p, total));
};
exports.get = async (req, res) => {
  const doc = await Assessment.findById(req.params.assessmentId).lean();
  if (!doc) error(404, "Assessment not found");
  send(res, doc);
};
