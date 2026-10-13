const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const applicationController = require("./application.controller");
const { requireHR } = require("../auth/auth.middleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
    fields: 30,
    parts: 35,
    fieldSize: 100 * 1024,
  },
  fileFilter(req, file, callback) {
    if (file.fieldname === "resume") {
      if (file.mimetype !== "application/pdf") {
        const error = new Error("Resume must be a PDF file."); error.statusCode = 400; return callback(error);
      }

      return callback(null, true);
    }

    if (file.fieldname === "profileImage") {
      const allowedImages = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedImages.includes(file.mimetype)) {
        const error = new Error("Profile image must be JPG, PNG or WebP."); error.statusCode = 400; return callback(error);
      }

      return callback(null, true);
    }

    const error = new Error("Unexpected upload field."); error.statusCode = 400; return callback(error);
  },
});

const applicationSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many applications submitted. Please try again later.",
  },
});

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Public: candidate does not need an account or login.
router.post(
  "/",
  applicationSubmissionLimiter,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
  ]),
  applicationController.submitApplication
);

// HR-only management API.
router.use(requireHR);

router.get("/", readLimiter, applicationController.listApplications);
router.get("/:id/resume", readLimiter, applicationController.getResumeDownloadUrl);
router.get("/:id", readLimiter, applicationController.getApplication);

router.patch("/:id/status", writeLimiter, applicationController.updateApplicationStatus);

router.post("/:id/notes", writeLimiter, applicationController.addInternalNote);

module.exports = router;
