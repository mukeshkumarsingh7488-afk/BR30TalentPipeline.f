const asyncHandler = require("../../utils/asyncHandler");
const jobRoleService = require("./job-role.service");

const { createJobRoleSchema, updateJobRoleSchema, listJobRolesSchema, publicJobRolesSchema, jobRoleIdSchema, setJobRoleStatusSchema } = require("./job-role.validator");

const validate = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));

    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

const createJobRole = asyncHandler(async (req, res) => {
  const data = validate(createJobRoleSchema, req.body);

  const jobRole = await jobRoleService.createJobRole(data, req.user.id);

  res.status(201).json({
    success: true,
    message: "Job role created successfully.",
    data: jobRole,
  });
});

const listJobRoles = asyncHandler(async (req, res) => {
  const query = validate(listJobRolesSchema, req.query);
  const result = await jobRoleService.listJobRoles(query);

  res.status(200).json({
    success: true,
    data: result.jobRoles,
    pagination: result.pagination,
  });
});

const listPublicJobRoles = asyncHandler(async (req, res) => {
  const query = validate(publicJobRolesSchema, req.query);
  const jobRoles = await jobRoleService.listPublicJobRoles(query);

  res.status(200).json({
    success: true,
    data: jobRoles,
  });
});

const getJobRole = asyncHandler(async (req, res) => {
  const id = validate(jobRoleIdSchema, req.params.id);
  const jobRole = await jobRoleService.getJobRoleById(id);

  res.status(200).json({
    success: true,
    data: jobRole,
  });
});

const updateJobRole = asyncHandler(async (req, res) => {
  const id = validate(jobRoleIdSchema, req.params.id);
  const data = validate(updateJobRoleSchema, req.body);

  const jobRole = await jobRoleService.updateJobRole(id, data, req.user.id);

  res.status(200).json({
    success: true,
    message: "Job role updated successfully.",
    data: jobRole,
  });
});

const setJobRoleStatus = asyncHandler(async (req, res) => {
  const id = validate(jobRoleIdSchema, req.params.id);
  const data = validate(setJobRoleStatusSchema, req.body);

  const jobRole = await jobRoleService.setJobRoleStatus(id, data.isActive, req.user.id);

  res.status(200).json({
    success: true,
    message: data.isActive ? "Job role activated successfully." : "Job role deactivated successfully.",
    data: jobRole,
  });
});

const deleteJobRole = asyncHandler(async (req, res) => {
  const id = validate(jobRoleIdSchema, req.params.id);

  const jobRole = await jobRoleService.deleteJobRole(id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Job role deactivated successfully.",
    data: jobRole,
  });
});

module.exports = {
  createJobRole,
  listJobRoles,
  listPublicJobRoles,
  getJobRole,
  updateJobRole,
  setJobRoleStatus,
  deleteJobRole,
};
