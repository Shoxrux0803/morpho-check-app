// src/services/api.js
// proxy (package.json "proxy": "http://localhost:8000") orqali CORS bartaraf etiladi.
// Development da API_BASE bo'sh - nisbiy URL lar proxy orqali o'tadi.
// Production da REACT_APP_API_URL ni to'liq URL ga o'rnating.
export const API_BASE = process.env.REACT_APP_API_URL || '';
export const API_PREFIX = process.env.REACT_APP_API_PREFIX || '/api';
const MAX_API_PAGE_SIZE = 200;

function clampPageSize(queryParams) {
  ['page_size', 'pageSize'].forEach((key) => {
    const value = Number(queryParams.get(key));
    if (Number.isFinite(value) && value > MAX_API_PAGE_SIZE) {
      queryParams.set(key, String(MAX_API_PAGE_SIZE));
    }
  });
}

/* -------------------- Yordamchi: xatoni ajratib olish -------------------- */
async function parseError(resp) {
  try {
    const data = await resp.clone().json();

    // FastAPI 422 validation
    if (resp.status === 422 && Array.isArray(data?.detail)) {
      return data.detail.map((d) => d?.msg || JSON.stringify(d)).join('; ');
    }
    if (typeof data?.detail === 'string') return data.detail;
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

/* -------------------- PUBLIC CHAT STATUS -------------------- */
export async function getPublicChatStatus() {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/ai/chat/public-status?_t=${Date.now()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

/* -------------------- ANALYSIS -------------------- */
/**
 * Backend /api/analyze/full dan kelgan javobni { data: <backendBody> } ko'rinishida qaytaramiz,
 * shunda frontenddagi AnalysisResults `results.data.analysis` va `results.data.advices` bilan
 * muammosiz ishlaydi.
 */
export async function postAnalysis(payload, lang = 'uz') {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/analyze/full?lang=${lang}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(payload),
    }
  );

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
export async function generatePdf(payload, lang = 'uz') {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/pdf/report?lang=${lang}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
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
export async function generatePdfById(patientId, lang = 'uz') {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/pdf/report-by-id/${patientId}?lang=${lang}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }
  );

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob();
}

// Admin panel uchun: ID bo'yicha DOCX olish
export async function generateDocxById(patientId, lang = 'uz') {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/pdf/report-docx-by-id/${patientId}?lang=${lang}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }
  );

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob();
}

export async function generateConsentDocx(payload, lang = 'uz') {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/pdf/consent-docx?lang=${lang}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(payload),
    }
  );
  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob();
}

export async function generateConsentDocxById(patientId, lang = 'uz') {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/pdf/consent-docx-by-id/${patientId}?lang=${lang}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }
  );
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
export async function generateDocx(payload, lang = 'uz') {
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/pdf/generate-docx?lang=${lang}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }
  return resp.blob(); // DOCX blob
}

