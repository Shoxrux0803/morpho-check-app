// src/services/AdminApi.js

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = process.env.REACT_APP_API_PREFIX || "/api";

// Token: localStorage ustuvor, bo'lmasa .env dagi
const getToken = () => {
  let local = localStorage.getItem("ADMIN_TOKEN");
  if (local && local !== "null" && local !== "undefined") return local;
  local = localStorage.getItem("token");
  if (local && local !== "null" && local !== "undefined") return local;
  return process.env.REACT_APP_ADMIN_TOKEN || "supersecret_admin_token";
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
          date_from: opts.dateFrom, // "YYYY-MM-DD"
          date_to: opts.dateTo, // "YYYY-MM-DD"
          sort_key: opts.sortKey, // masalan: "created_at" | "age" | "bmi"
          sort_dir: opts.sortDir, // "asc" | "desc"
          region: opts.region,
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 20,
        }),
      ),
    get: (id) => call(`/admin/analyses/${id}`),
    update: (id, data) => call(`/admin/analyses/${id}`, { method: "PUT", body: data }),
    remove: (id) => call(`/admin/analyses/${id}`, { method: "DELETE" }),
    // Backend: DELETE /api/admin/analyses  body: { ids: [...] }
    removeMany: (ids) => call(`/admin/analyses`, { method: "DELETE", body: { ids } }),
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
};
