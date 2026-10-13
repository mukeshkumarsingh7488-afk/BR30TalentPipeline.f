const mongoose = require("mongoose");
const Candidate = require("./candidate.model");
const { uploadProfileImage } = require("../../config/cloudinary-upload");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const upsertCandidateForApplication = async (data, imageFile) => {
  const email = data.email.trim().toLowerCase();
  const emailKey = email;

  let profileImage;

  if (imageFile) {
    if (!imageFile.mimetype?.startsWith("image/")) {
      throw createError("Profile image must be an image.", 400);
    }

    profileImage = await uploadProfileImage(imageFile);
  }

  let candidate = await Candidate.findOne({ emailKey });

  const fields = {
    fullName: data.fullName.trim(),
    email,
    emailKey,
    mobile: data.mobile.trim(),
    location: data.location || "",
    githubUrl: data.githubUrl || "",
    portfolioUrl: data.portfolioUrl || "",
    linkedinUrl: data.linkedinUrl || "",
    skills: data.skills || [],
    education: data.education || [],
    experienceYears: data.experienceYears || 0,
    currentCompany: data.currentCompany || "",
    projects: data.projects || [],
  };

  if (profileImage) {
    fields.profileImage = {
      publicId: profileImage.public_id,
      url: profileImage.secure_url,
      format: profileImage.format || "",
    };
  }

  if (!candidate) {
    try {
      candidate = await Candidate.create(fields);
    } catch (error) {
      // Handles concurrent submissions using the same email.
      if (error.code !== 11000) throw error;

      candidate = await Candidate.findOne({ emailKey });

      if (!candidate) throw error;
    }
  }

  if (candidate) {
    Object.assign(candidate, fields);
    await candidate.save();
  }

  return candidate;
};

const listCandidates = async (query) => {
  const filter = {};

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");

    filter.$or = [{ fullName: regex }, { email: regex }, { mobile: regex }, { location: regex }];
  }

  const skip = (query.page - 1) * query.limit;

  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .sort({
        [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
        _id: 1,
      })
      .skip(skip)
      .limit(query.limit)
      .lean(),

    Candidate.countDocuments(filter),
  ]);

  return {
    candidates,
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

const getCandidateById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid candidate ID.", 400);
  }

  const candidate = await Candidate.findById(id).lean();

  if (!candidate) {
    throw createError("Candidate not found.", 404);
  }

  return candidate;
};

module.exports = {
  upsertCandidateForApplication,
  listCandidates,
  getCandidateById,
};
