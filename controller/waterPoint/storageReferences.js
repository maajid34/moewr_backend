const WaterPoint = require("../../modules/waterPoint/waterPointModel");
const Assessment = require("../../modules/waterPoint/waterPointAssessmentModel");
module.exports = async (key, bucket) =>
  Boolean(
    (await WaterPoint.exists({
      $or: [
        { photos: { $elemMatch: { key, bucket } } },
        { documents: { $elemMatch: { key, bucket } } },
      ],
    })) ||
      (await Assessment.exists({ photos: { $elemMatch: { key, bucket } } })),
  );
