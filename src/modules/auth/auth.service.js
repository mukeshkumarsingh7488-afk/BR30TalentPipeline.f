const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./user.model");
const { sendOtpEmail } = require("./email.service");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 12;

if (!process.env.BR30_ADMIN_EMAIL?.trim()) {
  throw new Error("BR30_ADMIN_EMAIL is not configured in .env");
}

const ADMIN_EMAIL = process.env.BR30_ADMIN_EMAIL.trim().toLowerCase();
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => {
  if (typeof email !== "string" || !email.trim()) {
    throw createError("A valid email address is required.", 400);
  }

  const normalized = email.trim().toLowerCase();

  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw createError("Please enter a valid email address.", 400);
  }

  return normalized;
};

const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < 6) {
    throw createError("Password must be at least 6 characters long.", 400);
  }

  if (password.length > 12) {
    throw createError("Password cannot exceed 12 characters.", 400);
  }
};

const validateName = (name) => {
  if (typeof name !== "string") {
    throw createError("A valid name is required.", 400);
  }

  const normalized = name.trim();

  if (normalized.length < 2 || normalized.length > 100) {
    throw createError("Name must contain between 2 and 100 characters.", 400);
  }

  return normalized;
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const otpMatches = (providedOtp, storedHash) => {
  if (typeof providedOtp !== "string" || !/^\d{6}$/.test(providedOtp) || typeof storedHash !== "string" || !/^[a-f0-9]{64}$/.test(storedHash)) {
    return false;
  }

  const providedHash = Buffer.from(hashOtp(providedOtp), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");

  return crypto.timingSafeEqual(providedHash, expectedHash);
};

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  approvalStatus: user.approvalStatus,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const ensureEmailCooldownPassed = (lastSentAt) => {
  if (!lastSentAt) return;

  const elapsed = Date.now() - new Date(lastSentAt).getTime();

  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    throw createError("Please wait before requesting another OTP.", 429);
  }
};

const deliverOtp = async ({ email, otp, purpose, name }) => {
  try {
    await sendOtpEmail({
      to: email,
      otp,
      purpose,
      name,
    });
  } catch (error) {
    console.error("OTP email delivery failed:", error.message);

    throw createError("Unable to send the email right now. Please try again later.", 503);
  }
};

// Public HR registration: never accepts a role from the client.
const createHRAccount = async ({ name, email, password }) => {
  const normalizedName = validateName(name);
  const normalizedEmail = normalizeEmail(email);

  validatePassword(password);

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw createError("An account already exists for this email address.", 409);
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;

  try {
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: passwordHash,
      role: normalizedEmail === ADMIN_EMAIL ? "ADMIN" : "HR",
      emailVerified: false,
      approvalStatus: normalizedEmail === ADMIN_EMAIL ? "APPROVED" : "PENDING",
      isActive: true,
      emailOtpHash: hashOtp(otp),
      emailOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      emailOtpAttempts: 0,
      emailOtpLastSentAt: new Date(),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError("An account already exists for this email address.", 409);
    }

    throw error;
  }

  await deliverOtp({
    email: user.email,
    otp,
    purpose: "verification",
    name: user.name,
  });

  return {
    message: "HR account created. Verify your email and wait for admin approval.",
    email: user.email,
    expiresInSeconds: OTP_TTL_MS / 1000,
  };
};

