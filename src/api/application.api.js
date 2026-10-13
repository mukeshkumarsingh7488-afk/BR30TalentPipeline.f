import http from "./http.js";

export const getApplications = (params = {}, options = {}) =>
  http.get("/applications", {
    ...options,
    params,
  });

export const getApplication = (id, options = {}) => http.get(`/applications/${encodeURIComponent(id)}`, options);

export const updateApplicationStatus = (id, status, note = "", options = {}) => http.patch(`/applications/${encodeURIComponent(id)}/status`, { status, note }, options);

export const addApplicationNote = (id, text, options = {}) => http.post(`/applications/${encodeURIComponent(id)}/notes`, { text }, options);

export const getResumeDownloadUrl = (id, options = {}) => http.get(`/applications/${encodeURIComponent(id)}/resume`, options);

export const getResumePreview = (id, options = {}) =>
  http.get(`/applications/${encodeURIComponent(id)}/resume/preview`, {
    ...options,
    responseType: "blob",
  });

export const downloadResume = (id, options = {}) =>
  http.get(`/applications/${encodeURIComponent(id)}/resume/preview`, {
    ...options,
    responseType: "blob",
  });
