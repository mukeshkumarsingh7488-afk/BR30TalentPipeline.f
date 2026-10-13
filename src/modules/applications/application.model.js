const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TalentPipelineUser",
      default: null,
    },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const internalNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 3000 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TalentPipelineUser",
      required: true,
    },
  },
  { timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    jobRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobRole",
      required: true,
      index: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    resume: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
      format: { type: String, default: "pdf" },
      bytes: { type: Number, required: true },
      originalName: { type: String, required: true },
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    expectedSalary: {
      type: Number,
      min: 0,
      max: 1000000000000,
      default: null,
    },

    salaryCurrency: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{3}$/,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["applied", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"],
      default: "applied",
      required: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    internalNotes: {
      type: [internalNoteSchema],
      default: [],
    },

    reviewedAt: { type: Date, default: null },

    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

applicationSchema.index({ candidateId: 1, jobRoleId: 1 }, { unique: true, name: "unique_candidate_job_role_application" });

applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ jobRoleId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ departmentId: 1, createdAt: -1 });

module.exports = mongoose.model("Application", applicationSchema);
