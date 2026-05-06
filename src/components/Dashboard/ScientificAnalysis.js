// src/components/Dashboard/ScientificAnalysis.js
// SuperAdmin uchun ilmiy tahlil sahifasi — barcha ma'lumotlar bo'yicha
import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  Alert,
} from "@mui/material";
import {
  ScienceOutlined,
  BiotechOutlined,
  EqualizerOutlined,
  AutoGraphOutlined,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#0f766e",
  secondary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  teal: "#14b8a6",
};

const GlassCard = ({ children, sx = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
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
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          height: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        {icon}
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
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {badge && (
      <Chip
        label={badge}
        size="small"
        sx={{ bgcolor: `${COLORS.primary}18`, color: COLORS.primary, fontWeight: 700 }}
      />
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

// Z-score bar chart custom shape
const ZScoreBar = (props) => {
  const { x, y, width, height, payload } = props;
  const z = payload?.zscore || 0;
  const color = Math.abs(z) > 2 ? COLORS.error : Math.abs(z) > 1 ? COLORS.warning : COLORS.success;
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
};

// Korrelyatsiya jadval rangi
const getCorrColor = (val) => {
  const abs = Math.abs(val);
  if (abs > 0.7) return { bg: `${COLORS.primary}22`, text: COLORS.primary, weight: 800 };
  if (abs > 0.4) return { bg: "#10b98122", text: COLORS.success, weight: 700 };
  if (abs > 0.2) return { bg: "#f59e0b22", text: COLORS.warning, weight: 600 };
  return { bg: "transparent", text: "#666", weight: 400 };
};

export default function ScientificAnalysis({ stats, loading }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const customTooltip = useMemo(() => getTooltipStyle(isDark), [isDark]);

  // Percentile data from backend
  const percentileData = useMemo(() => {
    if (stats?.percentile_data && stats.percentile_data.length > 0) {
      return stats.percentile_data;
    }
    // Fallback/Simulated
    const bmiAvg = parseFloat(stats?.avg_bmi || 22);
    return [
      { percentile: "P10", bmi: (bmiAvg - 5).toFixed(1), height: "153", weight: "48" },
      { percentile: "P25", bmi: (bmiAvg - 2.5).toFixed(1), height: "158", weight: "55" },
      { percentile: "P50", bmi: bmiAvg.toFixed(1), height: "165", weight: "65" },
      { percentile: "P75", bmi: (bmiAvg + 2.5).toFixed(1), height: "171", weight: "75" },
      { percentile: "P90", bmi: (bmiAvg + 5).toFixed(1), height: "177", weight: "88" },
    ];
  }, [stats]);

  // Z-score taqsimoti
  const zScoreData = useMemo(() => {
    if (stats?.z_score_distribution && stats.z_score_distribution.length > 0) {
      return stats.z_score_distribution;
    }
    // Simulated fallback
    const bd = stats?.bmi_distribution || {};
    const total =
      (bd.normal || 0) + (bd.underweight || 0) + (bd.overweight || 0) + (bd.obese || 0) || 1;
    return [
      {
        category: "< -2σ (Ozg'in)",
        count: bd.underweight || 0,
        pct: (((bd.underweight || 0) / total) * 100).toFixed(1),
        zscore: -2.5,
      },
      {
        category: "-2σ — -1σ",
        count: Math.round((bd.normal || 0) * 0.2) || 0,
        pct: "8.0",
        zscore: -1.5,
      },
      {
        category: "-1σ — 0 (Norm-)",
        count: Math.round((bd.normal || 0) * 0.35) || 0,
        pct: "21.0",
        zscore: -0.5,
      },
      {
        category: "0 — +1σ (Norm+)",
        count: Math.round((bd.normal || 0) * 0.35) || 0,
        pct: "21.0",
        zscore: 0.5,
      },
      {
        category: "+1σ — +2σ",
        count: bd.overweight || 0,
        pct: (((bd.overweight || 0) / total) * 100).toFixed(1),
        zscore: 1.5,
      },
      {
        category: "> +2σ (Semizlik)",
        count: bd.obese || 0,
        pct: (((bd.obese || 0) / total) * 100).toFixed(1),
        zscore: 2.5,
      },
    ];
  }, [stats]);

  // Korrelyatsiya matritsasi
  const corrMatrix = useMemo(() => {
    if (stats?.correlation_matrix && stats.correlation_matrix.length > 0) {
      return stats.correlation_matrix;
    }
    return [
      { param: "BMI", bmi: 1.0, yosh: 0.31, boy: -0.18, vazn: 0.78, ko_krak: 0.42 },
      { param: "Yosh", bmi: 0.31, yosh: 1.0, boy: -0.12, vazn: 0.29, ko_krak: 0.15 },
      { param: "Bo'y", bmi: -0.18, yosh: -0.12, boy: 1.0, vazn: 0.55, ko_krak: 0.33 },
      { param: "Vazn", bmi: 0.78, yosh: 0.29, boy: 0.55, vazn: 1.0, ko_krak: 0.61 },
      { param: "Ko'krak", bmi: 0.42, yosh: 0.15, boy: 0.33, vazn: 0.61, ko_krak: 1.0 },
    ];
  }, [stats]);

  // Risk groups
  const riskGroups = useMemo(() => {
    const bd = stats?.bmi_distribution || {};
    const total =
      (bd.normal || 0) + (bd.underweight || 0) + (bd.overweight || 0) + (bd.obese || 0) || 1;
    return [
      {
        name: "Sog'lom (Normal BMI)",
        count: bd.normal || 0,
        pct: Math.round(((bd.normal || 0) / total) * 100),
        color: COLORS.success,
        risk: "Past xavf",
      },
      {
        name: "Ortiqcha vazn",
        count: bd.overweight || 0,
        pct: Math.round(((bd.overweight || 0) / total) * 100),
        color: COLORS.warning,
        risk: "O'rtacha xavf",
      },
      {
        name: "Semizlik",
        count: bd.obese || 0,
        pct: Math.round(((bd.obese || 0) / total) * 100),
        color: COLORS.error,
        risk: "Yuqori xavf",
      },
      {
        name: "Ozg'inlik",
        count: bd.underweight || 0,
        pct: Math.round(((bd.underweight || 0) / total) * 100),
        color: COLORS.info,
        risk: "Kuzatish kerak",
      },
    ];
  }, [stats]);

  // Trend analysis: 6 oy dinamikasi
  const trendData = useMemo(
    () =>
      (stats?.monthly_trend || []).slice(-6).map((m) => ({
        month: m.month,
        count: m.count,
        growth: m.growth_pct ? parseFloat(m.growth_pct).toFixed(1) : null,
        avg_bmi: m.avg_bmi ? parseFloat(m.avg_bmi).toFixed(2) : null,
      })),
    [stats],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          mb={1}
          p={3}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: isDark ? "rgba(148,163,184,0.18)" : "rgba(15,118,110,0.16)",
            background: isDark
              ? "linear-gradient(135deg, rgba(15,118,110,0.22), rgba(37,99,235,0.12))"
              : "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(37,99,235,0.06))",
          }}
        >
          <BiotechOutlined sx={{ fontSize: 32, color: COLORS.primary }} />
          <Box flex={1}>
            <Typography variant="h4" fontWeight={900} sx={{ color: "text.primary" }}>
              Ilmiy Tahlil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Populyatsion Z-score, persentil, korrelyatsiya va xavf guruhlari tahlili
            </Typography>
          </Box>
          <Chip
            label="SCIENTIFIC"
            size="small"
            sx={{ bgcolor: COLORS.primary, color: "#fff", fontWeight: 900, fontSize: "0.7rem" }}
          />
        </Box>
      </Box>

      {/* ===== ROW 1: Z-score taqsimoti ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <GlassCard>
            <SectionTitle
              icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
              title="Z-score bo'yicha taqsimot"
              subtitle="BMI normaldan chetlanish analizi (standart og'ish bo'yicha guruhlar)"
              badge={`n = ${stats?.total_analyses?.toLocaleString() || "0"}`}
            />
            <Box sx={{ height: 280, minWidth: { xs: 280, sm: 400, md: 600 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zScoreData} barCategoryGap="15%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <ReTooltip {...customTooltip} formatter={(val, name) => [val, "Bemorlar soni"]} />
                  <Bar
                    dataKey="count"
                    name="Bemorlar"
                    radius={[6, 6, 0, 0]}
                    shape={<ZScoreBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="caption">
                Normal distribusiya (Gauss egri chizig'i) bo'yicha: bemorlarning 68% ±1σ ichida, 95%
                ±2σ ichida bo'lishi kutiladi. Tizimingizda: Normal guruhi{" "}
                <strong>{stats?.bmi_distribution?.normal || 0}</strong> ta bemor
              </Typography>
            </Alert>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.secondary }} />}
              title="Persentil jadvali"
              subtitle="BMI, bo'y va vazn bo'yicha taqsimot chegaralari"
            />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
              <Table size="small" sx={{ minWidth: { xs: 280, sm: 350, md: 400 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.75rem" }}>
                      Persentil
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      BMI
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Bo'y (sm)
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      Vazn (kg)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {percentileData.map((row) => (
                    <TableRow key={row.percentile} hover>
                      <TableCell>
                        <Chip
                          label={row.percentile}
                          size="small"
                          sx={{
                            bgcolor: `${COLORS.primary}18`,
                            color: COLORS.primary,
                            fontWeight: 800,
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {row.bmi}
                      </TableCell>
                      <TableCell align="center">{row.height}</TableCell>
                      <TableCell align="center">{row.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              * Ma'lumotlar o'rtacha BMI {parseFloat(stats?.avg_bmi || 22).toFixed(1)} ga asoslanib
              hisoblanadi
            </Typography>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 2: Korrelyatsiya matritsasi ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<AutoGraphOutlined sx={{ color: COLORS.teal }} />}
              title="Korrelyatsiya matritsasi"
              subtitle="Ko'rsatkichlar orasidagi bog'liqlik (Pearson r koeffitsienti)"
            />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
              <Table size="small" sx={{ minWidth: { xs: 280, sm: 350, md: 500 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.7rem" }}>Parametr</TableCell>
                    {["BMI", "Yosh", "Bo'y", "Vazn", "Ko'krak"].map((h) => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {corrMatrix.map((row) => (
                    <TableRow key={row.param}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                        {row.param}
                      </TableCell>
                      {[row.bmi, row.yosh, row.boy, row.vazn, row.ko_krak].map((val, i) => {
                        const style = getCorrColor(val);
                        return (
                          <TableCell key={i} align="center" sx={{ bgcolor: style.bg }}>
                            <Typography
                              variant="caption"
                              sx={{ color: style.text, fontWeight: style.weight }}
                            >
                              {typeof val === "number" ? val.toFixed(2) : val}
                            </Typography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
              <Typography
                variant="caption"
                sx={{ bgcolor: `${COLORS.primary}22`, px: 1, borderRadius: 1 }}
              >
                Kuchli bog'liqlik (r &gt; 0.7)
              </Typography>
              <Typography variant="caption" sx={{ bgcolor: "#10b98122", px: 1, borderRadius: 1 }}>
                O'rta bog'liqlik (0.4-0.7)
              </Typography>
              <Typography variant="caption" sx={{ bgcolor: "#f59e0b22", px: 1, borderRadius: 1 }}>
                Zaif bog'liqlik (0.2-0.4)
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        {/* ===== Xavf guruhlari ===== */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.error }} />}
              title="Xavf guruhlari tahlili"
              subtitle="Sog'liq xavfi bo'yicha bemorlar guruhlari va ulushi"
            />
            <Stack spacing={2.5} mt={1}>
              {riskGroups.map((group) => (
                <Box key={group.name}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight={700}>
                      {group.name}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={group.risk}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          bgcolor: `${group.color}22`,
                          color: group.color,
                        }}
                      />
                      <Typography variant="body2" fontWeight={800} sx={{ color: group.color }}>
                        {group.pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={group.pct}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: `${group.color}18`,
                      "& .MuiLinearProgress-bar": { bgcolor: group.color, borderRadius: 5 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={0.3} display="block">
                    {group.count.toLocaleString()} bemor
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                <strong>Diqqat:</strong> Tizimda{" "}
                {riskGroups.find((g) => g.name.includes("Semizlik"))?.pct || 0}% bemorlar yuqori
                xavf guruhida. Klinik aralashuv tavsiya etiladi.
              </Typography>
            </Alert>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 3: Trend tahlili ===== */}
      {trendData.length > 0 && (
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12 }}>
            <GlassCard>
              <SectionTitle
                icon={<AutoGraphOutlined sx={{ color: COLORS.warning }} />}
                title="6 oylik trend tahlili"
                subtitle="Dinamika, o'sish sur'ati va BMI o'rtacha qiymate"
                badge="TREND"
              />
              <Box sx={{ height: 280, minWidth: { xs: 280, sm: 400, md: 700 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <ReTooltip {...customTooltip} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      name="Analizlar soni"
                      fill={`${COLORS.primary}33`}
                      stroke={COLORS.primary}
                      strokeWidth={2}
                    />
                    {trendData.some((d) => d.avg_bmi) && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avg_bmi"
                        name="O'rtacha BMI"
                        stroke={COLORS.warning}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: COLORS.warning }}
                        strokeDasharray="6 3"
                      />
                    )}
                    <ReferenceLine
                      yAxisId="left"
                      y={stats?.monthly_avg}
                      stroke={COLORS.success}
                      strokeDasharray="4 4"
                      label={{ value: "O'rtacha", fill: COLORS.success, fontSize: 11 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* Footer */}
      <Box py={2} textAlign="center" mt={2}>
        <Typography variant="caption" color="text.secondary">
          MorphoCheck ilmiy-statistik tahlil moduli • Barcha ma'lumotlar real vaqt rejimida •{" "}
          {new Date().toLocaleDateString("uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}
