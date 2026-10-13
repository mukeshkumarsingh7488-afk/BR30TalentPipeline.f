const mongoose = require("mongoose");

const Application = require("./application.model");
const Candidate = require("../candidates/candidate.model");
const JobRole = require("../job-roles/job-role.model");
const Department = require("../departments/department.model");
const candidateService = require("../candidates/candidate.service");
const { uploadResume, createResumeDownloadUrl, deleteResume } = require("../../config/cloudinary-upload");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const submitApplication = async ({ candidateData, applicationData, resumeFile, profileImageFile }) => {
  if (!resumeFile) throw createError("Resume PDF is required.", 400);
  if (!mongoose.isValidObjectId(applicationData.jobRoleId)) throw createError("Invalid job role ID.", 400);

  const jobRole = await JobRole.findOne({ _id: applicationData.jobRoleId, isActive: true }).lean();
  if (!jobRole) throw createError("Selected job role is unavailable.", 400);

  const department = await Department.findOne({ _id: jobRole.departmentId, isActive: true }).lean();
  if (!department) throw createError("Selected department is unavailable.", 400);

  const emailKey = candidateData.email.trim().toLowerCase();
  const existingCandidate = await Candidate.findOne({ emailKey }).select("_id");
  if (existingCandidate && await Application.exists({ candidateId: existingCandidate._id, jobRoleId: jobRole._id })) {
    throw createError("An application for this job role already exists for this email.", 409);
  }

  let resumeResult;
  try {
    resumeResult = await uploadResume(resumeFile);
    const candidate = await candidateService.upsertCandidateForApplication(candidateData, profileImageFile);

    if (await Application.exists({ candidateId: candidate._id, jobRoleId: jobRole._id })) {
      throw createError("An application for this job role already exists for this email.", 409);
    }

    const application = await Application.create({
      candidateId: candidate._id,
      jobRoleId: jobRole._id,
      departmentId: department._id,
      resume: {
        publicId: resumeResult.public_id,
        url: resumeResult.secure_url,
        format: "pdf",
        bytes: resumeFile.size,
        originalName: String(resumeFile.originalname || "resume.pdf").slice(0, 255),
      },
      coverLetter: applicationData.coverLetter || "",
      expectedSalary: applicationData.expectedSalary ?? null,
      salaryCurrency: applicationData.salaryCurrency || "INR",
      status: "applied",
      statusHistory: [{ fromStatus: null, toStatus: "applied", changedBy: null, note: "Application submitted.", changedAt: new Date() }],
    });

    if (!candidate.createdByApplication) {
      candidate.createdByApplication = application._id;
      await candidate.save();
    }

    return { applicationId: application._id, status: application.status, submittedAt: application.submittedAt };
  } catch (error) {
    if (resumeResult?.public_id) {
      try { await deleteResume(resumeResult.public_id); }
      catch (cleanupError) { console.error("Resume cleanup failed after application error:", cleanupError.message); }
    }
    if (error.code === 11000) {
      throw createError("An application for this job role already exists for this email.", 409);
    }
    throw error;
  }
};

const listApplications = async (query) => {
  const filter = {};

  if (query.status !== "all") {
    filter.status = query.status;
  }

  if (query.jobRoleId) filter.jobRoleId = query.jobRoleId;
  if (query.departmentId) filter.departmentId = query.departmentId;

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");
    const matchingCandidates = await Candidate.find({
      $or: [{ fullName: regex }, { email: regex }, { mobile: regex }],
    })
      .select("_id")
      .lean();

    filter.candidateId = {
      $in: matchingCandidates.map((item) => item._id),
    };
  }

  const skip = (query.page - 1) * query.limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("candidateId", "fullName email mobile location skills experienceYears")
      .populate("jobRoleId", "title employmentType workMode")
      .populate("departmentId", "name")
      .sort({
        [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
        _id: 1,
      })
      .skip(skip)
      .limit(query.limit)
      .lean(),

    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page * query.limit < total,
      hasPreviousPage: query.page > 1,
    },
  };
};

const getApplicationById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid application ID.", 400);
  }

  const application = await Application.findById(id).populate("candidateId").populate("jobRoleId", "title employmentType workMode").populate("departmentId", "name").populate("internalNotes.createdBy", "name email").populate("statusHistory.changedBy", "name email").lean();

  if (!application) {
    throw createError("Application not found.", 404);
  }

  return application;
};

const getResumeDownloadUrl = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw createError("Invalid application ID.", 400);
  const application = await Application.findById(id).select("resume").lean();
  if (!application) throw createError("Application not found.", 404);
  if (!application.resume?.publicId) throw createError("Resume is unavailable.", 404);
  let url;
  try {
    url = createResumeDownloadUrl(application.resume.publicId, 300);
  } catch (error) {
    console.error("Resume download URL generation failed:", error.message);
    throw createError("Unable to prepare the resume download right now.", 503);
  }
  return { url, expiresInSeconds: 300, fileName: application.resume.originalName || "resume.pdf" };
};

const allowedTransitions = {
  applied: ["screening", "rejected", "withdrawn"],
  screening: ["shortlisted", "interview", "rejected", "withdrawn"],
  shortlisted: ["interview", "offered", "rejected", "withdrawn"],
  interview: ["shortlisted", "offered", "rejected", "withdrawn"],
  offered: ["hired", "rejected", "withdrawn"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

const updateApplicationStatus = async (id, { status, note = "" }, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid application ID.", 400);
  }

  const application = await Application.findById(id);

  if (!application) {
    throw createError("Application not found.", 404);
  }

  if (!allowedTransitions[application.status]?.includes(status)) {
    throw createError(`Status cannot change from ${application.status} to ${status}.`, 400);
  }

  const previousStatus = application.status;

  application.status = status;
  application.reviewedAt = new Date();

  application.statusHistory.push({
    fromStatus: previousStatus,
    toStatus: status,
    changedBy: userId,
    note,
    changedAt: new Date(),
  });

  await application.save();

  return application;
};

const addInternalNote = async (id, text, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid application ID.", 400);
  }

  const application = await Application.findById(id);

  if (!application) {
    throw createError("Application not found.", 404);
  }

  application.internalNotes.push({
    text: text.trim(),
    createdBy: userId,
  });

  await application.save();

  return application;
};

module.exports = {
  submitApplication,
  listApplications,
  getApplicationById,
  getResumeDownloadUrl,
  updateApplicationStatus,
  addInternalNote,
};
