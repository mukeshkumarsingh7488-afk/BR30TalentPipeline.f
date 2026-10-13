const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const departmentRoutes = require("../modules/departments/department.routes");
const jobRoleRoutes = require("../modules/job-roles/job-role.routes");
const candidateRoutes = require("../modules/candidates/candidate.routes");
const applicationRoutes = require("../modules/applications/application.routes");
const publicFormRoutes = require("../modules/applications/public-form.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const interviewRoutes = require("../modules/interviews/interview.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BR30 Talent Pipeline API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/job-roles", jobRoleRoutes);
router.use("/candidates", candidateRoutes);
router.use("/applications", applicationRoutes);
router.use("/public-forms", publicFormRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/interviews", interviewRoutes);

module.exports = router;