// Secure one-time Admin bootstrap.
// Expose this only through a protected deployment/setup procedure,
// never through ordinary public registration.
const bootstrapAdmin = async ({ name, email, password, bootstrapSecret }) => {
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

  if (!configuredSecret || typeof bootstrapSecret !== "string" || bootstrapSecret.length !== configuredSecret.length || !crypto.timingSafeEqual(Buffer.from(bootstrapSecret), Buffer.from(configuredSecret))) {
    throw createError("Admin bootstrap is not authorized.", 403);
  }

  const normalizedName = validateName(name);
  const normalizedEmail = normalizeEmail(email);

  validatePassword(password);

  if (normalizedEmail !== ADMIN_EMAIL) {
    throw createError("Only the configured administrator email can be bootstrapped.", 403);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createError("An account already exists for the administrator email. Do not overwrite it through bootstrap.", 409);
  }

  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured.");
  }

  const otp = generateOtp();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: passwordHash,
    role: "ADMIN",
    emailVerified: false,
    approvalStatus: "APPROVED",
    isActive: true,
    emailOtpHash: hashOtp(otp),
    emailOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    emailOtpAttempts: 0,
    emailOtpLastSentAt: new Date(),
  });

  await deliverOtp({
    email: user.email,
    otp,
    purpose: "verification",
    name: user.name,
  });

  return {
    message: "Administrator account created. Verify the administrator email.",
    email: user.email,
    expiresInSeconds: OTP_TTL_MS / 1000,
  };
};

const verifyEmailOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts");

  if (!user) {
    throw createError("Invalid or expired verification OTP.", 400);
  }

  if (user.emailVerified) {
    return { message: "Email address is already verified." };
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt || user.emailOtpExpiresAt.getTime() <= Date.now()) {
    throw createError("Verification OTP has expired. Request a new OTP.", 400);
  }

  if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
    throw createError("Too many incorrect OTP attempts. Request a new OTP.", 429);
  }

  if (!otpMatches(otp, user.emailOtpHash)) {
    user.emailOtpAttempts += 1;
    await user.save();

    throw createError("Invalid or expired verification OTP.", 400);
  }

  user.emailVerified = true;
  user.emailOtpHash = undefined;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = null;

  await user.save();

  return {
    message: user.role === "ADMIN" ? "Administrator email verified successfully. You can now log in." : "Email verified successfully. Your account is awaiting admin approval.",
  };
};

const resendVerificationOtp = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpLastSentAt");

  if (!user || user.emailVerified) {
    return {
      message: "If the account can receive a verification OTP, an email will be sent.",
    };
  }

  ensureEmailCooldownPassed(user.emailOtpLastSentAt);

  const otp = generateOtp();

  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();

  await user.save();

  await deliverOtp({
    email: user.email,
    otp,
    purpose: "verification",
    name: user.name,
  });

  return {
    message: "If eligible, a verification OTP has been sent.",
    expiresInSeconds: OTP_TTL_MS / 1000,
  };
};

const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  const genericResponse = {
    message: "If an eligible account exists, password reset instructions will be emailed.",
  };

  const user = await User.findOne({
    email: normalizedEmail,
    emailVerified: true,
    isActive: true,
    $or: [{ role: "ADMIN" }, { role: "HR", approvalStatus: "APPROVED" }],
  }).select("+resetOtpLastSentAt");

  if (!user) return genericResponse;

  ensureEmailCooldownPassed(user.resetOtpLastSentAt);

  const otp = generateOtp();

  user.resetOtpHash = hashOtp(otp);
  user.resetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.resetOtpAttempts = 0;
  user.resetOtpLastSentAt = new Date();

  await user.save();

  await deliverOtp({
    email: user.email,
    otp,
    purpose: "password_reset",
    name: user.name,
  });

  return genericResponse;
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = normalizeEmail(email);

  validatePassword(newPassword);

  const user = await User.findOne({
    email: normalizedEmail,
    emailVerified: true,
    isActive: true,
    $or: [{ role: "ADMIN" }, { role: "HR", approvalStatus: "APPROVED" }],
  }).select("+resetOtpHash +resetOtpExpiresAt +resetOtpAttempts +tokenVersion +password");

  if (!user) {
    throw createError("Invalid or expired password reset OTP.", 400);
  }

  if (!user.resetOtpHash || !user.resetOtpExpiresAt || user.resetOtpExpiresAt.getTime() <= Date.now()) {
    throw createError("Password reset OTP has expired. Request a new OTP.", 400);
  }

  if (user.resetOtpAttempts >= OTP_MAX_ATTEMPTS) {
    throw createError("Too many incorrect OTP attempts. Request a new OTP.", 429);
  }

  if (!otpMatches(otp, user.resetOtpHash)) {
    user.resetOtpAttempts += 1;
    await user.save();

    throw createError("Invalid or expired password reset OTP.", 400);
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.tokenVersion = (user.tokenVersion || 0) + 1;

  user.resetOtpHash = undefined;
  user.resetOtpExpiresAt = null;
  user.resetOtpAttempts = 0;
  user.resetOtpLastSentAt = null;

  await user.save();

  return {
    message: "Password reset successfully. Please log in again.",
  };
};

