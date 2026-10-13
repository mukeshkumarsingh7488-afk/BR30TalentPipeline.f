import http from "./http.js";

// GET /api/v1/departments
export function getDepartments(params = {}, options = {}) {
  return http.get("/departments", { ...options, params });
}

// GET /api/v1/departments/:id
export function getDepartment(id, options = {}) {
  return http.get(`/departments/${encodeURIComponent(id)}`, options);
}

// POST /api/v1/departments
export function createDepartment(payload, options = {}) {
  return http.post("/departments", payload, options);
}

// PATCH /api/v1/departments/:id
export function updateDepartment(id, payload, options = {}) {
  return http.patch(`/departments/${encodeURIComponent(id)}`, payload, options);
}

// PATCH /api/v1/departments/:id/status
export function setDepartmentStatus(id, isActive, options = {}) {
  return http.patch(`/departments/${encodeURIComponent(id)}/status`, { isActive: Boolean(isActive) }, options);
}

// DELETE /api/v1/departments/:id
// Backend soft-deactivates the department.
export function deleteDepartment(id, options = {}) {
  return http.delete(`/departments/${encodeURIComponent(id)}`, options);
}

const departmentApi = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  setDepartmentStatus,
  deleteDepartment,
};

export default departmentApi;
