const express = require("express");
const rateLimit = require("express-rate-limit");

const departmentController = require("./department.controller");
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");

const router = express.Router();

const departmentWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many department changes. Please try again later.",
  },
});

// Every endpoint in this router requires an authenticated, active HR.
router.use(authenticate, authorizeRoles("ADMIN", "HR"));

// GET /api/v1/departments
router.get("/", departmentController.listDepartments);

// GET /api/v1/departments/:id
router.get("/:id", departmentController.getDepartment);

// POST /api/v1/departments
router.post("/", departmentWriteLimiter, departmentController.createDepartment);

// PATCH /api/v1/departments/:id
router.patch("/:id", departmentWriteLimiter, departmentController.updateDepartment);

// PATCH /api/v1/departments/:id/status
router.patch("/:id/status", departmentWriteLimiter, departmentController.setDepartmentStatus);

// DELETE /api/v1/departments/:id
// Soft-deactivates the department instead of permanently deleting it.
router.delete("/:id", departmentWriteLimiter, departmentController.deleteDepartment);

module.exports = router;
