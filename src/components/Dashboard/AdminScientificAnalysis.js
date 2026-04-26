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

const getTooltipStyle = (isDark) => ({
  contentStyle: {
    borderRadius: "12px",
    border: "none",
    boxShadow: isDark ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    background: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f8fafc" : "#1e293b",
    fontSize: "13px",
    padding: "10px 14px",
    borderLeft: isDark ? "4px solid #38bdf8" : "4px solid #0ea5e9",
  },
  itemStyle: {
    color: isDark ? "#f1f5f9" : "#334155",
    padding: "2px 0",
  },
  labelStyle: { 
    color: isDark ? "#38bdf8" : "#0ea5e9", 
    fontWeight: 800,
    marginBottom: "4px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  cursor: { stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)", strokeWidth: 2 }
});

export default function AdminScientificAnalysis({ data = [], loading, totalCount = 0, filters }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const customTooltip = useMemo(() => getTooltipStyle(isDark), [isDark]);

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

  // ---- Correlation: Height vs Chest ----
  const heightChestData = useMemo(() => 
    data
      .filter(d => d.height && d.chest && !isNaN(Number(d.height)) && !isNaN(Number(d.chest)))
      .map(d => ({ height: Number(d.height), chest: Number(d.chest) })),
    [data]);

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
      <Box mb={4} p={3} sx={{ borderRadius: 3, background: `linear-gradient(135deg, ${COLORS.primary}11, ${COLORS.teal}08)`, border: `1px solid ${COLORS.primary}22` }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <BiotechOutlined sx={{ fontSize: 40, color: COLORS.primary }} />
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ background: `linear-gradient(90deg,${COLORS.primary},${COLORS.secondary},${COLORS.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
                Ilmiy-Antropometrik Tahlil
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Murakkab statistik modellar va korrelyatsion tahlil natijalari
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            {filters && Object.values(filters).some(v => v !== "" && v !== 0 && v !== 100 && v !== 10 && v !== 50) && (
              <Chip label="Filtrlangan" color="info" size="small" sx={{ fontWeight: 800 }} />
            )}
            <Chip label="PRO ANALYTICS" size="small" sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 900, px: 1 }} />
          </Box>
        </Box>
      </Box>

      {/* ===== ROW 1: BMI Histogram + Z-score ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <GlassCard>
            <SectionTitle
              icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
              title="BMI Gistogrammasi"
              subtitle="Bemorlarning BMI qiymatlari bo'yicha statistik taqsimoti"
              badge={`n=${data.length}`}
            />
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bmiHistogram} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <ReferenceLine x="18.5-22" stroke={COLORS.success} strokeDasharray="4 4" />
                  <ReTooltip {...customTooltip} />
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
              title="Z-score (SD) Analizi"
              subtitle="Populyatsiya normalidan chetlanish ko'rsatkichi"
            />
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zScoreData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                  <ReTooltip {...customTooltip} />
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
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              icon={<AutoGraphOutlined sx={{ color: COLORS.teal }} />}
              title="Statistik Persentillar"
              subtitle="Guruh ichidagi o'lchovlar kvantillari"
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Persentil", "BMI", "Bo'y", "Vazn"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.primary, borderBottom: `2px solid ${COLORS.primary}22` }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {percentileTable.map(row => (
                    <TableRow key={row.p} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Chip label={row.p} size="small" sx={{ bgcolor: `${COLORS.primary}15`, color: COLORS.primary, fontWeight: 800, fontSize: "0.7rem", height: 20 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{row.bmi}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.height} sm</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.weight} kg</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2} p={1.5} sx={{ borderRadius: 2, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    * P50 ko'rsatkichi guruh uchun mediana hisoblanadi.
                </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.error }} />}
              title="Sog'liq Xavfi Guruhlari"
              subtitle="BMI asosida klinik xavf darajasini baholash"
            />
            <Stack spacing={3} mt={1}>
              {riskGroups.map((g) => (
                <Box key={g.name}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                        <Typography variant="body2" fontWeight={800}>{g.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{g.count} ta bemor</Typography>
                    </Box>
                    <Box textAlign="right">
                      <Chip label={g.desc} size="small" sx={{ fontSize: "0.65rem", bgcolor: `${g.color}18`, color: g.color, fontWeight: 700, mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={900} sx={{ color: g.color, lineHeight: 1 }}>{g.pct}%</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={g.pct}
                    sx={{
                      height: 12, borderRadius: 6,
                      bgcolor: `${g.color}12`,
                      "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 6 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 3: Correlations ===== */}
      <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<AutoGraphOutlined sx={{ color: COLORS.warning }} />}
                title="Yosh — BMI Korrelyatsiyasi"
                subtitle="Yosh o'tishi bilan tana vazni indeksi o'zgarishi"
                badge="CORRELATION"
              />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="age" name="Yosh" unit=" yil" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                    <YAxis type="number" dataKey="bmi" name="BMI" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                    <ReferenceLine y={18.5} stroke={COLORS.success} strokeDasharray="4 4" />
                    <ReferenceLine y={25} stroke={COLORS.warning} strokeDasharray="4 4" />
                    <ReTooltip {...customTooltip} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Bemorlar" data={scatterData} fill={COLORS.primary} opacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<BiotechOutlined sx={{ color: COLORS.info }} />}
                title="Bo'y — Ko'krak qafasi"
                subtitle="Antropometrik o'lchovlar o'rtasidagi bog'liqlik"
                badge="MORPHOLOGY"
              />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="height" name="Bo'y" unit=" sm" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                    <YAxis type="number" dataKey="chest" name="Ko'krak" unit=" sm" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} />
                    <ReTooltip {...customTooltip} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="O'lchovlar" data={heightChestData} fill={COLORS.teal} opacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
      </Grid>

      {/* Footer */}
      <Box py={3} textAlign="center" mt={2} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 600 }}>
          🔬 MORPHOCHECK SCIENTIFIC ENGINE v2.0 • {totalCount} ta ma'lumot tahlili • {new Date().toLocaleDateString("uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}
