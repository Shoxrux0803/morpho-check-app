// src/components/Dashboard/SuperAdminDashboard.js
import React, { useMemo } from "react";
import {
  Box, Grid, Paper, Typography, CircularProgress, Divider, Tooltip as MuiTooltip,
  LinearProgress, useTheme, Chip, Stack
} from "@mui/material";
import {
  PeopleAlt, Assessment, TrendingUp, AdminPanelSettings,
  Wc, PersonOutline, WomanOutlined, BarChartOutlined,
  FmdGoodOutlined, MonitorWeightOutlined, FavoriteBorderOutlined
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";

// ==== PALETTE ====
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  teal: "#14b8a6",
  rose: "#f43f5e",
};
const PIE_COLORS = [COLORS.info, COLORS.rose, COLORS.teal, COLORS.warning];
const AGE_COLORS = ["#818cf8", "#6366f1", "#4f46e5", "#3730a3", "#312e81"];

// ==== HELPERS ====
const GlassCard = ({ children, sx = {}, gradient }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: gradient
          ? gradient
          : isDark
          ? "rgba(30,30,50,0.7)"
          : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 40px rgba(99,102,241,0.15)" },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const KpiCard = ({ label, value, sub, icon, color, trend, loading }) => (
  <GlassCard
    gradient={`linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`}
    sx={{ borderLeft: `4px solid ${color}` }}
  >
    {loading ? (
      <CircularProgress size={28} sx={{ color }} />
    ) : (
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>
            {value ?? "—"}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {sub}
            </Typography>
          )}
          {typeof trend === "number" && (
            <Chip
              size="small"
              label={`${trend > 0 ? "+" : ""}${trend}%`}
              sx={{
                mt: 1,
                fontSize: "0.65rem",
                height: 20,
                bgcolor: trend >= 0 ? "#10b98122" : "#ef444422",
                color: trend >= 0 ? COLORS.success : COLORS.error,
                fontWeight: 700,
              }}
            />
          )}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `${color}22`,
            color,
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </Box>
      </Box>
    )}
  </GlassCard>
);

const SectionTitle = ({ title, subtitle }) => (
  <Box mb={2}>
    <Typography variant="h6" fontWeight={800} sx={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

const CustomTooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "none",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    backdropFilter: "blur(20px)",
    background: "rgba(15,15,25,0.92)",
    color: "#fff",
    fontSize: 13,
  },
  labelStyle: { color: "#a5b4fc", fontWeight: 700 },
  itemStyle: { color: "#e2e8f0" },
};

