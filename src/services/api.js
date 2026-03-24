// src/services/api.js

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = process.env.REACT_APP_API_PREFIX || "/api";

/* -------------------- Yordamchi: xatoni ajratib olish -------------------- */
async function parseError(resp) {
  try {
    const data = await resp.clone().json();

    // FastAPI 422 validation
    if (resp.status === 422 && Array.isArray(data?.detail)) {
      return data.detail.map((d) => d?.msg || JSON.stringify(d)).join("; ");
    }
    if (typeof data?.detail === "string") return data.detail;
    if (data?.message) return data.message;
    return JSON.stringify(data);
  } catch {
    // JSON bo'lmasa (masalan, 500 text/plain)
    try {
      return await resp.text();
    } catch {
      return `HTTP ${resp.status}`;
    }
  }
}

/* -------------------- ANALYSIS -------------------- */
/**
 * Backend /api/analyze/full dan kelgan javobni { data: <backendBody> } ko'rinishida qaytaramiz,
 * shunda frontenddagi AnalysisResults `results.data.analysis` va `results.data.advices` bilan
 * muammosiz ishlaydi.
 */
export async function postAnalysis(payload) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/analyze/full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const body = await resp.json(); // backendning haqiqiy javobi
  return { data: body }; // <-- .data qobig'iga solib qaytaramiz
}

/* -------------------- PDF -------------------- */
/**
 * Asl router bizda /api/pdf/... ostida. Eski kod /analyze/pdf-report bo'lishi mumkin.
 * Fallback qo'ydik: avval /api/pdf/report, 404 bo'lsa /api/analyze/pdf-report.
 */
export async function generatePdf(payload) {
  // 1) Yangi yo'l: /api/pdf/report
  let resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify(payload),
  });

  // 2) Agar topilmasa (404), eski yo'lga urinib ko'ramiz
  if (resp.status === 404) {
    resp = await fetch(`${API_BASE}${API_PREFIX}/analyze/pdf-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(payload),
    });
  }

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob(); // PDF blob
}

/* -------------------- DOCX -------------------- */
/**
 * /api/pdf/generate-docx endpointiga POST yuborib, DOCX blob qaytaradi.
 * Payload PDF bilan bir xil (PatientData + analysis).
 */
export async function generateDocx(payload) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/generate-docx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob(); // DOCX blob
}

/* -------------------- RATING -------------------- */
function buildRatingPayload(ratingData = {}) {
  // score/rating -> number | undefined
  const score =
    ratingData.score != null
      ? Number(ratingData.score)
      : ratingData.rating != null
        ? Number(ratingData.rating)
        : undefined;

  // comment/feedback -> string | undefined
  const comment = (ratingData.comment ?? ratingData.feedback ?? "").toString().trim() || undefined;

  // user_id -> number | undefined (raqam bo'lmasa yubormaymiz)
  let user_id = ratingData.user_id;
  if (user_id !== undefined && user_id !== null && user_id !== "") {
    const n = Number(user_id);
    user_id = Number.isFinite(n) ? n : undefined;
  } else {
    user_id = undefined;
  }

  const name = (ratingData.name ?? "").toString().trim() || undefined;
  const email = (ratingData.email ?? "").toString().trim() || undefined;

  return { score, comment, user_id, name, email };
}

async function _postRating(payload) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/rating/submit-rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  // Backenddan { status, message, data } kelsa, FeedbackForm ichida res.message ishlatiladi
  return resp.json();
}

export async function sendRating(ratingData) {
  const payload = buildRatingPayload(ratingData);
  return _postRating(payload);
}

// Alias - boshqa joylarda submitRating deb chaqirsangiz ham ishlaydi
export const submitRating = sendRating;

/* -------------------- AUTH & USER -------------------- */
export async function login(credentials) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

export async function register(userData) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

export async function getUserProfile() {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/user/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

export async function updateUserProfile(profileData) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/user/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

/* -------------------- ANALYSIS HISTORY -------------------- */
export async function getAnalysisHistory(page = 1, limit = 10) {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/analysis/history?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

export async function getAnalysisById(id) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/analysis/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

export async function deleteAnalysis(id) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/analysis/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

/* -------------------- REGIONAL STATISTICS -------------------- */
export async function getRegionalStats() {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/regional-stats`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

/* -------------------- IMAGE UPLOAD -------------------- */
export async function uploadImage(formData) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/upload/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: formData,
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

/* -------------------- ADMIN API -------------------- */
export const AdminApi = {
  analyses: {
    list: async (params = {}) => {
      const queryParams = new URLSearchParams();

      // Parametrlarni qo'shish
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    remove: async (id) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    removeMany: async (ids) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses/batch-delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },
  },

  users: {
    list: async (params = {}) => {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/users?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    update: async (id, userData) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/users/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    delete: async (id) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },
  },
};

// API service object - ESLint xatosini bartaraf qilish uchun
const apiService = {
  postAnalysis,
  generatePdf,
  generateDocx,
  sendRating,
  submitRating,
  login,
  register,
  getUserProfile,
  updateUserProfile,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  getRegionalStats,
  uploadImage,
  AdminApi,
};

export default apiService;
