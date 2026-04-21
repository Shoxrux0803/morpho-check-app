// src/services/api.js
// proxy (package.json "proxy": "http://localhost:8000") orqali CORS bartaraf etiladi.
// Development da API_BASE bo'sh - nisbiy URL lar proxy orqali o'tadi.
// Production da REACT_APP_API_URL ni to'liq URL ga o'rnating.
export const API_BASE = process.env.REACT_APP_API_URL || "";
export const API_PREFIX = process.env.REACT_APP_API_PREFIX || "/api";


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
export async function postAnalysis(payload, lang = "uz") {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/analyze/full?lang=${lang}`, {
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
export async function generatePdf(payload, lang = "uz") {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/report?lang=${lang}`, {
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
  return resp.blob(); // PDF blob
}

// Admin panel uchun: ID bo'yicha PDF olish
export async function generatePdfById(patientId, lang = "uz") {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/report-by-id/${patientId}?lang=${lang}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob();
}

// Admin panel uchun: ID bo'yicha DOCX olish
export async function generateDocxById(patientId, lang = "uz") {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/report-docx-by-id/${patientId}?lang=${lang}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob();
}


/* -------------------- DOCX -------------------- */
/**
 * /api/pdf/generate-docx endpointiga POST yuborib, DOCX blob qaytaradi.
 * Payload PDF bilan bir xil (PatientData + analysis).
 */
export async function generateDocx(payload, lang = "uz") {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/generate-docx?lang=${lang}`, {
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
  const resp = await fetch(`${API_BASE}${API_PREFIX}/auth/me`, {
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

    update: async (id, data) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      return resp.json();
    },

    removeMany: async (ids) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses`, {
        method: "DELETE",
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

    // Restore — soft deleted ni tiklash (faqat super admin)
    restore: async (ids) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses/restore`, {
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

    // Hard delete — DB dan butunlay o'chirish (faqat super admin)
    hardDelete: async (ids) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses/hard-delete`, {
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

    // O'chirilgan ma'lumotlar ro'yxati (faqat super admin)
    deletedList: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/deleted-analyses?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },

    // O'chirilgan ma'lumotlarni DOCX hisobot sifatida yuklab olish (faqat super admin)
    exportDeletedDocx: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/export-deleted-docx?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.blob();
    },

    exportXlsx: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/export-xlsx?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.blob();
    },

    exportDataset: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(`${API_BASE}${API_PREFIX}/research/export/dataset?${queryParams.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.blob();
    },
  },

  auditLogs: {
    list: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/audit-logs?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },
    clear: async (actionFilter = null) => {
      const url = actionFilter && actionFilter !== "ALL" 
        ? `${API_BASE}${API_PREFIX}/admin/audit-logs/clear?action=${actionFilter}`
        : `${API_BASE}${API_PREFIX}/admin/audit-logs/clear`;
        
      const resp = await fetch(url, {
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
      return resp.json();
    },
  },

  backup: {
    list: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/backup/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    create: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/backup/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    restore: async (filename, mode = "replace") => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/backup/restore/${filename}?mode=${mode}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    delete: async (filename) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/backup/${filename}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
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

    create: async (userData) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/users`, {
        method: "POST",
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

  stats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/stats?${queryParams.toString()}`, {
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


  clinical: {
    list: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/clinical/settings`, {
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
      return resp.json();
    },

    update: async (key, data) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/clinical/settings/${key}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },

    refreshCache: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/clinical/refresh-cache`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
  },
};


/* -------------------- RESEARCH API -------------------- */
export const ResearchApi = {
  /** Barcha aktiv yozuvlar (superadmin — hammani, researcher — o'zini) */
  list: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.append(k, v.toString());
    });
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** Bitta yozuv */
  get: async (id) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** Yangi yozuv yaratish */
  create: async (data) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** Yozuvni tahrirlash */
  update: async (id, data) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** Soft delete */
  softDelete: async (id) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** Hard delete — faqat superadmin */
  hardDelete: async (id) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}/hard`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** Restore — faqat superadmin */
  restore: async (id) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}/restore`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** O'chirilganlar ro'yxati — faqat superadmin */
  deletedList: async () => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/deleted/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.json();
  },

  /** DOCX yuklash */
  downloadDocx: (id, lang = "ru") => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    window.open(`${API_BASE}${API_PREFIX}/research/${id}/docx?accessToken=${token}&lang=${lang}`, "_blank");
  },

  /** XLSX export */
  exportXlsx: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.append(k, v.toString());
    });
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/export/xlsx?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.blob();
  },

  /** Dataset export for statistics */
  exportDataset: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.append(k, v.toString());
    });
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/export/dataset?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) { const msg = await parseError(resp); throw new Error(msg); }
    return resp.blob();
  },
};

// API service object - ESLint xatosini bartaraf qilish uchun
const apiService = {
  postAnalysis,
  generatePdf,
  generatePdfById,
  generateDocx,
  generateDocxById,
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
  ResearchApi,
};

export default apiService;
