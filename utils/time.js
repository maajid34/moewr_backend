const dayjs = require("dayjs");

exports.today = () => dayjs().format("YYYY-MM-DD");

exports.isLate = (cutoffHour = 9) => {
  const hour = dayjs().hour();
  return hour >= cutoffHour;
};