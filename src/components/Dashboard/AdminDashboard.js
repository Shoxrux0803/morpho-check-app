// src/components/Dashboard/AdminDashboard.js
// Oddiy Admin uchun pro darajadagi dashboard — faqat o'z ma'lumotlari
import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  LinearProgress,
  Chip,
  useTheme,
  Divider,
} from "@mui/material";
import {
  PersonAdd,
  TrendingUp,
  MonitorWeightOutlined,
  DateRangeOutlined,
  FmdGoodOutlined,
  ReportProblemOutlined,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = {
  primary: "#0f766e",
  secondary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  teal: "#14b8a6",
  rose: "#f43f5e",
  ink: "#0f172a",
};

const PIE_COLORS = ["#3b82f6", "#f43f5e", "#14b8a6"];

const GlassCard = ({ children, sx = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: "100%",
          borderRadius: 2,
          background: isDark ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(14px)",
          border: "1px solid",
          borderColor: isDark ? "rgba(148,163,184,0.18)" : "rgba(15,118,110,0.14)",
          boxShadow: isDark ? "0 18px 45px rgba(0,0,0,0.28)" : "0 16px 44px rgba(15,23,42,0.07)",
          ...sx,
        }}
      >
        {children}
      </Paper>
    </motion.div>
  );
};

const KpiCard = ({ label, value, sub, icon, color, loading }) => (
  <GlassCard
    sx={{
      minHeight: 148,
      borderTop: `3px solid ${color}`,
      background: `linear-gradient(180deg, ${color}12 0%, transparent 68%)`,
    }}
  >
    {loading ? (
      <CircularProgress size={24} sx={{ color }} />
    ) : (
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: "0.68rem" }}
          >
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1.1 }}>
            {value ?? "—"}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {sub}
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 1.25, borderRadius: 2, background: `${color}18`, color, display: "flex" }}>
          {icon}
        </Box>
      </Box>
    )}
  </GlassCard>
);

