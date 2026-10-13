const mongoose = require("mongoose");

const jobRoleSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required."],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Job role title is required."],
      trim: true,
      minlength: [2, "Job role title must contain at least 2 characters."],
      maxlength: [120, "Job role title cannot exceed 120 characters."],
    },

    titleKey: {
      type: String,
      required: true,
      select: false,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters."],
      default: "",
    },

    responsibilities: {
      type: [String],
      default: [],
      validate: {
        validator: (items) => items.length <= 30 && items.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 500),
        message: "Provide up to 30 valid responsibilities.",
      },
    },

    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (items) => items.length <= 50 && items.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 100),
        message: "Provide up to 50 valid skills.",
      },
    },

    preferredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (items) => items.length <= 50 && items.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 100),
        message: "Provide up to 50 valid preferred skills.",
      },
    },

    minExperienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    maxExperienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: null,
    },

    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "freelance"],
      default: "full_time",
      required: true,
    },

    workMode: {
      type: String,
      enum: ["onsite", "hybrid", "remote"],
      default: "hybrid",
      required: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters."],
      default: "",
    },

    salaryMin: {
      type: Number,
      min: 0,
      default: null,
    },

    salaryMax: {
      type: Number,
      min: 0,
      default: null,
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{3}$/,
      default: "INR",
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TalentPipelineUser",
      required: true,
      immutable: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TalentPipelineUser",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

jobRoleSchema.index({ departmentId: 1, titleKey: 1 }, { unique: true, name: "unique_job_role_per_department" });

jobRoleSchema.index({ isActive: 1, departmentId: 1, title: 1 }, { name: "job_role_department_status" });

jobRoleSchema.index({ employmentType: 1, workMode: 1, isActive: 1 }, { name: "job_role_type_work_mode" });

jobRoleSchema.index({ createdAt: -1 }, { name: "job_role_created_at" });

module.exports = mongoose.model("JobRole", jobRoleSchema);
