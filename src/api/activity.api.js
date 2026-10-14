import http from "./http.js";
export const getActivities = (params = {}, options = {}) => http.get("/activity", { ...options, params });
export const getApplicationNotifications = (options = {}) => http.get("/activity/notifications", options);
export const markActivityRead = (id, options = {}) => http.patch(`/activity/${encodeURIComponent(id)}/read`, {}, options);
export const markAllNotificationsRead = (options = {}) => http.patch("/activity/notifications/read-all", {}, options);
