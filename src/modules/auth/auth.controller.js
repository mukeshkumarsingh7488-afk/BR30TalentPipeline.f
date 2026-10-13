const asyncHandler = require("../../utils/asyncHandler");
const authService = require("./auth.service");

const createHRAccount = asyncHandler(async (req, res) => {
  const result = await authService.createHRAccount({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  res.status(201).json({
    success: true,
    message: "HR account created. Verify your email and wait for admin approval.",
    ...result,
  });
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmailOtp({
    email: req.body.email,
    otp: req.body.otp,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const resendVerificationOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationOtp({
    email: req.body.email,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword({
    email: req.body.email,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword({
    email: req.body.email,
    otp: req.body.otp,
    newPassword: req.body.newPassword,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const loginHR = asyncHandler(async (req, res) => {
  const result = await authService.loginHR({
    email: req.body.email,
    password: req.body.password,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

// Admin: list HR accounts awaiting approval.
const getPendingHRAccounts = asyncHandler(async (req, res) => {
  const result = await authService.getPendingHRAccounts();

  res.status(200).json({
    success: true,
    ...result,
  });
});

// Admin: approve a pending HR account.
const approveHRAccount = asyncHandler(async (req, res) => {
  const result = await authService.approveHRAccount({
    userId: req.params.userId,
    adminId: req.user?._id || req.user?.id,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

// Admin: reject a pending HR account.
const rejectHRAccount = asyncHandler(async (req, res) => {
  const result = await authService.rejectHRAccount({
    userId: req.params.userId,
    adminId: req.user?._id || req.user?.id,
    reason: req.body.reason,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createHRAccount,
  verifyEmailOtp,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  loginHR,
  getPendingHRAccounts,
  approveHRAccount,
  rejectHRAccount,
};
