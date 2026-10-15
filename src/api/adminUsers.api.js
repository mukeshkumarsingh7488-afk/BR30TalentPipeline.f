import axios from "axios";
import { AUTH_TOKEN_KEY } from "../context/AuthContext.jsx";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const adminUsersApi = {
  getUsers(params = {}) {
    return http.get("/auth/admin/users", { params });
  },

  blockUser(userId) {
    return http.patch(`/auth/admin/users/${userId}/block`);
  },

  unblockUser(userId) {
    return http.patch(`/auth/admin/users/${userId}/unblock`);
  },

  approveUser(userId) {
    return http.patch(`/auth/admin/users/${userId}/approve`);
  },

  unapproveUser(userId) {
    return http.patch(`/auth/admin/users/${userId}/unapprove`);
  },

  deleteUser(userId) {
    return http.delete(`/auth/admin/users/${userId}`);
  },
};

export default adminUsersApi;
