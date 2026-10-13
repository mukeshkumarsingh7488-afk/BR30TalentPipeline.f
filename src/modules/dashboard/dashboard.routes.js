const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

const dashboardReadLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many dashboard requests. Please try again later.",
  },
});

const exportLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many export requests. Please try again later.",
  },
});

// Dashboard access is available to authenticated ADMIN and approved HR users.
router.use(authenticate, authorizeRoles("ADMIN", "HR"));

router.get("/overview", dashboardReadLimit, dashboardController.getOverview);
router.get("/application-analytics", dashboardReadLimit, dashboardController.getApplicationAnalytics);
router.get("/export/applications.csv", exportLimit, dashboardController.exportApplications);

module.exports = router;
