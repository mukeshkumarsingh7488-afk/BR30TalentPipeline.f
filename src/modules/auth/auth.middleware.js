const jwt = require("jsonwebtoken");
const User = require("./user.model");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
      throw createError("Authentication required.", 401);
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw createError("Authentication required.", 401);
    }

    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured.");
    }

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
        issuer: "br30-talent-pipeline",
        audience: "br30-talent-pipeline-hr",
      });
    } catch {
      throw createError("Invalid or expired access token.", 401);
    }

    if (!payload || typeof payload.sub !== "string" || !["ADMIN", "HR"].includes(payload.role) || !Number.isInteger(payload.tokenVersion)) {
      throw createError("Invalid or expired access token.", 401);
    }

    const user = await User.findById(payload.sub).select("+tokenVersion").lean();

    if (!user || user.role !== payload.role || user.isActive !== true || user.emailVerified !== true || user.tokenVersion !== payload.tokenVersion) {
      throw createError("Access denied.", 403);
    }

    if (user.role === "HR" && user.approvalStatus !== "APPROVED") {
      throw createError("HR account approval is required.", 403);
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError("Authentication required.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError("You are not authorized to perform this action.", 403));
    }

    return next();
  };
};

// Shared recruitment workspace: both ADMIN and approved HR may manage recruitment records.
const requireHR = [authenticate, authorizeRoles("ADMIN", "HR")];

// Admin-only middleware.
const requireAdmin = [authenticate, authorizeRoles("ADMIN")];

module.exports = {
  authenticate,
  authorizeRoles,
  requireHR,
  requireAdmin,
};