const loginHR = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (typeof password !== "string" || !password) {
    throw createError("Email or password is incorrect.", 401);
  }

  const user = await User.findOne({
    email: normalizedEmail,
    role: { $in: ["ADMIN", "HR"] },
  }).select("+password +tokenVersion");

  if (!user || !user.isActive) {
    throw createError("Email or password is incorrect.", 401);
  }

  if (!user.emailVerified) {
    throw createError("Please verify your email before logging in.", 403);
  }

  if (user.role === "HR" && user.approvalStatus !== "APPROVED") {
    if (user.approvalStatus === "REJECTED") {
      throw createError("Your HR account registration was rejected. Contact the administrator.", 403);
    }

    throw createError("Your email is verified, but your HR account is awaiting admin approval.", 403);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createError("Email or password is incorrect.", 401);
  }

  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured.");
  }

  const accessToken = jwt.sign(
    {
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
      algorithm: "HS256",
      issuer: "br30-talent-pipeline",
      audience: "br30-talent-pipeline-hr",
    }
  );

  user.lastLoginAt = new Date();
  await user.save();

  return {
    message: "Login successful.",
    accessToken,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
    user: getSafeUser(user),
  };
};

// Admin-only operations: routes must enforce authentication and ADMIN role.
const getPendingHRAccounts = async () => {
  const users = await User.find({
    role: "HR",
    approvalStatus: "PENDING",
  })
    .select("name email emailVerified approvalStatus createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return { users };
};

const approveHRAccount = async ({ userId, adminId }) => {
  if (!userId || !adminId) {
    throw createError("A valid HR account and admin are required.", 400);
  }

  const user = await User.findOne({
    _id: userId,
    role: "HR",
    approvalStatus: "PENDING",
  });

  if (!user) {
    throw createError("Pending HR account not found or already reviewed.", 404);
  }

  if (!user.emailVerified) {
    throw createError("The HR user must verify their email before approval.", 409);
  }

  user.approvalStatus = "APPROVED";
  user.approvedBy = adminId;
  user.approvalReviewedAt = new Date();
  user.rejectionReason = null;

  await user.save();

  return {
    message: "HR account approved successfully.",
    user: getSafeUser(user),
  };
};

const rejectHRAccount = async ({ userId, adminId, reason }) => {
  if (!userId || !adminId) {
    throw createError("A valid HR account and admin are required.", 400);
  }

  const normalizedReason = typeof reason === "string" ? reason.trim() : "";

  if (normalizedReason.length > 500) {
    throw createError("Rejection reason cannot exceed 500 characters.", 400);
  }

  const user = await User.findOne({
    _id: userId,
    role: "HR",
    approvalStatus: "PENDING",
  });

  if (!user) {
    throw createError("Pending HR account not found or already reviewed.", 404);
  }

  user.approvalStatus = "REJECTED";
  user.approvedBy = adminId;
  user.approvalReviewedAt = new Date();
  user.rejectionReason = normalizedReason || null;

  // Invalidate any previously issued tokens if this account was ever active.
  user.tokenVersion = (user.tokenVersion || 0) + 1;

  await user.save();

  return {
    message: "HR account registration rejected.",
    user: getSafeUser(user),
  };
};

module.exports = {
  createHRAccount,
  bootstrapAdmin,
  verifyEmailOtp,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  loginHR,
  getPendingHRAccounts,
  approveHRAccount,
  rejectHRAccount,
};
