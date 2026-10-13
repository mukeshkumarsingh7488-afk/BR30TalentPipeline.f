import http from "./http.js";
export const getCandidates = (params = {}, options = {}) => http.get("/candidates", { ...options, params });
export const getCandidate = (id, options = {}) => http.get(`/candidates/${encodeURIComponent(id)}`, options);
