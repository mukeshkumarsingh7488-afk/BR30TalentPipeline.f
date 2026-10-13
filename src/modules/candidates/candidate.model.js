const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    qualification: { type: String, trim: true, maxlength: 150 },
    institution: { type: String, trim: true, maxlength: 200 },
    fieldOfStudy: { type: String, trim: true, maxlength: 150 },
    graduationYear: { type: Number, min: 1950, max: 2100 },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    url: { type: String, trim: true, maxlength: 2048 },
    technologies: { type: [String], default: [] },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    emailKey: {
      type: String,
      required: true,
      immutable: true,
      select: false,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    githubUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    portfolioUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    linkedinUrl: { type: String, trim: true, maxlength: 2048, default: "" },

    profileImage: {
      publicId: { type: String, default: "" },
      url: { type: String, default: "" },
      format: { type: String, default: "" },
    },

    skills: {
      type: [String],
      default: [],
      validate: (items) => items.length <= 50,
    },

    education: {
      type: [educationSchema],
      default: [],
      validate: (items) => items.length <= 10,
    },

    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    currentCompany: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    projects: {
      type: [projectSchema],
      default: [],
      validate: (items) => items.length <= 20,
    },

    source: {
      type: String,
      enum: ["website", "referral", "linkedin", "job_board", "other"],
      default: "website",
    },

    createdByApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

candidateSchema.index({ emailKey: 1 }, { unique: true, name: "unique_candidate_email" });

candidateSchema.index({ fullName: 1 });
candidateSchema.index({ mobile: 1 });
candidateSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Candidate", candidateSchema);
