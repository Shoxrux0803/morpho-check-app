// src/pages/AnalyticsDashboard.js
// ============================================================
// MorphoCheck Analytics Dashboard — 3-bosqich
// TimescaleDB + ClickHouse ma'lumotlari asosida real-time dashboard
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// ─── Ranglar ─────────────────────────────────────────────────────────────────
const PALETTE = {
  primary: "#0f766e",
  secondary: "#14b8a6",
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  pink: "#ec4899",
  glass: "rgba(255,255,255,0.07)",
  glassBorder: "rgba(255,255,255,0.15)",
};

const BMI_COLORS = {
  ozgin: "#3b82f6",
  normal: "#10b981",
  ortiqcha: "#f59e0b",
  semizlik: "#ef4444",
  nomalum: "#6b7280",
};

// ─── API helper ──────────────────────────────────────────────────────────────
const fetchAnalytics = async (endpoint, token) => {
  const res = await fetch(`${API}/analytics/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ─── Statcard ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, trend }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -4 }}
    style={{
      background: PALETTE.glass,
      border: `1px solid ${PALETTE.glassBorder}`,
      borderRadius: 16,
      padding: "24px 20px",
      backdropFilter: "blur(12px)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }}
    />
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <span style={{ color: "#94a3b8", fontSize: 13 }}>{label}</span>
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>
      {value ?? "—"}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
        {trend !== undefined && (
          <span
            style={{
              color: trend >= 0 ? "#10b981" : "#ef4444",
              marginRight: 6,
              fontWeight: 600,
            }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
        {sub}
      </div>
    )}
  </motion.div>
);

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const MiniBarChart = ({ data, colorKey = "count", height = 120 }) => {
  if (!data || data.length === 0) return <EmptyState />;
  const max = Math.max(...data.map((d) => d[colorKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((d, i) => {
        const pct = ((d[colorKey] || 0) / max) * 100;
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            title={`${d.date || d.group || d.region || ""}: ${d[colorKey]}`}
            style={{
              flex: 1,
              minWidth: 6,
              background: `linear-gradient(180deg, ${PALETTE.secondary}, ${PALETTE.primary})`,
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              opacity: 0.85,
              transition: "opacity 0.2s",
            }}
            whileHover={{ opacity: 1, scaleX: 1.1 }}
          />
        );
      })}
    </div>
  );
};

// ─── Donut Chart (SVG) ─────────────────────────────────────────────────────
const DonutChart = ({ data, colors, size = 160 }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return <EmptyState />;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const strokeW = size * 0.18;

  let cumPct = 0;
  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, val]) => {
      const pct = val / total;
      const start = cumPct;
      cumPct += pct;
      return { key, val, pct, start };
    });

  const toXY = (pct) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeW} />
      {segments.map(({ key, pct, start }, i) => {
        const s = toXY(start);
        const e = toXY(start + pct);
        const largeArc = pct > 0.5 ? 1 : 0;
        const color = colors?.[key] || PALETTE.secondary;
        return (
          <motion.path
            key={key}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            d={`M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`}
            fill={color}
            opacity={0.85}
          >
            <title>{key}: {Math.round(pct * 100)}%</title>
          </motion.path>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="#0f172a" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#f1f5f9"
        fontSize={size * 0.12}
        fontWeight="700"
      >
        {total}
      </text>
    </svg>
  );
};

// ─── Region Table ─────────────────────────────────────────────────────────────
const RegionTable = ({ regions }) => {
  if (!regions || regions.length === 0) return <EmptyState />;
  const max = Math.max(...regions.map((r) => r.count), 1);
  return (
    <div style={{ overflow: "auto", maxHeight: 280 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1e293b" }}>
            {["Viloyat", "Soni", "O'rt. BMI", "O'rt. Z-score"].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {regions.slice(0, 20).map((r, i) => (
            <motion.tr
              key={r.region}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{ borderBottom: "1px solid #0f172a" }}
            >
              <td style={{ padding: "8px 12px", color: "#e2e8f0" }}>{r.region}</td>
              <td style={{ padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      height: 6,
                      width: `${(r.count / max) * 80}px`,
                      background: `linear-gradient(90deg, ${PALETTE.secondary}, ${PALETTE.primary})`,
                      borderRadius: 3,
                      minWidth: 4,
                    }}
                  />
                  <span style={{ color: "#cbd5e1" }}>{r.count}</span>
                </div>
              </td>
              <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{r.avg_bmi?.toFixed(1)}</td>
              <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{r.avg_z_score?.toFixed(2)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
    <div>Ma'lumot yo'q</div>
  </div>
);

// ─── Loading spinner ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{
        width: 40, height: 40,
        border: "3px solid #1e293b",
        borderTop: `3px solid ${PALETTE.secondary}`,
        borderRadius: "50%",
      }}
    />
  </div>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ title, icon, children, style }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: PALETTE.glass,
      border: `1px solid ${PALETTE.glassBorder}`,
      borderRadius: 16,
      padding: 24,
      backdropFilter: "blur(12px)",
      ...style,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{title}</h3>
    </div>
    {children}
  </motion.div>
);

// ─── ASOSIY DASHBOARD ─────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [bmiDist, setBmiDist] = useState(null);
  const [trend, setTrend] = useState([]);
  const [regions, setRegions] = useState([]);
  const [somatotypes, setSomatotypes] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [period, setPeriod] = useState("month");
  const [error, setError] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && !["admin", "superadmin"].includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, bmi, tr, reg, soma, age, sys] = await Promise.all([
        fetchAnalytics("overview", token),
        fetchAnalytics("bmi-distribution", token),
        fetchAnalytics(`trend?period=${period}`, token),
        fetchAnalytics("regions", token),
        fetchAnalytics("somatotypes", token),
        fetchAnalytics("age-groups", token),
        fetchAnalytics("system-info", token),
      ]);
      setOverview(ov);
      setBmiDist(bmi);
      setTrend(tr.data || []);
      setRegions(reg);
      setSomatotypes(soma);
      setAgeGroups(age);
      setSystemInfo(sys);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Somatotip taqsimoti dict ga aylantirish
  const somatoDict = {};
  somatotypes.forEach(({ somatotype, count }) => {
    somatoDict[somatotype] = (somatoDict[somatotype] || 0) + count;
  });

  const somatoColors = {
    Normosomik: "#10b981",
    Mikrosomik: "#3b82f6",
    Makrosomik: "#ef4444",
    Mezosomik: "#f59e0b",
    Gipersomik: "#8b5cf6",
    Giposomik: "#6b7280",
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #0d1424 100%)",
        padding: "32px 24px",
        fontFamily: "'Inter', 'Outfit', sans-serif",
        color: "#f1f5f9",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, background: `linear-gradient(90deg, ${PALETTE.secondary}, ${PALETTE.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
              📊 Analytics Dashboard
            </h1>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
              TimescaleDB + ClickHouse · Real-time ma'lumotlar
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* System badges */}
            {systemInfo && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: systemInfo.timescaledb?.available ? "#10b98122" : "#ef444422", color: systemInfo.timescaledb?.available ? "#10b981" : "#ef4444", border: `1px solid ${systemInfo.timescaledb?.available ? "#10b981" : "#ef4444"}44` }}>
                  🕒 TimescaleDB {systemInfo.timescaledb?.available ? "✓" : "✗"}
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: systemInfo.clickhouse?.available ? "#10b98122" : "#f59e0b22", color: systemInfo.clickhouse?.available ? "#10b981" : "#f59e0b", border: `1px solid ${systemInfo.clickhouse?.available ? "#10b981" : "#f59e0b"}44` }}>
                  ⚡ ClickHouse {systemInfo.clickhouse?.available ? "✓" : "—"}
                </div>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAll}
              disabled={loading}
              style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${PALETTE.glassBorder}`, background: PALETTE.glass, color: "#e2e8f0", cursor: "pointer", fontSize: 13, backdropFilter: "blur(8px)" }}
            >
              {loading ? "⏳" : "🔄"} Yangilash
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 12, padding: "12px 20px", marginBottom: 24, color: "#fca5a5" }}
          >
            ❌ Xatolik: {error} — Backend ishlab turganini tekshiring.
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <Spinner /> : (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard icon="🏥" label="Jami tahlillar" value={overview?.total_analyses?.toLocaleString()} sub="Jami bazada" color={PALETTE.secondary} />
            <StatCard icon="📅" label="Bu oy" value={overview?.this_month} sub="o'tgan oy bilan" trend={overview?.growth_percent} color={PALETTE.accent} />
            <StatCard icon="📐" label="O'rtacha BMI" value={overview?.averages?.bmi} sub="kg/m²" color={PALETTE.blue} />
            <StatCard icon="📏" label="O'rtacha bo'y" value={overview?.averages?.height && `${overview.averages.height} sm`} sub="" color={PALETTE.purple} />
            <StatCard icon="⚖️" label="O'rtacha vazn" value={overview?.averages?.weight && `${overview.averages.weight} kg`} sub="" color={PALETTE.pink} />
            {overview?.total_users > 0 && (
              <StatCard icon="👥" label="Foydalanuvchilar" value={overview?.total_users} sub={`${overview?.active_users_30d} faol (30 kun)`} color="#f97316" />
            )}
          </div>

          {/* Charts row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Trend */}
            <Card title="Tendensiya" icon="📈">
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["week", "month", "year"].map((p) => (
                  <button key={p}
                    onClick={() => setPeriod(p)}
                    style={{ padding: "4px 12px", borderRadius: 8, border: `1px solid ${period === p ? PALETTE.secondary : PALETTE.glassBorder}`, background: period === p ? `${PALETTE.secondary}22` : "transparent", color: period === p ? PALETTE.secondary : "#94a3b8", cursor: "pointer", fontSize: 12 }}
                  >
                    {p === "week" ? "Hafta" : p === "month" ? "Oy" : "Yil"}
                  </button>
                ))}
              </div>
              <MiniBarChart data={trend} colorKey="count" height={140} />
              {trend.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#475569" }}>
                  <span>{trend[0]?.date}</span>
                  <span>{trend[trend.length - 1]?.date}</span>
                </div>
              )}
            </Card>

            {/* Jins taqsimoti */}
            <Card title="Jins taqsimoti" icon="⚧">
              {overview?.gender_distribution ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <DonutChart
                    data={overview.gender_distribution}
                    colors={{ erkak: "#3b82f6", ayol: "#ec4899", nomalum: "#6b7280" }}
                    size={140}
                  />
                  <div style={{ width: "100%" }}>
                    {Object.entries(overview.gender_distribution).map(([g, c]) => (
                      <div key={g} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                        <span style={{ color: "#94a3b8" }}>{g === "erkak" ? "👦 Erkak" : g === "ayol" ? "👧 Ayol" : "❔ Noma'lum"}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <EmptyState />}
            </Card>
          </div>

          {/* Charts row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* BMI taqsimoti */}
            <Card title="BMI Taqsimoti" icon="📊">
              {bmiDist?.counts ? (
                <>
                  <DonutChart data={bmiDist.counts} colors={BMI_COLORS} size={140} />
                  <div style={{ marginTop: 16 }}>
                    {Object.entries(bmiDist.counts).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: BMI_COLORS[k], display: "inline-block" }} />
                          <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{k}</span>
                        </span>
                        <span style={{ color: "#e2e8f0" }}>{v} <span style={{ color: "#475569" }}>({bmiDist.percentages?.[k]}%)</span></span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState />}
            </Card>

            {/* Yosh guruhlari */}
            <Card title="Yosh Guruhlari" icon="🎂">
              {ageGroups.length > 0 ? (
                <>
                  <MiniBarChart data={ageGroups} colorKey="count" height={100} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                    {ageGroups.map((g) => (
                      <div key={g.group} style={{ textAlign: "center", fontSize: 10 }}>
                        <div style={{ color: "#64748b" }}>{g.group}</div>
                        <div style={{ color: "#94a3b8", fontWeight: 600 }}>{g.count}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState />}
            </Card>

            {/* Somatotip taqsimoti */}
            <Card title="Somatotip" icon="🧬">
              {Object.keys(somatoDict).length > 0 ? (
                <>
                  <DonutChart data={somatoDict} colors={somatoColors} size={130} />
                  <div style={{ marginTop: 12 }}>
                    {Object.entries(somatoDict)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: somatoColors[k] || "#6b7280", display: "inline-block" }} />
                            <span style={{ color: "#94a3b8" }}>{k}</span>
                          </span>
                          <span style={{ color: "#e2e8f0" }}>{v}</span>
                        </div>
                      ))}
                  </div>
                </>
              ) : <EmptyState />}
            </Card>
          </div>

          {/* Viloyatlar jadvali */}
          <Card title="Viloyatlar bo'yicha statistika" icon="🗺️">
            <RegionTable regions={regions} />
          </Card>

          {/* Footer info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ textAlign: "center", marginTop: 32, color: "#334155", fontSize: 12 }}
          >
            MorphoCheck Analytics · TimescaleDB + ClickHouse · {new Date().toLocaleDateString("uz-UZ")}
          </motion.div>
        </>
      )}
    </div>
  );
}
