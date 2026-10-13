import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { loginApi, registerApi, verifyEmailApi, resendVerificationApi, forgotPasswordApi, resetPasswordApi } from "../api/auth.api.js";

const AuthContext = createContext(null);

export const AUTH_TOKEN_KEY = "br30-talent-pipeline-token";
export const AUTH_USER_KEY = "br30-talent-pipeline-user";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readSavedUser() {
  const savedUser = readStorage(AUTH_USER_KEY);

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function getTokenFromResponse(body) {
  return body?.accessToken || body?.token || body?.data?.accessToken || body?.data?.token || body?.data?.tokens?.accessToken || body?.tokens?.accessToken || null;
}

function getUserFromResponse(body) {
  return body?.user || body?.data?.user || body?.data?.hr || body?.hr || null;
}

function getErrorMessage(body, fallback) {
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.error === "string") return body.error;

  if (Array.isArray(body?.errors) && body.errors.length) {
    return body.errors
      .map((error) => (typeof error === "string" ? error : error?.message))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof body?.errors === "string") return body.errors;

  return fallback;
}

function saveSession(token, user) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    clearSavedSession();

    throw new Error("Unable to save your login session. Please enable browser storage.");
  }
}

function clearSavedSession() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Session state can still be cleared in memory.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStorage(AUTH_TOKEN_KEY));
  const [user, setUser] = useState(() => readSavedUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const savedToken = readStorage(AUTH_TOKEN_KEY);
    const savedUser = readSavedUser();

    setToken(savedToken);

    if (savedToken && savedUser) {
      setUser(savedUser);
    } else {
      setUser(null);

      if (!savedToken || !savedUser) {
        clearSavedSession();
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError("");

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      const error = new Error("Email and password are required.");
      setAuthError(error.message);
      throw error;
    }

    try {
      const body = await loginApi({
        email: normalizedEmail,
        password,
      });

      const newToken = getTokenFromResponse(body);
      const newUser = getUserFromResponse(body);

      if (!newToken || !newUser) {
        throw new Error(getErrorMessage(body, "Login response is missing the authentication token or user."));
      }

      if (!["ADMIN", "HR"].includes(newUser.role)) {
        throw new Error("Your account role is not authorized.");
      }

      if (newUser.isActive !== true || newUser.emailVerified !== true) {
        throw new Error("Your account is not eligible to access the dashboard.");
      }

      if (newUser.role === "HR" && newUser.approvalStatus !== "APPROVED") {
        throw new Error("Your HR account is awaiting admin approval.");
      }

      saveSession(newToken, newUser);

      setToken(newToken);
      setUser(newUser);
      setAuthError("");

      return {
        token: newToken,
        user: newUser,
        response: body,
      };
    } catch (error) {
      const message = error?.message || "Login failed. Please try again.";
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError("");

    try {
      return await registerApi({
        name: payload?.name,
        email: payload?.email,
        password: payload?.password,
      });
    } catch (error) {
      const message = error?.message || "Registration failed.";
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const verifyEmail = useCallback(async (payload) => {
    setAuthError("");

    try {
      return await verifyEmailApi(payload);
    } catch (error) {
      const message = error?.message || "Email verification failed.";
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const resendVerification = useCallback(async (payload) => {
    setAuthError("");

    try {
      return await resendVerificationApi(payload);
    } catch (error) {
      const message = error?.message || "Unable to resend verification code.";
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const forgotPassword = useCallback(async (payload) => {
    setAuthError("");

    try {
      return await forgotPasswordApi(payload);
    } catch (error) {
      const message = error?.message || "Password recovery request failed.";
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const resetPassword = useCallback(async (payload) => {
    setAuthError("");

    try {
      return await resetPasswordApi(payload);
    } catch (error) {
      const message = error?.message || "Password reset failed.";
      setAuthError(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    clearSavedSession();

    setToken(null);
    setUser(null);
    setAuthError("");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((currentUser) => {
      const nextUser = typeof updatedUser === "function" ? updatedUser(currentUser) : updatedUser;

      try {
        if (nextUser) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
        } else {
          localStorage.removeItem(AUTH_USER_KEY);
        }
      } catch {
        // Keep the updated user in memory.
      }

      return nextUser;
    });
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === "ADMIN";
  const isHR = user?.role === "HR" && user?.approvalStatus === "APPROVED";

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authError,
      isAuthenticated,
      isAdmin,
      isHR,
      login,
      register,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      logout,
      updateUser,
      clearAuthError,
    }),
    [user, token, loading, authError, isAuthenticated, isAdmin, isHR, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, logout, updateUser, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export default AuthContext;
