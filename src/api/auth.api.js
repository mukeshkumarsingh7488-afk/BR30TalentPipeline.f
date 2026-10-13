const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

async function authRequest(endpoint, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to connect to the server. Check that the backend is running.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors)
        ? data.errors
            .map((item) => (typeof item === "string" ? item : item?.message))
            .filter(Boolean)
            .join(", ")
        : typeof data?.errors === "string"
          ? data.errors
          : "Authentication request failed.");

    throw new Error(message);
  }

  return data;
}

// HR registration
// POST /api/v1/auth/register
export function registerApi({ name, email, password }) {
  return authRequest("register", {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });
}

// HR and Admin login
// POST /api/v1/auth/login
export function loginApi({ email, password }) {
  return authRequest("login", {
    email: email.trim().toLowerCase(),
    password,
  });
}

// Verify email OTP
// POST /api/v1/auth/verify-email
export function verifyEmailApi({ email, otp }) {
  return authRequest("verify-email", {
    email: email.trim().toLowerCase(),
    otp: String(otp).trim(),
  });
}

// Resend verification OTP
// POST /api/v1/auth/resend-verification
export function resendVerificationApi({ email }) {
  return authRequest("resend-verification", {
    email: email.trim().toLowerCase(),
  });
}

// Request password-reset OTP
// POST /api/v1/auth/forgot-password
export function forgotPasswordApi({ email }) {
  return authRequest("forgot-password", {
    email: email.trim().toLowerCase(),
  });
}

// Reset password using email OTP
// POST /api/v1/auth/reset-password
export function resetPasswordApi({ email, otp, newPassword }) {
  return authRequest("reset-password", {
    email: email.trim().toLowerCase(),
    otp: String(otp).trim(),
    newPassword,
  });
}

// Admin-only: get pending HR accounts
// GET /api/v1/auth/hr/pending
export async function getPendingHRAccountsApi(token) {
  return authRequestWithToken("hr/pending", token, "GET");
}

// Admin-only: approve an HR account
// PATCH /api/v1/auth/hr/:userId/approve
export async function approveHRAccountApi(userId, token) {
  return authRequestWithToken(`hr/${encodeURIComponent(userId)}/approve`, token, "PATCH");
}

// Admin-only: reject an HR account
// PATCH /api/v1/auth/hr/:userId/reject
export async function rejectHRAccountApi(userId, token, reason = "") {
  return authRequestWithToken(`hr/${encodeURIComponent(userId)}/reject`, token, "PATCH", { reason });
}

async function authRequestWithToken(endpoint, token, method, payload) {
  if (!token) {
    throw new Error("Authentication required. Please log in again.");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
  } catch {
    throw new Error("Unable to connect to the server. Check that the backend is running.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || "Authentication request failed.";

    throw new Error(message);
  }

  return data;
}

const authApi = {
  register: registerApi,
  login: loginApi,
  verifyEmail: verifyEmailApi,
  resendVerification: resendVerificationApi,
  forgotPassword: forgotPasswordApi,
  resetPassword: resetPasswordApi,
  getPendingHRAccounts: getPendingHRAccountsApi,
  approveHRAccount: approveHRAccountApi,
  rejectHRAccount: rejectHRAccountApi,
};

export default authApi;
