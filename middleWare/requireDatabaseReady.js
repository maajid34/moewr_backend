const mongoose = require('mongoose');
// Database routes must not queue queries while MongoDB is disconnected.
module.exports = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.set('Retry-After', '30');
    return res.status(503).json({message:'Database temporarily unavailable. Please try again shortly.'});
  }
  next();
};