// ==== MAIN COMPONENT ====
export default function SuperAdminDashboard({ stats, statsLoading, admins = [] }) {
  const theme = useTheme();

  // ----- Derived data -----
  const genderData = useMemo(() => [
    { name: "Erkak", value: stats?.by_gender?.erkak || 0 },
    { name: "Ayol", value: stats?.by_gender?.ayol || 0 },
    { name: "Noma'lum", value: stats?.by_gender?.["noma'lum"] || 0 },
  ].filter(d => d.value > 0), [stats]);

  const ageGroupData = useMemo(() =>
    (stats?.by_age_group || []).map((g, i) => ({ ...g, fill: AGE_COLORS[i % AGE_COLORS.length] })),
    [stats]);

  const somatoData = useMemo(() =>
    Object.entries(stats?.by_somatotype || {}).map(([name, value]) => ({ name, value })),
    [stats]);

  const regionData = useMemo(() =>
    (stats?.by_region || []).slice(0, 10),
    [stats]);

  const monthlyTrend = useMemo(() =>
    (stats?.monthly_trend || []).map(m => ({
      ...m,
      avgBmi: m.avg_bmi ? parseFloat(m.avg_bmi).toFixed(1) : null,
    })),
    [stats]);

  const bmiCategories = useMemo(() => {
    const total = (stats?.bmi_distribution?.normal || 0)
      + (stats?.bmi_distribution?.underweight || 0)
      + (stats?.bmi_distribution?.overweight || 0)
      + (stats?.bmi_distribution?.obese || 0);
    if (!total) return [];
    return [
      { name: "Normal", value: stats.bmi_distribution.normal, pct: Math.round(stats.bmi_distribution.normal / total * 100), color: COLORS.success },
      { name: "Ortiqcha", value: stats.bmi_distribution.overweight, pct: Math.round(stats.bmi_distribution.overweight / total * 100), color: COLORS.warning },
      { name: "Semizlik", value: stats.bmi_distribution.obese, pct: Math.round(stats.bmi_distribution.obese / total * 100), color: COLORS.error },
      { name: "Ozg'in", value: stats.bmi_distribution.underweight, pct: Math.round(stats.bmi_distribution.underweight / total * 100), color: COLORS.info },
    ];
  }, [stats]);

  const radarData = useMemo(() => {
    // Somatotip radar: endomorph/mesomorph/ectomorph average comparisons
    const st = stats?.somatotype_avg || {};
    return [
      { metric: "Endomorph", value: parseFloat(st.endomorph || 0).toFixed(2) },
      { metric: "Mezomorph", value: parseFloat(st.mesomorph || 0).toFixed(2) },
      { metric: "Ektomorph", value: parseFloat(st.ectomorph || 0).toFixed(2) },
    ];
  }, [stats]);

  // Admins per role
  const adminRolePie = useMemo(() => {
    const superCount = admins.filter(a => a.role === "superadmin").length;
    const adminCount = admins.filter(a => a.role === "admin").length;
    return [
      { name: "Superadmin", value: superCount },
      { name: "Admin", value: adminCount },
    ].filter(d => d.value > 0);
  }, [admins]);

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* ===== KPI CARDS ===== */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Jami Analizlar"
            value={stats?.total_analyses?.toLocaleString("uz-UZ") ?? "0"}
            sub="Barcha vaqt davomida"
            icon={<Assessment />}
            color={COLORS.primary}
            trend={stats?.monthly_growth}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Bugungi Analizlar"
            value={stats?.today_analyses?.toLocaleString("uz-UZ") ?? "0"}
            sub="Bugun kiritilgan"
            icon={<TrendingUp />}
            color={COLORS.success}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="Jami Adminlar"
            value={admins.length}
            sub={`${admins.filter(a => a.role === "superadmin").length} super, ${admins.filter(a => a.role === "admin").length} oddiy`}
            icon={<AdminPanelSettings />}
            color={COLORS.secondary}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard
            label="O'rtacha BMI"
            value={stats?.avg_bmi ? parseFloat(stats.avg_bmi).toFixed(1) : "—"}
            sub="Tizim bo'yicha"
            icon={<MonitorWeightOutlined />}
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      {/* ===== CHARTS SECTION ===== */}
      <Grid container spacing={3}>
        {/* ROW 1: Wide Chart (Monthly trend) */}
        <Grid size={{ xs: 12 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="📈 Oylik dinamika" subtitle="So'nggi 12 oy davomidagi analizlar soni" />
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradBmi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="count" name="Analizlar soni" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradCount)" dot={{ r: 3, fill: COLORS.primary }} />
                  {monthlyTrend.some(d => d.avgBmi) && (
                    <Area yAxisId="right" type="monotone" dataKey="avgBmi" name="O'rtacha BMI" stroke={COLORS.warning} strokeWidth={2} fill="url(#gradBmi)" strokeDasharray="5 3" dot={false} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* ROW 2: Triple Distribution Charts (Gender, Age, Somatotype) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="⚥ Jinsiy taqsimot" subtitle="Erkak / Ayol nisbati" />
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip {...CustomTooltipStyle} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={0.8}>
              {genderData.map((g, i) => {
                const total = genderData.reduce((s, d) => s + d.value, 0);
                const pct = total ? Math.round(g.value / total * 100) : 0;
                return (
                  <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PIE_COLORS[i] }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{g.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={800}>{g.value.toLocaleString()} ({pct}%)</Typography>
                  </Box>
                );
              })}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="👤 Yosh guruhlari" subtitle="Bemorlar yosh bo'yicha" />
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar dataKey="value" name="Bemorlar soni" radius={[6, 6, 0, 0]} barSize={28}>
                    {ageGroupData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || COLORS.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="🏃 Somatotip taqsimoti" subtitle="Tana tuzilishi klassifikatsiyasi" />
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={somatoData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar dataKey="value" name="Soni" fill={COLORS.secondary} radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* ROW 3: Region + BMI status */}
        {regionData.length > 0 && (
          <Grid size={{ xs: 12, md: 7 }}>
            <GlassCard>
              <SectionTitle title="🗺️ Viloyatlar bo'yicha top-10" subtitle="Eng ko'p analiz kiritilgan hududlar" />
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis dataKey="region" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <ReTooltip {...CustomTooltipStyle} />
                    <Bar dataKey="count" name="Analizlar" fill={COLORS.teal} radius={[0, 6, 6, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: regionData.length > 0 ? 5 : 12 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle title="⚖️ BMI holati taqsimoti" subtitle="Sog'lik guruhlari bo'yicha" />
            {bmiCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
                Ma'lumot yo'q
              </Typography>
            ) : (
              <Stack spacing={2} mt={1}>
                {bmiCategories.map((cat) => (
                  <Box key={cat.name}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight={700} color="text.primary" fontSize="0.85rem">{cat.name}</Typography>
                      <Typography variant="body2" fontWeight={900} sx={{ color: cat.color }}>{cat.pct}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={cat.pct}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: `${cat.color}15`,
                        "& .MuiLinearProgress-bar": { bgcolor: cat.color, borderRadius: 5 },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>{cat.value.toLocaleString()} bemor</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </GlassCard>
        </Grid>

        {/* ROW 4: Radar + Admin piechart */}
        {radarData.some(d => parseFloat(d.value) > 0) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle title="🕸️ Somatotip o'rtacha radar" subtitle="Tizim bo'yicha o'rtacha somatometrik ko'rsatkichlar" />
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 7]} tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Radar name="O'rtacha" dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} strokeWidth={2} />
                    <ReTooltip {...CustomTooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        )}
        {adminRolePie.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle title="👨‍💼 Adminlar taqsimoti" subtitle="Rollar bo'yicha tizim foydalanuvchilari" />
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminRolePie}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {adminRolePie.map((_, i) => (
                        <Cell key={i} fill={[COLORS.error, COLORS.primary][i % 2]} stroke="none" />
                      ))}
                    </Pie>
                    <ReTooltip {...CustomTooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        )}
      </Grid>

      {/* Summary Footer */}
      <Box mt={4} py={2} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          So'nggi yangilanish: {new Date().toLocaleString("uz-UZ")} • MorphoCheck SuperAdmin Analytics Pro
        </Typography>
      </Box>
    </Box>
  );
}
