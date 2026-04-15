// src/components/Dashboard/AdminDashboard.js
// Oddiy Admin uchun pro darajadagi dashboard — faqat o'z ma'lumotlari
import React, { useMemo } from "react";
import {
  Box, Grid, Paper, Typography, CircularProgress, Stack,
  LinearProgress, Chip, useTheme, Divider
} from "@mui/material";
import {
  PersonAdd, TrendingUp, MonitorWeightOutlined,
  WcOutlined, DateRangeOutlined, BarChartOutlined
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#0ea5e9",
  secondary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  teal: "#14b8a6",
  rose: "#f43f5e",
};

const PIE_COLORS = ["#3b82f6", "#f43f5e", "#14b8a6"];

const GlassCard = ({ children, sx = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: isDark ? "rgba(30,30,50,0.7)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)",
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(14,165,233,0.12)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 32px rgba(14,165,233,0.12)" },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const KpiCard = ({ label, value, sub, icon, color, loading }) => (
  <GlassCard
    sx={{ borderLeft: `4px solid ${color}`, background: `linear-gradient(135deg, ${color}18 0%, ${color}05 100%)` }}
  >
    {loading ? (
      <CircularProgress size={24} sx={{ color }} />
    ) : (
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: "0.68rem" }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1.1 }}>
            {value ?? "—"}
          </Typography>
          {sub && <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{sub}</Typography>}
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, background: `${color}22`, color, display: "flex" }}>
          {icon}
        </Box>
      </Box>
    )}
  </GlassCard>
);

