import axios from "axios";

// Parse configured API URLs (supports single or comma-separated URLs for Round Robin)
const rawConfiguredUrls =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const API_ENDPOINTS = rawConfiguredUrls
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean)
  .map((url) => {
    const clean = url.replace(/\/+$/, "");
    return clean.endsWith("/api/v1") ? clean : `${clean}/api/v1`;
  });

// Randomize starting index per user session so different visitors distribute evenly
let requestCounter = Math.floor(Math.random() * API_ENDPOINTS.length);

export const getNextApiBaseUrl = () => {
  if (API_ENDPOINTS.length <= 1) return API_ENDPOINTS[0];
  const url = API_ENDPOINTS[requestCounter % API_ENDPOINTS.length];
  requestCounter = (requestCounter + 1) % API_ENDPOINTS.length;
  return url;
};

const api = axios.create({
  baseURL: API_ENDPOINTS[0],
  timeout: 30000, // 30-second timeout to prevent infinite button loading freezes
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Dynamic Round-Robin target assignment + admin token
api.interceptors.request.use(
  (config) => {
    // If not a retry attempt, assign next Round-Robin endpoint
    if (!config.__isRetry && API_ENDPOINTS.length > 1) {
      config.baseURL = getNextApiBaseUrl();
    }
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response error handler with smart failover to alternate server on failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Smart Failover: If request failed with 500-504 or network timeout, retry on alternate server
    if (
      API_ENDPOINTS.length > 1 &&
      config &&
      !config.__isRetry &&
      (!error.response || error.response.status >= 500 || error.code === "ECONNABORTED")
    ) {
      config.__isRetry = true;
      const currentUrl = config.baseURL || API_ENDPOINTS[0];
      const backupServer = API_ENDPOINTS.find((u) => u !== currentUrl) || API_ENDPOINTS[0];
      config.baseURL = backupServer;
      console.warn(
        `[Load Balancer Failover] ${currentUrl} returned ${error.response?.status || "network error"}. Retrying immediately on backup server: ${backupServer}`,
      );
      return api(config);
    }

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return Promise.reject({
        response: {
          data: {
            message:
              "Server request timed out. Please check your network and try again.",
          },
        },
      });
    }
    return Promise.reject(error);
  },
);

// Public API methods
export const getPublicSettings = async () => {
  const response = await api.get("/event/settings", {
    params: { _t: Date.now() },
  });
  return response.data;
};

export const checkRegistrationStatus = async () => {
  const response = await api.get("/event/status");
  return response.data;
};

export const checkAvailability = async (data) => {
  const response = await api.post("/registrations/check", data);
  return response.data;
};

export const createRegistration = async (data) => {
  const response = await api.post("/registrations/register", data);
  return response.data;
};

export const submitPayment = async (formData) => {
  const response = await api.post("/registrations/payment", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 45000, // 45s for file uploads
  });
  return response.data;
};

export const lookupTeam = async (data) => {
  const response = await api.post("/registrations/lookup-team", data);
  return response.data;
};

export const getRegistrationStatus = async (registrationId) => {
  const response = await api.get(`/registrations/status/${registrationId}`);
  return response.data;
};

// Admin API methods
export const adminLogin = async (credentials) => {
  const response = await api.post("/auth/admin/login", credentials);
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await api.get("/auth/admin/me");
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getRegistrations = async (params = {}) => {
  const response = await api.get("/admin/registrations", { params });
  return response.data;
};

export const getRegistrationById = async (id) => {
  const response = await api.get(`/admin/registrations/${id}`);
  return response.data;
};

export const getAdminStudents = async () => {
  const response = await api.get("/admin/students");
  return response.data;
};

export const createAdminStudent = async (data) => {
  const response = await api.post("/admin/students", data);
  return response.data;
};

export const updateAdminStudent = async (id, data) => {
  const response = await api.patch(`/admin/students/${id}`, data);
  return response.data;
};

export const verifyRegistrationPayment = async (id) => {
  const response = await api.patch(`/admin/registrations/${id}/verify`);
  return response.data;
};

export const rejectRegistrationPayment = async (id, reason) => {
  const response = await api.patch(`/admin/registrations/${id}/reject`, {
    reason,
  });
  return response.data;
};

export const updateRegistrationStatus = async (id, status, reason = "") => {
  const response = await api.patch(`/admin/registrations/${id}/status`, {
    status,
    reason,
  });
  return response.data;
};

export const downloadRegistrationsExcel = async (
  status = "ALL",
  residency = "ALL",
) => {
  const response = await api.get("/admin/export/excel", {
    params: { status, residency },
    responseType: "blob",
  });

  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `Team_Registrations_${status}_${residency}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

export const getAdminSettings = async () => {
  const response = await api.get("/admin/settings");
  return response.data;
};

export const updateAdminSettings = async (data) => {
  const response = await api.patch("/admin/settings", data);
  return response.data;
};

export const uploadQRCode = async (fileOrFiles, title = "", upiId = "") => {
  const formData = new FormData();
  if (Array.isArray(fileOrFiles)) {
    for (const f of fileOrFiles) {
      formData.append("qrCode", f);
    }
  } else if (fileOrFiles instanceof FileList) {
    for (let i = 0; i < fileOrFiles.length; i++) {
      formData.append("qrCode", fileOrFiles[i]);
    }
  } else if (fileOrFiles) {
    formData.append("qrCode", fileOrFiles);
  }
  if (title) formData.append("title", title);
  if (upiId) formData.append("upiId", upiId);
  const response = await api.post("/admin/settings/qr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data;
};

export const deleteQRCode = async (id = "") => {
  const endpoint = id ? `/admin/settings/qr/${id}` : "/admin/settings/qr";
  const response = await api.delete(endpoint);
  return response.data;
};

export const toggleQRCode = async (id, data) => {
  const response = await api.patch(`/admin/settings/qr/${id}`, data);
  return response.data;
};

export const addWhatsAppGroup = async (data) => {
  const response = await api.post("/admin/settings/whatsapp", data);
  return response.data;
};

export const updateWhatsAppGroup = async (id, data) => {
  const response = await api.patch(`/admin/settings/whatsapp/${id}`, data);
  return response.data;
};

export const deleteWhatsAppGroup = async (id) => {
  const response = await api.delete(`/admin/settings/whatsapp/${id}`);
  return response.data;
};

export default api;
