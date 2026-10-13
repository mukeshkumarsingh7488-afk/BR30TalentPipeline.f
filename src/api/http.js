import { AUTH_TOKEN_KEY } from "../context/AuthContext.jsx";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request(method, endpoint, options = {}) {
  const { params, data, headers = {}, signal, responseType = "json" } = options;

  const normalizedEndpoint = String(endpoint).replace(/^\/+/, "");
  const url = new URL(`${API_BASE_URL}/${normalizedEndpoint}`);

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          url.searchParams.append(key, String(item));
        });
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  const requestHeaders = {
    Accept: responseType === "blob" ? "application/pdf, application/json" : "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (data !== undefined && data !== null && !isFormData) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] || "application/json";
  }

  let response;

  try {
    response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: data === undefined || data === null ? undefined : isFormData ? data : JSON.stringify(data),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error("Unable to connect to the server. Check that the backend is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  let responseData = null;

  if (response.status !== 204) {
    if (responseType === "blob") {
      responseData = await response.blob();

      // If the server returned a JSON error, expose its actual message.
      if (!response.ok && contentType.includes("application/json")) {
        const errorText = await responseData.text();

        try {
          responseData = JSON.parse(errorText);
        } catch {
          responseData = errorText;
        }
      }
    } else if (contentType.includes("application/json")) {
      responseData = await response.json().catch(() => null);
    } else {
      responseData = await response.text().catch(() => "");
    }
  }

  if (!response.ok) {
    let errorMessage = "";

    if (responseData instanceof Blob) {
      errorMessage = await responseData.text().catch(() => "");
      try {
        responseData = JSON.parse(errorMessage);
      } catch {
        // Keep the original text if it is not JSON.
        responseData = errorMessage;
      }
    }

    const message =
      responseData?.message ||
      responseData?.error ||
      (Array.isArray(responseData?.errors)
        ? responseData.errors
            .map((item) => (typeof item === "string" ? item : item?.message))
            .filter(Boolean)
            .join(", ")
        : typeof responseData?.errors === "string"
          ? responseData.errors
          : typeof responseData === "string" && responseData.trim()
            ? responseData
            : `Request failed with status ${response.status}.`);

    const error = new Error(message);
    error.status = response.status;
    error.data = responseData;

    throw error;
  }

  return responseData;
}

const http = {
  get(endpoint, options = {}) {
    return request("GET", endpoint, options);
  },

  post(endpoint, data, options = {}) {
    return request("POST", endpoint, {
      ...options,
      data,
    });
  },

  put(endpoint, data, options = {}) {
    return request("PUT", endpoint, {
      ...options,
      data,
    });
  },

  patch(endpoint, data, options = {}) {
    return request("PATCH", endpoint, {
      ...options,
      data,
    });
  },

  delete(endpoint, options = {}) {
    return request("DELETE", endpoint, options);
  },

  request,
};

export { API_BASE_URL };
export default http;
