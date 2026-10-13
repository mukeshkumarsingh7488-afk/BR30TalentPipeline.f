const express = require("express");
const rateLimit = require("express-rate-limit");

const jobRoleController = require("./job-role.controller");
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");

const router = express.Router();

const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many job role changes. Please try again later.",
  },
});

// Public endpoint for the candidate application form.
// No authentication required for this endpoint.
router.get("/public", publicReadLimiter, jobRoleController.listPublicJobRoles);

// All remaining endpoints require authenticated ADMIN or HR access.
router.use(authenticate, authorizeRoles("ADMIN", "HR"));

// GET /api/v1/job-roles
router.get("/", jobRoleController.listJobRoles);

// GET /api/v1/job-roles/:id
router.get("/:id", jobRoleController.getJobRole);

// POST /api/v1/job-roles
router.post("/", writeLimiter, jobRoleController.createJobRole);

// PATCH /api/v1/job-roles/:id
router.patch("/:id", writeLimiter, jobRoleController.updateJobRole);

// PATCH /api/v1/job-roles/:id/status
router.patch("/:id/status", writeLimiter, jobRoleController.setJobRoleStatus);

// DELETE /api/v1/job-roles/:id
router.delete("/:id", writeLimiter, jobRoleController.deleteJobRole);

module.exports = router;
