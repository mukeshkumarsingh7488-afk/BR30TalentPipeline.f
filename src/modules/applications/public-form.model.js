const mongoose = require("mongoose");

const publicFormSchema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, match: /^\d{8}$/ },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  jobRoleId: { type: mongoose.Schema.Types.ObjectId, ref: "JobRole", required: true },
  status: { type: String, enum: ["DRAFT", "PUBLISHED", "PAUSED"], default: "DRAFT", required: true },
  allowCoverLetter: { type: Boolean, default: true },
  allowProfileImage: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "TalentPipelineUser", required: true, immutable: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "TalentPipelineUser", required: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, strict: true });

publicFormSchema.index({ publicId: 1 }, { unique: true, name: "unique_public_form_id" });
publicFormSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("PublicForm", publicFormSchema);
