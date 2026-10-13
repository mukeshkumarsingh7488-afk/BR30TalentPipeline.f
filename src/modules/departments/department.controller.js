const asyncHandler = require("../../utils/asyncHandler");
const departmentService = require("./department.service");

const { createDepartmentSchema, updateDepartmentSchema, departmentIdSchema, listDepartmentsSchema, setDepartmentStatusSchema } = require("./department.validator");

const validate = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));

    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

const createDepartment = asyncHandler(async (req, res) => {
  const data = validate(createDepartmentSchema, req.body);

  const department = await departmentService.createDepartment(data, req.user.id);

  res.status(201).json({
    success: true,
    message: "Department created successfully.",
    data: department,
  });
});

const listDepartments = asyncHandler(async (req, res) => {
  const query = validate(listDepartmentsSchema, req.query);
  const result = await departmentService.listDepartments(query);

  res.status(200).json({
    success: true,
    data: result.departments,
    pagination: result.pagination,
  });
});

const getDepartment = asyncHandler(async (req, res) => {
  const id = validate(departmentIdSchema, req.params.id);
  const department = await departmentService.getDepartmentById(id);

  res.status(200).json({
    success: true,
    data: department,
  });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const id = validate(departmentIdSchema, req.params.id);
  const data = validate(updateDepartmentSchema, req.body);

  const department = await departmentService.updateDepartment(id, data, req.user.id);

  res.status(200).json({
    success: true,
    message: "Department updated successfully.",
    data: department,
  });
});

const setDepartmentStatus = asyncHandler(async (req, res) => {
  const id = validate(departmentIdSchema, req.params.id);
  const data = validate(setDepartmentStatusSchema, req.body);

  const department = await departmentService.setDepartmentStatus(id, data.isActive, req.user.id);

  res.status(200).json({
    success: true,
    message: data.isActive ? "Department activated successfully." : "Department deactivated successfully.",
    data: department,
  });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const id = validate(departmentIdSchema, req.params.id);

  const department = await departmentService.deleteDepartment(id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Department deactivated successfully.",
    data: department,
  });
});

module.exports = {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  setDepartmentStatus,
  deleteDepartment,
};
