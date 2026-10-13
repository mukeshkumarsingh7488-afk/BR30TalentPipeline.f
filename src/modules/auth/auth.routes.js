const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require("./auth.controller");
const { authenticate, authorizeRoles } = require("./auth.middleware");

const router = express.Router();

const authRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// Public HR registration
router.post("/register", authRequestLimiter, authController.createHRAccount);

// HR and Admin login
router.post("/login", loginLimiter, authController.loginHR);

// Email verification
router.post("/verify-email", authRequestLimiter, authController.verifyEmailOtp);

router.post("/resend-verification", authRequestLimiter, authController.resendVerificationOtp);

// Password recovery
router.post("/forgot-password", authRequestLimiter, authController.forgotPassword);

router.post("/reset-password", authRequestLimiter, authController.resetPassword);

// Admin-only HR approval management
router.get("/hr/pending", authenticate, authorizeRoles("ADMIN"), authController.getPendingHRAccounts);

router.patch("/hr/:userId/approve", authenticate, authorizeRoles("ADMIN"), authController.approveHRAccount);

router.patch("/hr/:userId/reject", authenticate, authorizeRoles("ADMIN"), authController.rejectHRAccount);

module.exports = router;
