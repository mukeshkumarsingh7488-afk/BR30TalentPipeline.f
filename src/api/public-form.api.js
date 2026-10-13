import http from "./http.js";

export const getPublicForms = () => http.get("/public-forms");
export const createPublicForm = (data) => http.post("/public-forms", data);
export const updatePublicForm = (id, data) => http.patch(`/public-forms/${id}`, data);
export const setPublicFormStatus = (id, status) => http.patch(`/public-forms/${id}/status`, { status });
export const deletePublicForm = (id) => http.delete(`/public-forms/${id}`);
export const getPublicForm = (publicId) => http.get(`/public-forms/public/${encodeURIComponent(publicId)}`);
export const getPublicJobRoles = () => http.get("/job-roles/public");
export const submitPublicApplication = (formData) => http.post("/applications", formData);
