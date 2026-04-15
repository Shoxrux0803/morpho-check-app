// src/services/AdminApi.js
// proxy (package.json "proxy": "http://localhost:8000") orqali CORS bartaraf etiladi.
const API_BASE = process.env.REACT_APP_API_URL || "";
const API_PREFIX = process.env.REACT_APP_API_PREFIX || "/api";


// Token: localStorage ustuvor, bo'lmasa .env dagi
const getToken = () => {
  let local = localStorage.getItem("ADMIN_TOKEN");
  if (local && local !== "null" && local !== "undefined") return local;
  local = localStorage.getItem("token");
  if (local && local !== "null" && local !== "undefined") return local;
  return null;
};

// Query builder: bo'sh qiymatlarni yubormaydi
const withQuery = (path, params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const q = qs.toString();
  return `${path}${q ? `?${q}` : ""}`;
};

// Bitta umumiy caller
async function call(path, { method = "GET", headers = {}, body, raw = false } = {}) {
  const resp = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...headers,
    },
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

  const text = await resp.text();
  if (!resp.ok) {
    let msg = text || `HTTP ${resp.status}`;
    try {
      const j = JSON.parse(text);
      msg = j.detail || j.message || text || msg;
    } catch {}
    const err = new Error(msg);
    err.status = resp.status;
    throw err;
  }
  return raw ? text : text ? JSON.parse(text) : null;
}

export const AdminApi = {
  // Token boshqaruvi
  token: {
    get: getToken,
    set: (t) => {
      localStorage.setItem("ADMIN_TOKEN", t);
      return true;
    },
    clear: () => localStorage.removeItem("ADMIN_TOKEN"),
  },

  // USERS
  users: {
    list: (opts = {}) =>
      call(
        withQuery("/admin/users", {
          q: opts.q,
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 20,
        }),
      ),
    create: (data) => call("/admin/users", { method: "POST", body: data }),
    get: (id) => call(`/admin/users/${id}`),
    update: (id, data) => call(`/admin/users/${id}`, { method: "PUT", body: data }),
    remove: (id) => call(`/admin/users/${id}`, { method: "DELETE" }),
  },

  // ANALYSES
  analyses: {
    list: (opts = {}) =>
      call(
        withQuery("/admin/analyses", {
          q: opts.q,
          gender: opts.gender,
          age_min: opts.ageMin,
          age_max: opts.ageMax,
          date_from: opts.dateFrom,
          date_to: opts.dateTo,
          sort_key: opts.sortKey,
          sort_dir: opts.sortDir,
          region: opts.region,
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 20,
        }),
      ),
    get: (id) => call(`/admin/analyses/${id}`),
    update: (id, data) => call(`/admin/analyses/${id}`, { method: "PUT", body: data }),
    remove: (id) => call(`/admin/analyses/${id}`, { method: "DELETE" }),
    // Soft delete (bir nechta)
    removeMany: (ids) => call(`/admin/analyses`, { method: "DELETE", body: { ids } }),
    // Hard delete — faqat super admin (DB dan butunlay o'chiradi)
    hardDelete: (ids) => call(`/admin/analyses/hard-delete`, { method: "POST", body: { ids } }),
    // Restore — soft deleted ni tiklash (faqat super admin)
    restore: (ids) => call(`/admin/analyses/restore`, { method: "POST", body: { ids } }),
    exportXlsx: (params) => {
      const q = withQuery("/admin/export-xlsx", params);
      return fetch(`${API_BASE}${API_PREFIX}${q}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }).then((r) => {
        if (!r.ok) throw new Error("Eksport qilishda xatolik");
        return r.blob();
      });
    },
    exportTemplate: () => {
      return fetch(`${API_BASE}${API_PREFIX}/admin/export-template`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }).then((r) => {
        if (!r.ok) throw new Error("Shablonni yuklashda xatolik");
        return r.blob();
      });
    },
    importXlsx: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch(`${API_BASE}${API_PREFIX}/admin/import-xlsx`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          // Content-Type should NOT be set manually for FormData
        },
        body: formData,
      }).then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          try {
            const j = JSON.parse(text);
            throw new Error(j.detail || "Importda xatolik");
          } catch {
            throw new Error(text || "Importda xatolik");
          }
        }
        return JSON.parse(text);
      });
    },
  },

  // PAYMENTS
  payments: {
    list: (opts = {}) =>
      call(
        withQuery("/admin/payments", {
          user_id: opts.userId,
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 20,
        }),
      ),
    create: (data) => call("/admin/payments", { method: "POST", body: data }),
  },

  // STATS
  stats: () => call(`/admin/stats`),

  // AUDIT LOGS
  audit: {
    list: (opts = {}) =>
      call(
        withQuery("/admin/audit-logs", {
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 50,
          action: opts.action,
          user_id: opts.userId,
        }),
      ),
  },
  
  // ADMIN ACTIVITY
  activity: {
    list: () => call("/admin/activity"),
    pingFormStart: () => call("/admin/activity/ping-form-start", { method: "POST" }),
  }
};