const SectionTitle = ({ title, subtitle }) => (
  <Box mb={2}>
    <Typography variant="h6" fontWeight={800} sx={{ background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {title}
    </Typography>
    {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
  </Box>
);

const CustomTooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "none",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    background: "rgba(15,15,25,0.92)",
    color: "#fff",
    fontSize: 12,
  },
  labelStyle: { color: "#7dd3fc", fontWeight: 700 },
};

export default function AdminDashboard({ data = [], loading, stats, statsLoading, totalCount = 0, userName }) {
  // Derive statistics from loaded data (admin's own data)
  const localStats = useMemo(() => {
    if (!data.length) return { avgBmi: 0, maleCount: 0, femaleCount: 0, unknownCount: 0, avgAge: 0, bmiCategories: [] };

    const maleCount = data.filter(r => (r.gender || "").toLowerCase() === "erkak" || (r.gender || "").toLowerCase() === "male" || (r.gender || "") === "m").length;
    const femaleCount = data.filter(r => (r.gender || "").toLowerCase() === "ayol" || (r.gender || "").toLowerCase() === "female" || (r.gender || "") === "f").length;
    const unknownCount = data.length - maleCount - femaleCount;

    const bmiValues = data.filter(r => r.bmi && !isNaN(r.bmi)).map(r => parseFloat(r.bmi));
    const avgBmi = bmiValues.length ? (bmiValues.reduce((s, v) => s + v, 0) / bmiValues.length).toFixed(1) : 0;

    const ageValues = data.filter(r => r.age && !isNaN(r.age)).map(r => Number(r.age));
    const avgAge = ageValues.length ? Math.round(ageValues.reduce((s, v) => s + v, 0) / ageValues.length) : 0;

    const normal = bmiValues.filter(v => v >= 18.5 && v < 25).length;
    const underweight = bmiValues.filter(v => v < 18.5).length;
    const overweight = bmiValues.filter(v => v >= 25 && v < 30).length;
    const obese = bmiValues.filter(v => v >= 30).length;
    const bmiTotal = bmiValues.length || 1;

    return {
      avgBmi,
      maleCount,
      femaleCount,
      unknownCount,
      avgAge,
      bmiCategories: [
        { name: "Normal", pct: Math.round(normal / bmiTotal * 100), count: normal, color: COLORS.success },
        { name: "Ortiqcha", pct: Math.round(overweight / bmiTotal * 100), count: overweight, color: COLORS.warning },
        { name: "Semizlik", pct: Math.round(obese / bmiTotal * 100), count: obese, color: COLORS.error },
        { name: "Ozg'in", pct: Math.round(underweight / bmiTotal * 100), count: underweight, color: COLORS.info },
      ],
    };
  }, [data]);

  const genderData = useMemo(() => [
    { name: "Erkak", value: localStats.maleCount },
    { name: "Ayol", value: localStats.femaleCount },
    { name: "Noma'lum", value: localStats.unknownCount },
  ].filter(d => d.value > 0), [localStats]);

  const ageGroupData = useMemo(() => {
    const groups = { "0-10": 0, "11-20": 0, "21-35": 0, "36-50": 0, "51-65": 0, "65+": 0 };
    data.forEach(r => {
      const age = Number(r.age);
      if (age <= 10) groups["0-10"]++;
      else if (age <= 20) groups["11-20"]++;
      else if (age <= 35) groups["21-35"]++;
      else if (age <= 50) groups["36-50"]++;
      else if (age <= 65) groups["51-65"]++;
      else groups["65+"]++;
    });
    return Object.entries(groups).map(([name, val]) => ({ name, value: val }));
  }, [data]);

  // Build daily trend from createdAt
  const dailyTrend = useMemo(() => {
    const byDate = {};
    data.forEach(r => {
      if (r.createdAt) {
        const d = r.createdAt.split("T")[0];
        byDate[d] = (byDate[d] || 0) + 1;
      }
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date: date.slice(5), count })); // MM-DD format
  }, [data]);

  const todayKey = new Date().toISOString().split("T")[0];
  const todayCount = data.filter(r => r.createdAt && r.createdAt.startsWith(todayKey)).length;

  return (
    <Box>
      {/* Welcome */}
      <Box mb={3} p={3} sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${COLORS.primary}22, ${COLORS.secondary}11)`, border: `1px solid ${COLORS.primary}33` }}>
        <Typography variant="h5" fontWeight={900} sx={{ color: COLORS.primary }}>
          👋 Xush kelibsiz, {userName || "Admin"}!
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Sizning shaxsiy analitika panelingiz — faqat siz kiritgan ma'lumotlar ko'rsatilmoqda.
        </Typography>
      </Box>

      {/* ===== KPI CARDS ===== */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Jami kiritganlarim"
            value={stats ? (stats.total_analyses?.toLocaleString("uz-UZ") ?? "0") : (totalCount.toLocaleString("uz-UZ"))}
            sub="Barcha vaqt davomida"
            icon={<PersonAdd />}
            color={COLORS.primary}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Bugun kiritilganlar"
            value={stats ? (stats.today_analyses ?? 0) : todayCount}
            sub="Bugungi seans"
            icon={<DateRangeOutlined />}
            color={COLORS.success}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="O'rtacha BMI"
            value={stats ? (stats.avg_bmi ? parseFloat(stats.avg_bmi).toFixed(1) : "—") : localStats.avgBmi}
            sub="Ro'yxatingizdagi bemorlar"
            icon={<MonitorWeightOutlined />}
            color={COLORS.warning}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="O'rtacha yosh"
            value={stats ? (stats.monthly_growth ? `+${stats.monthly_growth}` : "0") : (localStats.avgAge ? `${localStats.avgAge} yosh` : "—")}
            sub="Tanlangan sahifadagi ma'lumot"
            icon={<WcOutlined />}
            color={COLORS.secondary}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ===== CHARTS SECTION ===== */}
      <Grid container spacing={3}>
        {/* ROW 1: Wide Chart (Daily trend) */}
        <Grid size={{ xs: 12 }}>
          <GlassCard>
            <SectionTitle title="📊 Kunlik dinamika" subtitle="So'nggi 14 kunlik kiritilgan analizlar" />
            {dailyTrend.length === 0 ? (
              <Box py={6} textAlign="center"><Typography color="text.secondary">Hali ma'lumot yo'q</Typography></Box>
            ) : (
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                    <ReTooltip {...CustomTooltipStyle} />
                    <Area type="monotone" dataKey="count" name="Kiritilganlar" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#adminGrad)" dot={{ r: 3, fill: COLORS.primary }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* ROW 2: Triple Distribution Charts (Gender, Age, BMI) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="⚥ Jins taqsimoti" subtitle="Erkak/ayol nisbati" />
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />)}
                  </Pie>
                  <ReTooltip {...CustomTooltipStyle} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              {genderData.map((g, i) => {
                const total = genderData.reduce((s, d) => s + d.value, 0) || 1;
                const pct = Math.round(g.value / total * 100);
                return (
                  <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PIE_COLORS[i] }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{g.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={800}>{g.value} ({pct}%)</Typography>
                  </Box>
                );
              })}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="👤 Yosh guruhlari" subtitle="Bemorlar yoshi bo'yicha" />
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar dataKey="value" name="Bemorlar" fill={COLORS.secondary} radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="⚖️ BMI holati" subtitle="Sog'liq guruhlari bo'yicha" />
            <Stack spacing={2.5} mt={1}>
              {localStats.bmiCategories.map((cat) => (
                <Box key={cat.name}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={700} fontSize="0.85rem">{cat.name}</Typography>
                    <Box display="flex" gap={1} alignItems="baseline">
                      <Typography variant="caption" color="text.secondary">{cat.count} ta</Typography>
                      <Typography variant="body2" fontWeight={900} sx={{ color: cat.color }}>{cat.pct}%</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cat.pct}
                    sx={{
                      height: 10, borderRadius: 5,
                      bgcolor: `${cat.color}15`,
                      "& .MuiLinearProgress-bar": { bgcolor: cat.color, borderRadius: 5 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          📋 Faqat siz kiritgan ma'lumotlar ko'rsatilmoqda • MorphoCheck Admin Panel • {new Date().toLocaleDateString("uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}
