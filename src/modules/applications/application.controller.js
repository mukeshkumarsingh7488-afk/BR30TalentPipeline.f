const asyncHandler = require("../../utils/asyncHandler");
const applicationService = require("./application.service");
const publicFormController = require("./public-form.controller");
const { candidateProfileSchema } = require("../candidates/candidate.validator");
const {
  applicationSubmissionSchema,
  listApplicationsSchema,
  applicationIdSchema,
  updateApplicationStatusSchema,
  addInternalNoteSchema,
} = require("./application.validator");

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));
    error.statusCode = 400;
    throw error;
  }
  return result.data;
};

const parseJsonField = (value, fieldName, fallback) => {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    const error = new Error(`${fieldName} must contain valid JSON.`);
    error.statusCode = 400;
    throw error;
  }
};

const isValidImageSignature = (file) => {
  if (!file || !Buffer.isBuffer(file.buffer)) return false;
  const buffer = file.buffer;
  const isJpeg = buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return isJpeg || isPng || isWebp;
};

const sanitizeApplication = (value) => {
  if (!value) return value;
  const application = typeof value.toObject === "function" ? value.toObject() : { ...value };
  if (application.resume) {
    application.resume = {
      format: application.resume.format,
      bytes: application.resume.bytes,
      originalName: application.resume.originalName,
    };
  }
  return application;
};

const submitApplication = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  body.skills = parseJsonField(body.skills, "skills", []);
  body.education = parseJsonField(body.education, "education", []);
  body.projects = parseJsonField(body.projects, "projects", []);

  const candidateFields = {
    fullName: body.fullName,
    email: body.email,
    mobile: body.mobile,
    location: body.location,
    githubUrl: body.githubUrl,
    portfolioUrl: body.portfolioUrl,
    linkedinUrl: body.linkedinUrl,
    skills: body.skills,
    experienceYears: body.experienceYears,
    currentCompany: body.currentCompany,
    education: body.education,
    projects: body.projects,
  };
  const candidateData = validate(candidateProfileSchema, candidateFields);
  const applicationData = validate(applicationSubmissionSchema, {
    jobRoleId: body.jobRoleId,
    coverLetter: body.coverLetter || "",
    expectedSalary: body.expectedSalary,
    salaryCurrency: body.salaryCurrency || "INR",
  });

  const resumeFile = req.files?.resume?.[0];
  const profileImageFile = req.files?.profileImage?.[0];

  if (!resumeFile) {
    const error = new Error("Resume PDF is required.");
    error.statusCode = 400;
    throw error;
  }
  if (resumeFile.mimetype !== "application/pdf" || !Buffer.isBuffer(resumeFile.buffer) || !resumeFile.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    const error = new Error("Resume must be a valid PDF file.");
    error.statusCode = 400;
    throw error;
  }
  if (profileImageFile) {
    if (profileImageFile.size > 2 * 1024 * 1024) {
      const error = new Error("Profile image cannot exceed 2 MB.");
      error.statusCode = 400;
      throw error;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(profileImageFile.mimetype) || !isValidImageSignature(profileImageFile)) {
      const error = new Error("Profile image must be a valid JPG, PNG or WebP file.");
      error.statusCode = 400;
      throw error;
    }
  }

  const publicForm = await publicFormController.assertPublishedForm(body.publicFormId, applicationData.jobRoleId);
  if (publicForm && !publicForm.allowCoverLetter) applicationData.coverLetter = "";
  const acceptedProfileImage = publicForm && !publicForm.allowProfileImage ? null : profileImageFile;
  const result = await applicationService.submitApplication({ candidateData, applicationData, resumeFile, profileImageFile: acceptedProfileImage });
  res.status(201).json({ success: true, message: "Application submitted successfully.", data: result });
});

const listApplications = asyncHandler(async (req, res) => {
  const query = validate(listApplicationsSchema, req.query);
  const result = await applicationService.listApplications(query);
  res.status(200).json({
    success: true,
    data: result.applications.map(sanitizeApplication),
    pagination: result.pagination,
  });
});

const getApplication = asyncHandler(async (req, res) => {
  const id = validate(applicationIdSchema, req.params.id);
  const application = await applicationService.getApplicationById(id);
  res.status(200).json({ success: true, data: sanitizeApplication(application) });
});

const getResumeDownloadUrl = asyncHandler(async (req, res) => {
  const id = validate(applicationIdSchema, req.params.id);
  const result = await applicationService.getResumeDownloadUrl(id);
  res.setHeader("Cache-Control", "no-store, private");
  res.status(200).json({ success: true, data: result });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const id = validate(applicationIdSchema, req.params.id);
  const data = validate(updateApplicationStatusSchema, req.body);
  const application = await applicationService.updateApplicationStatus(id, data, req.user.id);
  res.status(200).json({ success: true, message: "Application status updated successfully.", data: sanitizeApplication(application) });
});

const addInternalNote = asyncHandler(async (req, res) => {
  const id = validate(applicationIdSchema, req.params.id);
  const data = validate(addInternalNoteSchema, req.body);
  const application = await applicationService.addInternalNote(id, data.text, req.user.id);
  res.status(201).json({ success: true, message: "Internal note added successfully.", data: sanitizeApplication(application) });
});

module.exports = { submitApplication, listApplications, getApplication, getResumeDownloadUrl, updateApplicationStatus, addInternalNote };