/* -------------------- AUTH & USER -------------------- */
function getLoginDeviceId() {
  const key = 'superadmin_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId =
      window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

export async function login(credentials) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...credentials,
      device_id: getLoginDeviceId(),
    }),
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const resp = await fetch(
    `${API_BASE}${API_PREFIX}/auth/me?_t=${Date.now()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!resp.ok) {
    const msg = await parseError(resp);
    throw new Error(msg);
  }

  const data = await resp.json();
  return data;
}

export async function updateUserProfile(profileData) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/user/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
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

export async function changePassword(currentPassword, newPassword) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
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
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    }
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
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
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
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
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
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
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
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
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
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      clampPageSize(queryParams);
      queryParams.set('_privacy_refresh', Date.now().toString());

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    get: async (id) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses/${id}?_privacy_refresh=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },

    remove: async (id) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
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

    update: async (id, data) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses/${id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      return resp.json();
    },

    removeMany: async (ids) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/analyses`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
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
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
        }
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    // Hard delete — DB dan butunlay o'chirish (faqat super admin)
    hardDelete: async (ids) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/analyses/hard-delete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
        }
      );

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
        if (
          key !== 'show_deleted' &&
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {
          queryParams.append(key, value.toString());
        }
      });
      clampPageSize(queryParams);
      if (!queryParams.has('page_size'))
        queryParams.set('page_size', String(MAX_API_PAGE_SIZE));

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/deleted-analyses?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
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
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/export-deleted-docx?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
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
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/export-xlsx?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
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
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/research/export/dataset?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.blob();
    },
  },

  securityEvents: {
    list: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/security-events?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    markRead: async () => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/security-events/mark-read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    blockIps: async (ips, reason = 'Blocked by Superadmin') => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/security-events/block-ips`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ips, reason }),
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    unblockIps: async (ips, reason = 'Unblocked by Superadmin') => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/security-events/unblock-ips`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ips, reason }),
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    markFalsePositive: async (eventId) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/security-events/${eventId}/false-positive`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
  },
  auditLogs: {
    list: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/audit-logs?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
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
      const url =
        actionFilter && actionFilter !== 'ALL'
          ? `${API_BASE}${API_PREFIX}/admin/audit-logs/clear?action=${actionFilter}`
          : `${API_BASE}${API_PREFIX}/admin/audit-logs/clear`;

      const resp = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
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
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    create: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/backup/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    restore: async (filename, mode = 'replace') => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/backup/restore/${filename}?mode=${mode}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    delete: async (filename) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/backup/${filename}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
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
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/users?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
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

    create: async (userData) => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
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
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
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
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }

      const data = await resp.json();
      return data;
    },

    deletedList: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/users/deleted`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },

    exportXlsx: async (params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/users/export-xlsx?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.blob();
    },

    restore: async (id) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/users/${id}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
  },
  activity: {
    updateLocation: async (payload) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/activity/location`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
  },
  roleSettings: {
    list: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/admin/role-settings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
    update: async (role_name, data) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/admin/role-settings/${role_name}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },
  },
  privacySettings: {
    list: async () => {
      const resp = await fetch(
        API_BASE + API_PREFIX + '/admin/privacy-settings',
        {
          headers: {
            Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
            'Content-Type': 'application/json',
          },
        }
      );
      if (!resp.ok) throw new Error(await parseError(resp));
      return resp.json();
    },
    update: async (roleName, enabled) => {
      const resp = await fetch(
        API_BASE + API_PREFIX + '/admin/privacy-settings/' + roleName,
        {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + (localStorage.getItem('token') || ''),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            child_data_privacy_enabled: enabled,
          }),
        }
      );
      if (!resp.ok) throw new Error(await parseError(resp));
      const data = await resp.json();
      localStorage.setItem('child_privacy_version', Date.now().toString());
      window.dispatchEvent(
        new CustomEvent('child-privacy-updated', {
          detail: { roleName, enabled },
        })
      );
      return data;
    },
  },

  stats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/admin/stats?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
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

  clinical: {
    list: async () => {
      const resp = await fetch(`${API_BASE}${API_PREFIX}/clinical/settings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },

    update: async (key, data) => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/clinical/settings/${key}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      if (!resp.ok) {
        const msg = await parseError(resp);
        throw new Error(msg);
      }
      return resp.json();
    },

    refreshCache: async () => {
      const resp = await fetch(
        `${API_BASE}${API_PREFIX}/clinical/refresh-cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );
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
      if (v !== undefined && v !== null && v !== '') q.append(k, v.toString());
    });
    clampPageSize(q);
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/?${q.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** Bitta yozuv */
  get: async (id) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** Yangi yozuv yaratish */
  create: async (data) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** Yozuvni tahrirlash */
  update: async (id, data) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** Soft delete */
  softDelete: async (id) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** Hard delete — faqat superadmin */
  bulkSoftDelete: async (ids) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/bulk/soft-delete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  hardDelete: async (id) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/${id}/hard`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** Restore — faqat superadmin */
  bulkHardDelete: async (ids) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/bulk/hard-delete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  restore: async (id) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/${id}/restore`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** O'chirilganlar ro'yxati — faqat superadmin */
  bulkRestore: async (ids) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(`${API_BASE}${API_PREFIX}/research/bulk/restore`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  deletedList: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v.toString());
    });
    clampPageSize(q);
    if (!q.has('page_size')) q.set('page_size', String(MAX_API_PAGE_SIZE));
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/deleted/list?${q.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** DOCX yuklash */
  downloadDocx: (id, lang = 'ru') => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    window.open(
      `${API_BASE}${API_PREFIX}/research/${id}/docx?accessToken=${token}&lang=${lang}`,
      '_blank'
    );
  },

  /** Privacy consent DOCX */
  downloadConsentDocx: (id, lang = 'uz') => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    window.open(
      `${API_BASE}${API_PREFIX}/research/${id}/consent-docx?accessToken=${token}&lang=${lang}`,
      '_blank'
    );
  },

  /** XLSX export */
  exportXlsx: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v.toString());
    });
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    q.set('_privacy_refresh', Date.now().toString());
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/export/xlsx?${q.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.blob();
  },

  /** XLSX import */
  importXlsx: async (file, params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v.toString());
    });
    q.set('_privacy_refresh', Date.now().toString());
    const formData = new FormData();
    formData.append('file', file);
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/import/xlsx?${q.toString()}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        body: formData,
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.json();
  },

  /** XLSX import template */
  downloadImportTemplate: async () => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const q = new URLSearchParams({
      _privacy_refresh: Date.now().toString(),
    });
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/import/template?${q.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.blob();
  },

  /** Dataset export for statistics */
  exportDataset: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v.toString());
    });
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/export/dataset?${q.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
    return resp.blob();
  },

  /** Scientific summary DOCX export */
  exportSummaryDocx: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v.toString());
    });
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';
    const resp = await fetch(
      `${API_BASE}${API_PREFIX}/research/export/summary-docx?${q.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!resp.ok) {
      const msg = await parseError(resp);
      throw new Error(msg);
    }
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
  generateConsentDocx,
  generateConsentDocxById,
  login,
  register,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  getRegionalStats,
  uploadImage,
  AdminApi,
  ResearchApi,
};

export default apiService;
