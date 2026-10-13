const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    // ADMIN must only be assigned by the secure bootstrap process.
    // Public registration must always explicitly create an HR account.
    role: {
      type: String,
      enum: ["ADMIN", "HR"],
      default: "HR",
      immutable: true,
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },

    // New HR accounts cannot access the dashboard until approved.
    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      required: true,
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TalentPipelineUser",
      default: null,
    },

    approvalReviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    // Email verification OTP: store only a cryptographic hash.
    emailOtpHash: {
      type: String,
      select: false,
      default: undefined,
    },

    emailOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    emailOtpAttempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    emailOtpLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },

    // Password reset OTP: separate from verification OTP.
    resetOtpHash: {
      type: String,
      select: false,
      default: undefined,
    },

    resetOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    resetOtpAttempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    resetOtpLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // Increment after password changes to invalidate existing sessions.
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "unique_talent_pipeline_user_email",
  }
);

userSchema.index({ role: 1, approvalStatus: 1, isActive: 1 }, { name: "talent_pipeline_user_access_status" });

const User = mongoose.model("TalentPipelineUser", userSchema);

module.exports = User;
