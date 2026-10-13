import http from "./http.js";

/**
 * GET /api/v1/dashboard/overview
 * Fetch dashboard summary and recruitment statistics.
 */
export function getDashboardOverview(options = {}) {
  return http.get("/dashboard/overview", options);
}

/**
 * GET /api/v1/dashboard/application-analytics
 * Fetch application analytics for dashboard charts.
 */
export function getApplicationAnalytics(options = {}) {
  return http.get("/dashboard/application-analytics", options);
}

/**
 * GET /api/v1/dashboard/export/applications.csv
 * Download applications as a CSV file.
 */
export async function exportApplicationsCsv(options = {}) {
  const { params, signal } = options;

  const query = new URLSearchParams();

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
  }

  const queryString = query.toString();
  const endpoint = `/dashboard/export/applications.csv${queryString ? `?${queryString}` : ""}`;

  const token = (() => {
    try {
      return localStorage.getItem("br30-talent-pipeline-token");
    } catch {
      return null;
    }
  })();

  let response;

  try {
    response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "")}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "text/csv, application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;

    throw new Error("Unable to connect to the server. Check that the backend is running.");
  }

  if (!response.ok) {
    let message = `CSV export failed with status ${response.status}.`;

    try {
      const body = await response.json();
      message = body?.message || body?.error || message;
    } catch {
      // The server may return a non-JSON error.
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();

  const contentDisposition = response.headers.get("content-disposition") || "";
  const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i);

  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1].replace(/"$/, "").trim()) : "applications.csv";

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(downloadUrl);

  return {
    success: true,
    filename,
  };
}

const dashboardApi = {
  getDashboardOverview,
  getApplicationAnalytics,
  exportApplicationsCsv,
};

export default dashboardApi;
