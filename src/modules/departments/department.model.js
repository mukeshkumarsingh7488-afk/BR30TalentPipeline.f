const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required."],
      trim: true,
      minlength: [2, "Department name must contain at least 2 characters."],
      maxlength: [100, "Department name cannot exceed 100 characters."],
    },

    nameKey: {
      type: String,
      required: true,
      select: false,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters."],
      default: "",
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

departmentSchema.index({ nameKey: 1 }, { unique: true, name: "unique_department_name" });

departmentSchema.index({ isActive: 1, name: 1 }, { name: "department_status_name" });

departmentSchema.index({ createdAt: -1 }, { name: "department_created_at" });

module.exports = mongoose.model("Department", departmentSchema);
