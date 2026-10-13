const mongoose = require("mongoose");

const JobRole = require("./job-role.model");
const Department = require("../departments/department.model");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid job role ID.", 400);
  }
};

const handleDatabaseError = (error) => {
  if (error.code === 11000) {
    throw createError("A job role with this title already exists in the selected department.", 409);
  }

  if (error.name === "ValidationError") {
    throw createError(error.message, 400);
  }

  throw error;
};

const ensureActiveDepartment = async (departmentId) => {
  if (!mongoose.isValidObjectId(departmentId)) {
    throw createError("Invalid department ID.", 400);
  }

  const department = await Department.findOne({
    _id: departmentId,
    isActive: true,
  })
    .select("_id name")
    .lean();

  if (!department) {
    throw createError("Selected department does not exist or is inactive.", 400);
  }

  return department;
};

const normalizeArray = (items) => (Array.isArray(items) ? items.map((item) => item.trim()).filter(Boolean) : []);

const validateRelatedRanges = (data) => {
  if (data.minExperienceYears !== undefined && data.maxExperienceYears !== undefined && data.maxExperienceYears !== null && data.maxExperienceYears < data.minExperienceYears) {
    throw createError("Maximum experience must be greater than or equal to minimum experience.", 400);
  }

  if (data.salaryMin !== undefined && data.salaryMax !== undefined && data.salaryMin !== null && data.salaryMax !== null && data.salaryMax < data.salaryMin) {
    throw createError("Maximum salary must be greater than or equal to minimum salary.", 400);
  }
};

const createJobRole = async (data, userId) => {
  await ensureActiveDepartment(data.departmentId);
  validateRelatedRanges(data);

  const payload = {
    ...data,
    title: data.title.trim(),
    titleKey: data.title.trim().toLowerCase(),
    responsibilities: normalizeArray(data.responsibilities),
    requiredSkills: normalizeArray(data.requiredSkills),
    preferredSkills: normalizeArray(data.preferredSkills),
    createdBy: userId,
    updatedBy: userId,
  };

  try {
    return await JobRole.create(payload);
  } catch (error) {
    handleDatabaseError(error);
  }
};

const listJobRoles = async (query) => {
  const { page, limit, search, departmentId, status, employmentType, workMode, sortBy, sortOrder } = query;

  const filter = {};

  if (departmentId) {
    filter.departmentId = departmentId;
  }

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (employmentType) filter.employmentType = employmentType;
  if (workMode) filter.workMode = workMode;

  if (search) {
    filter.title = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  const sort = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
    _id: 1,
  };

  const skip = (page - 1) * limit;

  const [jobRoles, total] = await Promise.all([JobRole.find(filter).sort(sort).skip(skip).limit(limit).populate("departmentId", "name isActive").populate("createdBy", "name email").populate("updatedBy", "name email").lean(), JobRole.countDocuments(filter)]);

  return {
    jobRoles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

// Public application form: only active roles in active departments.
const listPublicJobRoles = async (query) => {
  const filter = {
    isActive: true,
  };

  if (query.departmentId) {
    filter.departmentId = query.departmentId;
  }

  if (query.employmentType) {
    filter.employmentType = query.employmentType;
  }

  if (query.workMode) {
    filter.workMode = query.workMode;
  }

  if (query.search) {
    filter.title = {
      $regex: escapeRegex(query.search),
      $options: "i",
    };
  }

  const activeDepartments = await Department.find({
    isActive: true,
  })
    .select("_id")
    .lean();

  const activeDepartmentIds = activeDepartments.map((department) => department._id);

  filter.departmentId = {
    $in: activeDepartmentIds,
    ...(query.departmentId ? { $eq: new mongoose.Types.ObjectId(query.departmentId) } : {}),
  };

  return JobRole.find(filter).select("title description responsibilities requiredSkills preferredSkills minExperienceYears maxExperienceYears employmentType workMode location salaryMin salaryMax currency departmentId").populate("departmentId", "name").sort({ title: 1 }).lean();
};

const getJobRoleById = async (id) => {
  validateId(id);

  const jobRole = await JobRole.findById(id).populate("departmentId", "name isActive").populate("createdBy", "name email").populate("updatedBy", "name email").lean();

  if (!jobRole) {
    throw createError("Job role not found.", 404);
  }

  return jobRole;
};

const updateJobRole = async (id, data, userId) => {
  validateId(id);

  const jobRole = await JobRole.findById(id);

  if (!jobRole) {
    throw createError("Job role not found.", 404);
  }

  if (data.departmentId !== undefined) {
    await ensureActiveDepartment(data.departmentId);
    jobRole.departmentId = data.departmentId;
  }

  if (data.title !== undefined) {
    jobRole.title = data.title.trim();
    jobRole.titleKey = data.title.trim().toLowerCase();
  }

  const directFields = ["description", "responsibilities", "requiredSkills", "preferredSkills", "minExperienceYears", "maxExperienceYears", "employmentType", "workMode", "location", "salaryMin", "salaryMax", "currency", "isActive"];

  for (const field of directFields) {
    if (data[field] !== undefined) {
      jobRole[field] = Array.isArray(data[field]) ? normalizeArray(data[field]) : data[field];
    }
  }

  validateRelatedRanges({
    minExperienceYears: jobRole.minExperienceYears,
    maxExperienceYears: jobRole.maxExperienceYears,
    salaryMin: jobRole.salaryMin,
    salaryMax: jobRole.salaryMax,
  });

  jobRole.updatedBy = userId;

  try {
    await jobRole.save();
    return jobRole;
  } catch (error) {
    handleDatabaseError(error);
  }
};

const setJobRoleStatus = async (id, isActive, userId) => {
  validateId(id);

  const jobRole = await JobRole.findById(id);

  if (!jobRole) {
    throw createError("Job role not found.", 404);
  }

  if (isActive) {
    await ensureActiveDepartment(jobRole.departmentId);
  }

  jobRole.isActive = isActive;
  jobRole.updatedBy = userId;

  try {
    await jobRole.save();
    return jobRole;
  } catch (error) {
    handleDatabaseError(error);
  }
};

const deleteJobRole = async (id, userId) => setJobRoleStatus(id, false, userId);

module.exports = {
  createJobRole,
  listJobRoles,
  listPublicJobRoles,
  getJobRoleById,
  updateJobRole,
  setJobRoleStatus,
  deleteJobRole,
};
