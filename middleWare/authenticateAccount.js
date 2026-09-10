const jwt = require("jsonwebtoken");
const Admin = require("../modules/login/login");
const fail = (res, status, message) =>
  res.status(status).json({ success: false, message, errors: [] });
async function authenticateAccount(req, res, next) {
  const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || "");
  if (!match) return fail(res, 401, "Authentication required");
  if (!process.env.JWT_Secret)
    return fail(res, 500, "Authentication is not configured");
  let claims;
  try {
    claims = jwt.verify(match[1], process.env.JWT_Secret, {
      algorithms: ["HS256"],
    });
  } catch {
    return fail(res, 401, "Invalid or expired token");
  }
  if (
    !claims ||
    typeof claims.id !== "string" ||
    !/^[a-f\d]{24}$/i.test(claims.id)
  )
    return fail(res, 401, "Invalid token identity");
  try {
    const account = await Admin.findById(claims.id)
      .select("_id name email role")
      .lean();
    if (!account) return fail(res, 401, "Account no longer exists");
    req.user = {
      id: account._id.toString(),
      name: account.name,
      email: account.email,
      role: account.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
const allowRoles =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : fail(res, 403, "Insufficient permission");
module.exports = { authenticateAccount, allowRoles };
