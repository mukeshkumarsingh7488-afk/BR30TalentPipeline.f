import http from "./http.js";

// GET /api/v1/job-roles
export function getJobRoles(params = {}, options = {}) {
  return http.get("/job-roles", { ...options, params });
}

// GET /api/v1/job-roles/:id
export function getJobRole(id, options = {}) {
  return http.get(`/job-roles/${encodeURIComponent(id)}`, options);
}

// GET /api/v1/job-roles/public
export function getPublicJobRoles(params = {}, options = {}) {
  return http.get("/job-roles/public", { ...options, params });
}

// POST /api/v1/job-roles
export function createJobRole(payload, options = {}) {
  return http.post("/job-roles", payload, options);
}

// PATCH /api/v1/job-roles/:id
export function updateJobRole(id, payload, options = {}) {
  return http.patch(`/job-roles/${encodeURIComponent(id)}`, payload, options);
}

// PATCH /api/v1/job-roles/:id/status
export function setJobRoleStatus(id, isActive, options = {}) {
  return http.patch(`/job-roles/${encodeURIComponent(id)}/status`, { isActive: Boolean(isActive) }, options);
}

// DELETE /api/v1/job-roles/:id
// Backend soft-deactivates the job role.
export function deleteJobRole(id, options = {}) {
  return http.delete(`/job-roles/${encodeURIComponent(id)}`, options);
}

const jobRoleApi = {
  getJobRoles,
  getJobRole,
  getPublicJobRoles,
  createJobRole,
  updateJobRole,
  setJobRoleStatus,
  deleteJobRole,
};

export default jobRoleApi;
