const express = require("express");
const rateLimit = require("express-rate-limit");

const controller = require("./public-form.controller");
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");

const router = express.Router();

const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const writes = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many form changes. Please try again later.",
  },
});

// Public endpoint: candidate form access without login.
router.get("/public/:publicId", publicReadLimiter, controller.getPublic);

// All remaining endpoints require ADMIN or HR access.
router.use(authenticate, authorizeRoles("ADMIN", "HR"));

// GET /api/v1/public-forms
router.get("/", controller.list);

// POST /api/v1/public-forms
router.post("/", writes, controller.create);

// PATCH /api/v1/public-forms/:id
router.patch("/:id", writes, controller.update);

// PATCH /api/v1/public-forms/:id/status
router.patch("/:id/status", writes, controller.setStatus);

// DELETE /api/v1/public-forms/:id
router.delete("/:id", writes, controller.remove);

module.exports = router;
