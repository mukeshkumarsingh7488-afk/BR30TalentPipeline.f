import http from "./http.js";
export const getInterviews = (params = {}, options = {}) => http.get("/interviews", { ...options, params });
export const createInterview = (payload, options = {}) => http.post("/interviews", payload, options);
export const updateInterview = (id, payload, options = {}) => http.patch(`/interviews/${encodeURIComponent(id)}`, payload, options);
export const deleteInterview = (id, options = {}) => http.delete(`/interviews/${encodeURIComponent(id)}`, options);
