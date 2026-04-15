// src/components/Dashboard/AdminScientificAnalysis.js
// Oddiy Admin uchun ilmiy tahlil — faqat o'z kiritgan ma'lumotlari
import React, { useMemo } from "react";
import {
  Box, Grid, Paper, Typography, Stack, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Divider, useTheme, CircularProgress
} from "@mui/material";
import { BiotechOutlined, ScienceOutlined, AutoGraphOutlined, EqualizerOutlined } from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";

const COLORS = {
  primary: "#0ea5e9",
  secondary: "#6366f1",
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
        p: 3, borderRadius: 3,
        background: isDark ? "rgba(30,30,50,0.7)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(14,165,233,0.12)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2.5}>
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        {icon}
        <Typography variant="h6" fontWeight={800} sx={{ background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {title}
        </Typography>
      </Box>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
    {badge && <Chip label={badge} size="small" sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, fontWeight: 700 }} />}
  </Box>
);

const CustomTooltipStyle = {
  contentStyle: {
    borderRadius: 12, border: "none",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    background: "rgba(15,15,25,0.95)",
    color: "#fff", fontSize: 12,
  },
  labelStyle: { color: "#7dd3fc", fontWeight: 700 },
};

export default function AdminScientificAnalysis({ data = [], loading, totalCount = 0 }) {

  // ---- BMI Histogram ----
  const bmiHistogram = useMemo(() => {
    const ranges = [
      { label: "<16", min: 0, max: 16 },
      { label: "16-18.5", min: 16, max: 18.5 },
      { label: "18.5-22", min: 18.5, max: 22 },
      { label: "22-25", min: 22, max: 25 },
      { label: "25-30", min: 25, max: 30 },
      { label: "30-35", min: 30, max: 35 },
      { label: ">35", min: 35, max: 999 },
    ];
    return ranges.map(r => ({
      range: r.label,
      count: data.filter(d => {
        const bmi = parseFloat(d.bmi);
        return !isNaN(bmi) && bmi >= r.min && bmi < r.max;
      }).length,
    }));
  }, [data]);

  // ---- Age vs BMI scatter ----
  const scatterData = useMemo(() =>
    data
      .filter(d => d.age && d.bmi && !isNaN(Number(d.age)) && !isNaN(Number(d.bmi)))
      .slice(0, 200)
      .map(d => ({ age: Number(d.age), bmi: parseFloat(d.bmi) })),
    [data]);

  // ---- Somatotype radar (from actual data) ----
  const somatoRadar = useMemo(() => {
    const groups = {};
    data.forEach(d => {
      const key = d.somatotype || d.somato || null;
      if (key) groups[key] = (groups[key] || 0) + 1;
    });
    if (!Object.keys(groups).length) {
      return [
        { type: "Endomorph", value: 0 },
        { type: "Mezomorph", value: 0 },
        { type: "Ektomorph", value: 0 },
      ];
    }
    return Object.entries(groups).map(([type, value]) => ({ type, value }));
  }, [data]);

  // ---- Xavf guruhlari ----
  const riskGroups = useMemo(() => {
    const bmiVals = data.map(d => parseFloat(d.bmi)).filter(v => !isNaN(v));
    const n = bmiVals.length || 1;
    const normal = bmiVals.filter(v => v >= 18.5 && v < 25).length;
    const overweight = bmiVals.filter(v => v >= 25 && v < 30).length;
    const obese = bmiVals.filter(v => v >= 30).length;
    const underweight = bmiVals.filter(v => v < 18.5).length;
    return [
      { name: "🟢 Normal", count: normal, pct: Math.round(normal / n * 100), color: COLORS.success, desc: "Past xavf" },
      { name: "🟡 Ortiqcha vazn", count: overweight, pct: Math.round(overweight / n * 100), color: COLORS.warning, desc: "O'rta xavf" },
      { name: "🔴 Semizlik", count: obese, pct: Math.round(obese / n * 100), color: COLORS.error, desc: "Yuqori xavf" },
      { name: "🔵 Ozg'inlik", count: underweight, pct: Math.round(underweight / n * 100), color: COLORS.info, desc: "Kuzatuv" },
    ];
  }, [data]);

  // ---- Persentil table ----
  const percentileTable = useMemo(() => {
    const bmiVals = data.map(d => parseFloat(d.bmi)).filter(v => !isNaN(v)).sort((a, b) => a - b);
    const heightVals = data.map(d => parseFloat(d.height)).filter(v => !isNaN(v)).sort((a, b) => a - b);
    const weightVals = data.map(d => parseFloat(d.weight)).filter(v => !isNaN(v)).sort((a, b) => a - b);

    const perc = (arr, p) => {
      if (!arr.length) return "—";
      const idx = Math.floor(arr.length * p / 100);
      return arr[Math.min(idx, arr.length - 1)]?.toFixed(1);
    };

    return [10, 25, 50, 75, 90].map(p => ({
      p: `P${p}`,
      bmi: perc(bmiVals, p),
      height: perc(heightVals, p),
      weight: perc(weightVals, p),
    }));
  }, [data]);

  // ---- BMI Z-score taqsimoti ----
  const zScoreData = useMemo(() => {
    const bmiVals = data.map(d => parseFloat(d.bmi)).filter(v => !isNaN(v));
    if (!bmiVals.length) return [];
    const mean = bmiVals.reduce((s, v) => s + v, 0) / bmiVals.length;
    const std = Math.sqrt(bmiVals.reduce((s, v) => s + (v - mean) ** 2, 0) / bmiVals.length) || 1;
    const buckets = { "< -2σ": 0, "-2 — -1σ": 0, "-1 — 0": 0, "0 — +1σ": 0, "+1 — +2σ": 0, "> +2σ": 0 };
    bmiVals.forEach(v => {
      const z = (v - mean) / std;
      if (z < -2) buckets["< -2σ"]++;
      else if (z < -1) buckets["-2 — -1σ"]++;
      else if (z < 0) buckets["-1 — 0"]++;
      else if (z < 1) buckets["0 — +1σ"]++;
      else if (z < 2) buckets["+1 — +2σ"]++;
      else buckets["> +2σ"]++;
    });
    const getBucketColor = (key) => (key.includes("-2") || key.includes("> +2") ? COLORS.error : key.includes("-1") || key.includes("+1") ? COLORS.warning : COLORS.success);
    return Object.entries(buckets).map(([category, count]) => ({ category, count, fill: getBucketColor(category) }));
  }, [data]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box p={4} textAlign="center">
        <BiotechOutlined sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">Ilmiy tahlil uchun ma'lumot yo'q</Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>Bemorlarni ro'yxatdan o'tkazing</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <BiotechOutlined sx={{ fontSize: 32, color: COLORS.primary }} />
          <Typography variant="h4" fontWeight={900} sx={{ background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary},${COLORS.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Ilmiy Tahlil
          </Typography>
          <Chip label="Mening ma'lumotlarim" size="small" sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, fontWeight: 700 }} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Faqat siz kiritgan <strong>{totalCount}</strong> ta bemor ma'lumotlari bo'yicha statistik tahlil — BMI taqsimoti, Z-score, persentillar va xavf guruhlari
        </Typography>
      </Box>

      {/* ===== ROW 1: BMI Histogram + Z-score ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <GlassCard>
            <SectionTitle
              icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
              title="BMI histogrammasi"
              subtitle="BMI qiymatlari bo'yicha taqsimot"
              badge={`n=${data.length}`}
            />
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bmiHistogram} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <ReferenceLine x="18.5-22" stroke={COLORS.success} strokeDasharray="4 4" />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar dataKey="count" name="Bemorlar" radius={[6, 6, 0, 0]}>
                    {bmiHistogram.map((entry, i) => {
                      const isNormal = entry.range === "18.5-22" || entry.range === "22-25";
                      const isRisk = entry.range === ">35" || entry.range === "<16";
                      return <Cell key={i} fill={isNormal ? COLORS.success : isRisk ? COLORS.error : COLORS.primary} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <GlassCard>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.secondary }} />}
              title="Z-score taqsimoti"
              subtitle="Normaldan chetlanish analizi (standart og'ish)"
            />
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zScoreData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar dataKey="count" name="Bemorlar soni" radius={[6, 6, 0, 0]}>
                    {zScoreData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 2: Persentil + Xavf guruhlari ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={5}>
          <GlassCard>
            <SectionTitle
              icon={<AutoGraphOutlined sx={{ color: COLORS.teal }} />}
              title="Persentil jadval"
              subtitle="Bemorlaringiz bo'yicha taqsimot chegaralari"
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Persentil", "BMI", "Bo'y (sm)", "Vazn (kg)"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.primary }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {percentileTable.map(row => (
                    <TableRow key={row.p} hover>
                      <TableCell>
                        <Chip label={row.p} size="small" sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, fontWeight: 800, fontSize: "0.7rem" }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.bmi}</TableCell>
                      <TableCell>{row.height}</TableCell>
                      <TableCell>{row.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              * Hisob-kitob real bemor ma'lumotlaridan
            </Typography>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <GlassCard>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.error }} />}
              title="Xavf guruhlari"
              subtitle="Bemorlaringizning sog'liq xavfi bo'yicha guruhlari"
            />
            <Stack spacing={2.5} mt={1}>
              {riskGroups.map((g) => (
                <Box key={g.name}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight={700}>{g.name}</Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip label={g.desc} size="small" sx={{ fontSize: "0.65rem", bgcolor: `${g.color}18`, color: g.color }} />
                      <Typography variant="body2" fontWeight={800} sx={{ color: g.color }}>{g.pct}%</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={g.pct}
                    sx={{
                      height: 10, borderRadius: 5,
                      bgcolor: `${g.color}18`,
                      "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 5 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">{g.count} bemor</Typography>
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 3: Age vs BMI scatter ===== */}
      {scatterData.length > 2 && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12}>
            <GlassCard>
              <SectionTitle
                icon={<AutoGraphOutlined sx={{ color: COLORS.warning }} />}
                title="Yosh — BMI korrelyatsiyasi"
                subtitle="Har bir bemorning yoshi va BMI ko'rsatkichi o'rtasidagi bog'liqlik"
                badge="SCATTER"
              />
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="age" name="Yosh" unit=" yil" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                    <YAxis type="number" dataKey="bmi" name="BMI" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                    <ReferenceLine y={18.5} stroke={COLORS.success} strokeDasharray="4 4" label={{ value: "Min norma", fill: COLORS.success, fontSize: 10 }} />
                    <ReferenceLine y={25} stroke={COLORS.warning} strokeDasharray="4 4" label={{ value: "Ortiqcha", fill: COLORS.warning, fontSize: 10 }} />
                    <ReferenceLine y={30} stroke={COLORS.error} strokeDasharray="4 4" label={{ value: "Semizlik", fill: COLORS.error, fontSize: 10 }} />
                    <ReTooltip {...CustomTooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Bemorlar" data={scatterData} fill={COLORS.primary} opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* Footer */}
      <Box py={2} textAlign="center" mt={1}>
        <Typography variant="caption" color="text.secondary">
          🔬 Shaxsiy Ilmiy-Statistik Tahlil • Faqat siz kiritgan {totalCount} ta bemor • {new Date().toLocaleDateString("uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}
