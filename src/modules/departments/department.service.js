const mongoose = require("mongoose");
const Department = require("./department.model");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid department ID.", 400);
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const handleDatabaseError = (error) => {
  if (error.code === 11000) {
    throw createError("A department with this name already exists.", 409);
  }

  if (error.name === "ValidationError") {
    throw createError(error.message, 400);
  }

  throw error;
};

const createDepartment = async (data, userId) => {
  const name = data.name.trim();

  try {
    const department = await Department.create({
      name,
      nameKey: name.toLowerCase(),
      description: data.description || "",
      isActive: data.isActive ?? true,
      createdBy: userId,
      updatedBy: userId,
    });

    return department;
  } catch (error) {
    handleDatabaseError(error);
  }
};

const listDepartments = async (query) => {
  const { page, limit, search, status, sortBy, sortOrder } = query;

  const filter = {};

  if (status === "active") {
    filter.isActive = true;
  } else if (status === "inactive") {
    filter.isActive = false;
  }

  if (search) {
    filter.name = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  const sort = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
    _id: 1,
  };

  const skip = (page - 1) * limit;

  const [departments, total] = await Promise.all([Department.find(filter).sort(sort).skip(skip).limit(limit).populate("createdBy", "name email").populate("updatedBy", "name email").lean(), Department.countDocuments(filter)]);

  return {
    departments,
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

// For the public application form in a later integration.
const listActiveDepartments = async () => {
  return Department.find({ isActive: true }).select("_id name description").sort({ name: 1 }).lean();
};

const getDepartmentById = async (id) => {
  validateObjectId(id);

  const department = await Department.findById(id).populate("createdBy", "name email").populate("updatedBy", "name email").lean();

  if (!department) {
    throw createError("Department not found.", 404);
  }

  return department;
};

const updateDepartment = async (id, data, userId) => {
  validateObjectId(id);

  const department = await Department.findById(id);

  if (!department) {
    throw createError("Department not found.", 404);
  }

  if (data.name !== undefined) {
    department.name = data.name.trim();
    department.nameKey = data.name.trim().toLowerCase();
  }

  if (data.description !== undefined) {
    department.description = data.description;
  }

  if (data.isActive !== undefined) {
    department.isActive = data.isActive;
  }

  department.updatedBy = userId;

  try {
    await department.save();
    return department;
  } catch (error) {
    handleDatabaseError(error);
  }
};

const setDepartmentStatus = async (id, isActive, userId) => {
  validateObjectId(id);

  const department = await Department.findById(id);

  if (!department) {
    throw createError("Department not found.", 404);
  }

  department.isActive = isActive;
  department.updatedBy = userId;

  try {
    await department.save();
    return department;
  } catch (error) {
    handleDatabaseError(error);
  }
};

const deleteDepartment = async (id, userId) => {
  // Deliberately soft-delete: preserve historical application references.
  return setDepartmentStatus(id, false, userId);
};

module.exports = {
  createDepartment,
  listDepartments,
  listActiveDepartments,
  getDepartmentById,
  updateDepartment,
  setDepartmentStatus,
  deleteDepartment,
};