const SectionTitle = ({ title, subtitle }) => (
  <Box mb={2}>
    <Typography
      variant="h6"
      fontWeight={800}
      sx={{
        color: "text.primary",
        letterSpacing: 0,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

const getTooltipStyle = (isDark) => ({
  contentStyle: {
    borderRadius: "12px",
    border: "none",
    boxShadow: isDark
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)"
      : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    background: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f8fafc" : "#1e293b",
    fontSize: "13px",
    padding: "10px 14px",
    borderLeft: isDark ? "4px solid #14b8a6" : "4px solid #0f766e",
  },
  itemStyle: {
    color: isDark ? "#f1f5f9" : "#334155",
    padding: "2px 0",
  },
  labelStyle: {
    color: isDark ? "#5eead4" : "#0f766e",
    fontWeight: 800,
    marginBottom: "4px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cursor: { stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)", strokeWidth: 2 },
});

export default function AdminDashboard({
  data = [],
  loading,
  stats,
  statsLoading,
  totalCount = 0,
  userName,
  filters,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const customTooltip = useMemo(() => getTooltipStyle(isDark), [isDark]);

  // Derive statistics from loaded data (admin's own data)
  const localStats = useMemo(() => {
    if (!data.length)
      return {
        avgBmi: 0,
        maleCount: 0,
        femaleCount: 0,
        unknownCount: 0,
        avgAge: 0,
        bmiCategories: [],
      };

    const maleCount = data.filter((r) => {
      const g = (r.gender || "").toLowerCase();
      return (
        g === "erkak" ||
        g === "male" ||
        g === "m" ||
        g === "boy" ||
        g.includes("o'g'il") ||
        g.includes("о'ғил")
      );
    }).length;
    const femaleCount = data.filter((r) => {
      const g = (r.gender || "").toLowerCase();
      return (
        g === "ayol" ||
        g === "female" ||
        g === "f" ||
        g === "girl" ||
        g.includes("qiz") ||
        g.includes("қиз")
      );
    }).length;
    const unknownCount = data.length - maleCount - femaleCount;

    const bmiValues = data.filter((r) => r.bmi && !isNaN(r.bmi)).map((r) => parseFloat(r.bmi));
    const avgBmi = bmiValues.length
      ? (bmiValues.reduce((s, v) => s + v, 0) / bmiValues.length).toFixed(1)
      : 0;

    const ageValues = data.filter((r) => r.age && !isNaN(r.age)).map((r) => Number(r.age));
    const avgAge = ageValues.length
      ? Math.round(ageValues.reduce((s, v) => s + v, 0) / ageValues.length)
      : 0;

    const normal = bmiValues.filter((v) => v >= 18.5 && v < 25).length;
    const underweight = bmiValues.filter((v) => v < 18.5).length;
    const overweight = bmiValues.filter((v) => v >= 25 && v < 30).length;
    const obese = bmiValues.filter((v) => v >= 30).length;
    const bmiTotal = bmiValues.length || 1;

    return {
      avgBmi,
      maleCount,
      femaleCount,
      unknownCount,
      avgAge,
      bmiCategories: [
        {
          name: "Normal",
          pct: Math.round((normal / bmiTotal) * 100),
          count: normal,
          color: COLORS.success,
        },
        {
          name: "Ortiqcha",
          pct: Math.round((overweight / bmiTotal) * 100),
          count: overweight,
          color: COLORS.warning,
        },
        {
          name: "Semizlik",
          pct: Math.round((obese / bmiTotal) * 100),
          count: obese,
          color: COLORS.error,
        },
        {
          name: "Ozg'in",
          pct: Math.round((underweight / bmiTotal) * 100),
          count: underweight,
          color: COLORS.info,
        },
      ],
      stats: {
        normalPct: Math.round((normal / bmiTotal) * 100),
        riskPct: Math.round(((overweight + obese) / bmiTotal) * 100),
        underweightPct: Math.round((underweight / bmiTotal) * 100),
      },
    };
  }, [data]);

  const scientificInsights = useMemo(() => {
    if (!data.length) return null;
    const { stats: s, avgBmi } = localStats;
    const insights = [];

    if (s.normalPct > 60)
      insights.push(
        "Guruhdagi bemorlarning aksariyati (60%+) normal vaznga ega, bu ijobiy ko'rsatkich.",
      );
    else if (s.riskPct > 40)
      insights.push("Diqqat: guruhda ortiqcha vazn va semizlik ulushi yuqori (40%+).");

    if (avgBmi > 25)
      insights.push(
        `O'rtacha BMI (${avgBmi}) me'yordan biroz yuqori. Profilaktik choralarni kuchaytirish tavsiya etiladi.`,
      );

    const maleCount = stats?.by_gender?.erkak ?? localStats.maleCount;
    const femaleCount = stats?.by_gender?.ayol ?? localStats.femaleCount;
    const unknownCount = stats?.by_gender?.["noma'lum"] ?? localStats.unknownCount;
    const totalN = maleCount + femaleCount + unknownCount;

    const malePct = totalN > 0 ? Math.round((maleCount / totalN) * 100) : 0;
    const femalePct = totalN > 0 ? Math.round((femaleCount / totalN) * 100) : 0;

    insights.push(
      `Kontingent tarkibi: ${malePct}% erkaklar va ${femalePct}% ayollarni tashkil etadi.`,
    );

    return insights;
  }, [data, localStats, stats?.by_gender]);

  const genderData = useMemo(
    () =>
      [
        { name: "Erkak", value: stats?.by_gender?.erkak ?? localStats.maleCount },
        { name: "Ayol", value: stats?.by_gender?.ayol ?? localStats.femaleCount },
        { name: "Noma'lum", value: stats?.by_gender?.["noma'lum"] ?? localStats.unknownCount },
      ].filter((d) => d.value > 0),
    [localStats, stats],
  );

  const ageGroupData = useMemo(() => {
    const groups = { "0-10": 0, "11-20": 0, "21-35": 0, "36-50": 0, "51-65": 0, "65+": 0 };
    data.forEach((r) => {
      const age = Number(r.age);
      if (age <= 10) groups["0-10"]++;
      else if (age <= 20) groups["11-20"]++;
      else if (age <= 35) groups["21-35"]++;
      else if (age <= 50) groups["36-50"]++;
      else if (age <= 65) groups["51-65"]++;
      else groups["65+"]++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [data]);

  // Build daily trend from createdAt
  const dailyTrend = useMemo(() => {
    const byDate = {};
    data.forEach((r) => {
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
  const todayCount = data.filter((r) => r.createdAt && r.createdAt.startsWith(todayKey)).length;
  const riskRegionRows = (stats?.top_risk_regions || []).slice(0, 5);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", pb: 2 }}>
      {/* Welcome & Insights */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box
            p={3.5}
            sx={{
              height: "100%",
              borderRadius: 2,
              background: isDark
                ? "linear-gradient(135deg, rgba(15,118,110,0.22), rgba(37,99,235,0.12))"
                : "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(37,99,235,0.06))",
              border: `1px solid ${COLORS.primary}33`,
              boxShadow: "0 18px 44px rgba(15,23,42,0.07)",
            }}
          >
            <Typography variant="h4" fontWeight={900} sx={{ color: "text.primary", mb: 1 }}>
              Xush kelibsiz, {userName || "Admin"}
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              Klinik antropometriya bo'yicha shaxsiy analitika paneli
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Barcha kiritilgan ma'lumotlar tahlili. Filtrlardan foydalanib natijalarni
              saralashingiz mumkin.
            </Typography>
            <Divider sx={{ my: 3, borderColor: `${COLORS.primary}22` }} />
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1.5}>
              <Chip
                label={`Jami: ${totalCount}`}
                size="medium"
                variant="outlined"
                sx={{ fontWeight: 800, bgcolor: "background.paper" }}
              />
              <Chip
                label={`O'rtacha BMI: ${stats?.avg_bmi ? parseFloat(stats.avg_bmi).toFixed(1) : localStats.avgBmi}`}
                size="medium"
                color="primary"
                sx={{ fontWeight: 800 }}
              />
              <Chip
                label={`O'rtacha yosh: ${localStats.avgAge}`}
                size="medium"
                color="secondary"
                sx={{ fontWeight: 800 }}
              />
              {filters &&
                Object.values(filters).some(
                  (v) => v !== "" && v !== 0 && v !== 100 && v !== 10 && v !== 50,
                ) && (
                  <Chip
                    label="Filtrlangan holatda"
                    color="info"
                    variant="filled"
                    size="medium"
                    sx={{ fontWeight: 800 }}
                  />
                )}
            </Stack>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <GlassCard
            sx={{
              height: "100%",
              bgcolor: isDark ? "rgba(15,118,110,0.08)" : "rgba(15,118,110,0.035)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <SectionTitle title="Ilmiy xulosalar" subtitle="Avtomatik tahlil natijalari" />
            <Stack spacing={1.5}>
              {scientificInsights ? (
                scientificInsights.map((text, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                      borderLeft: `3px solid ${COLORS.primary}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "text.secondary",
                        lineHeight: 1.4,
                        fontWeight: 500,
                      }}
                    >
                      {text}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Ma'lumotlar yetarli emas...
                </Typography>
              )}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== KPI CARDS ===== */}
      <Grid container spacing={2.5} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Jami kiritganlarim"
            value={
              stats
                ? (stats.total_analyses?.toLocaleString("uz-UZ") ?? "0")
                : totalCount.toLocaleString("uz-UZ")
            }
            sub="Barcha vaqt davomida"
            icon={<PersonAdd fontSize="large" />}
            color={COLORS.primary}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Bugun kiritilganlar"
            value={stats ? (stats.today_analyses ?? 0) : todayCount}
            sub="Bugungi seans"
            icon={<DateRangeOutlined fontSize="large" />}
            color={COLORS.success}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="O'rtacha BMI"
            value={
              stats
                ? stats.avg_bmi
                  ? parseFloat(stats.avg_bmi).toFixed(1)
                  : "—"
                : localStats.avgBmi
            }
            sub="Guruh bo'yicha"
            icon={<MonitorWeightOutlined fontSize="large" />}
            color={COLORS.warning}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Haftalik o'sish"
            value={
              stats
                ? stats.weekly_growth_pct != null
                  ? `${Number(stats.weekly_growth_pct) > 0 ? "+" : ""}${stats.weekly_growth_pct}%`
                  : "0"
                : localStats.avgAge
                  ? `${localStats.avgAge} yosh`
                  : "—"
            }
            sub={`${stats?.weekly_analyses ?? 0} ta shu hafta`}
            icon={<TrendingUp fontSize="large" />}
            color={COLORS.secondary}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ===== CHARTS SECTION ===== */}
      <Grid container spacing={3}>
        {riskRegionRows.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <GlassCard>
              <SectionTitle
                title="Eng ko'p risk chiqqan regionlar"
                subtitle="BMI yoki Z-score xavf chegarasidan chiqqan yozuvlar"
              />
              <Grid container spacing={2}>
                {riskRegionRows.map((row) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={row.region}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.04)",
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" gap={2}>
                        <Box display="flex" gap={1.2} alignItems="center">
                          <FmdGoodOutlined color="error" fontSize="small" />
                          <Typography variant="body2" fontWeight={800}>
                            {row.region}
                          </Typography>
                        </Box>
                        <ReportProblemOutlined sx={{ color: COLORS.error }} fontSize="small" />
                      </Box>
                      <Typography variant="h5" fontWeight={800} color="error.main" mt={1}>
                        {row.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.total} tadan {row.risk_rate}% risk
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(row.risk_rate, 100)}
                        sx={{
                          mt: 1.2,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "rgba(239,68,68,0.12)",
                          "& .MuiLinearProgress-bar": { bgcolor: COLORS.error },
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </GlassCard>
          </Grid>
        )}
        {/* ROW 1: Wide Chart (Daily trend) */}
        <Grid size={{ xs: 12 }}>
          <GlassCard>
            <SectionTitle
              title="Kunlik dinamika"
              subtitle="So'nggi 14 kunlik kiritilgan analizlar"
            />
            {dailyTrend.length === 0 ? (
              <Box py={8} textAlign="center">
                <Typography color="text.secondary">Natija topilmadi</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      allowDecimals={false}
                    />
                    <ReTooltip {...customTooltip} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Kiritilganlar"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      fill="url(#adminGrad)"
                      dot={{ r: 4, fill: COLORS.primary }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </GlassCard>
        </Grid>

        {/* ROW 2: Triple Distribution Charts (Gender, Age, BMI) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="Jins taqsimoti" subtitle="Erkak/ayol nisbati" />
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip {...customTooltip} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              {genderData.map((g, i) => {
                const total = genderData.reduce((s, d) => s + d.value, 0) || 1;
                const pct = Math.round((g.value / total) * 100);
                return (
                  <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: PIE_COLORS[i] }}
                      />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {g.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800}>
                      {g.value} ({pct}%)
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="Yosh guruhlari" subtitle="Bemorlar yoshi bo'yicha" />
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <ReTooltip {...customTooltip} />
                  <Bar
                    dataKey="value"
                    name="Bemorlar"
                    fill={COLORS.secondary}
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="BMI holati" subtitle="Sog'liq guruhlari bo'yicha" />
            <Stack spacing={3} mt={2}>
              {localStats.bmiCategories.map((cat) => (
                <Box key={cat.name}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={700} fontSize="0.95rem">
                      {cat.name}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="baseline">
                      <Typography variant="caption" color="text.secondary">
                        {cat.count} ta
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ color: cat.color }}>
                        {cat.pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cat.pct}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: `${cat.color}15`,
                      "& .MuiLinearProgress-bar": { bgcolor: cat.color, borderRadius: 6 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      <Box mt={6} textAlign="center" pb={4}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
          MORPHO CHECK PRO • Professional analitika tizimi •{" "}
          {new Date().toLocaleDateString("uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}
