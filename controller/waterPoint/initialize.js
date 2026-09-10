const mongoose = require("mongoose");
const models = [
  require("../../modules/waterPoint/regionModel"),
  require("../../modules/waterPoint/districtModel"),
  require("../../modules/waterPoint/waterPointModel"),
  require("../../modules/waterPoint/waterPointAssessmentModel"),
  require("../../modules/waterPoint/counterModel"),
  require("../../modules/waterPoint/storageCleanupModel"),
];
let ready;
module.exports = async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1)
    return res
      .status(503)
      .json({
        success: false,
        message: "Registry database unavailable",
        errors: [],
      });
  try {
    if (!ready)
      ready = Promise.all(models.map((model) => model.init())).catch((err) => {
        ready = undefined;
        throw err;
      });
    await ready;
    next();
  } catch (err) {
    next(err);
  }
};
