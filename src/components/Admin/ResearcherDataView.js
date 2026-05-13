import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Button,
  TextField,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Tabs,
  Tab,
  MenuItem,
  LinearProgress,
} from "@mui/material";
import {
  Download,
  Description,
  Edit,
  Delete,
  DeleteForever,
  Refresh,
  Visibility,
  Close,
  Person,
  Place,
  Science,
  FitnessCenter,
  RestoreFromTrash,
  Add,
  CheckCircle,
  InfoOutlined,
  Lock,
} from "@mui/icons-material";
import ResearcherForm from "../Research/ResearcherForm";
import { ResearchApi } from "../../services/api";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import AdvancedResearchFilter from "../Research/AdvancedResearchFilter";
import { researcherT } from "../../utils/researcherI18n";

/* ════════════════════════════════════════════════════
   Utility Components
════════════════════════════════════════════════════ */
const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === "dark" ? "rgba(30,30,40,0.7)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: 4,
      border: "1px solid",
      borderColor: (theme) =>
        theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <Box display="flex" alignItems="center" gap={1} mb={2} mt={3}>
    <Icon color="primary" sx={{ fontSize: 20 }} />
    <Typography variant="subtitle1" fontWeight={700} color="primary">
      {title}
    </Typography>
    <Divider sx={{ flex: 1 }} />
  </Box>
);

const RESEARCH_METRICS = [
  { key: "chest_standing_height", label: "Bo'y (tik)", unit: "sm" },
  { key: "weight", label: "Vazn", unit: "kg" },
  { key: "bmi", label: "BMI", unit: "kg/m2" },
  { key: "chest_circumference_pause", label: "Ko'krak aylanasi", unit: "sm" },
  { key: "waist_circumference", label: "Bel aylanasi", unit: "sm" },
  { key: "head_circumference", label: "Bosh aylanasi", unit: "sm" },
  { key: "thigh_circumference", label: "Son aylanasi", unit: "sm" },
  { key: "calf_circumference", label: "Boldir aylanasi", unit: "sm" },
  { key: "dynamometry", label: "Dinamometriya", unit: "kg" },
];

const ANALYSIS_METRICS = RESEARCH_METRICS.slice(0, 6);

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatNumber = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : "-");

const getAgeYears = (record) => {
  if (!record.birth_date) return null;
  const birthDate = new Date(record.birth_date);
  const examDate = record.examination_date ? new Date(record.examination_date) : new Date();
  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(examDate.getTime())) return null;
  const years = (examDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
  return Number.isFinite(years) && years >= 0 ? years : null;
};

const getMetricValue = (record, key) => {
  if (key === "bmi") {
    const weight = toNumber(record.weight);
    const height = toNumber(record.chest_standing_height);
    return weight && height ? weight / (height / 100) ** 2 : null;
  }
  if (key === "age") return getAgeYears(record);
  return toNumber(record[key]);
};

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1),
  );
};

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const median = (values) => percentile(values, 0.5);

const logGamma = (z) => {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406,
    12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  let x = 0.9999999999998099;
  const shifted = z - 1;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (shifted + index + 1);
  });
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
};

const betaContinuedFraction = (x, a, b) => {
  const maxIterations = 100;
  const eps = 1e-8;
  const fpmin = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
};

const regularizedBeta = (x, a, b) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
};

const tTestPValue = (t, df) => {
  if (!Number.isFinite(t) || df <= 0) return null;
  const x = df / (df + t * t);
  return Math.min(1, Math.max(0, regularizedBeta(x, df / 2, 0.5)));
};

const fTestPValue = (f, df1, df2) => {
  if (!Number.isFinite(f) || f < 0 || df1 <= 0 || df2 <= 0) return null;
  const x = (df1 * f) / (df1 * f + df2);
  return Math.min(1, Math.max(0, 1 - regularizedBeta(x, df1 / 2, df2 / 2)));
};

const pearson = (pairs) => {
  if (pairs.length < 3) return null;
  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const mx = mean(xs);
  const my = mean(ys);
  const numerator = pairs.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0);
  const sx = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0));
  const sy = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0));
  if (!sx || !sy) return null;
  return numerator / (sx * sy);
};

const normalizeGender = (gender = "") => {
  const value = String(gender).toLowerCase();
  if (value.includes("girl") || value.includes("ayol") || value.includes("qiz")) return "Qiz/Ayol";
  if (
    value.includes("boy") ||
    value.includes("erkak") ||
    value.includes("o'g") ||
    value.includes("og")
  ) {
    return "O'g'il/Erkak";
  }
  return null;
};

const buildDescriptiveStats = (rows) =>
  RESEARCH_METRICS.map((metric) => {
    const values = rows.map((row) => getMetricValue(row, metric.key)).filter(Number.isFinite);
    if (!values.length) return { ...metric, n: 0 };
    const avg = mean(values);
    const sd = standardDeviation(values);
    return {
      ...metric,
      n: values.length,
      mean: avg,
      sd,
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      p5: percentile(values, 0.05),
      p25: percentile(values, 0.25),
      p75: percentile(values, 0.75),
      p95: percentile(values, 0.95),
      zLow: sd ? values.filter((value) => (value - avg) / sd < -2).length : 0,
      zNormal: sd
        ? values.filter((value) => Math.abs((value - avg) / sd) <= 2).length
        : values.length,
      zHigh: sd ? values.filter((value) => (value - avg) / sd > 2).length : 0,
    };
  });

const compareByGender = (rows) =>
  ANALYSIS_METRICS.map((metric) => {
    const groups = rows.reduce(
      (acc, row) => {
        const gender = normalizeGender(row.gender);
        const value = getMetricValue(row, metric.key);
        if (gender && Number.isFinite(value)) acc[gender].push(value);
        return acc;
      },
      { "O'g'il/Erkak": [], "Qiz/Ayol": [] },
    );
    const male = groups["O'g'il/Erkak"];
    const female = groups["Qiz/Ayol"];
    if (male.length < 2 || female.length < 2)
      return { ...metric, maleN: male.length, femaleN: female.length };
    const m1 = mean(male);
    const m2 = mean(female);
    const sd1 = standardDeviation(male);
    const sd2 = standardDeviation(female);
    const pooled = Math.sqrt(
      ((male.length - 1) * sd1 ** 2 + (female.length - 1) * sd2 ** 2) /
        (male.length + female.length - 2),
    );
    const se = Math.sqrt(sd1 ** 2 / male.length + sd2 ** 2 / female.length);
    const t = se ? (m1 - m2) / se : null;
    const df = male.length + female.length - 2;
    return {
      ...metric,
      maleN: male.length,
      femaleN: female.length,
      maleMean: m1,
      femaleMean: m2,
      diff: m1 - m2,
      p: tTestPValue(Math.abs(t), df),
      effect: pooled ? (m1 - m2) / pooled : null,
    };
  });

const compareByRegion = (rows, metricKey = "bmi") => {
  const groups = rows.reduce((acc, row) => {
    const region =
      (row.settlement || row.birth_place || "Noma'lum").toString().trim() || "Noma'lum";
    const value = getMetricValue(row, metricKey);
    if (Number.isFinite(value)) {
      if (!acc[region]) acc[region] = [];
      acc[region].push(value);
    }
    return acc;
  }, {});
  const eligible = Object.entries(groups)
    .filter(([, values]) => values.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);
  const allValues = eligible.flatMap(([, values]) => values);
  if (eligible.length < 2 || allValues.length < 4)
    return { groups: eligible, dfBetween: 0, dfWithin: 0 };
  const grandMean = mean(allValues);
  const ssBetween = eligible.reduce(
    (sum, [, values]) => sum + values.length * (mean(values) - grandMean) ** 2,
    0,
  );
  const ssWithin = eligible.reduce((sum, [, values]) => {
    const avg = mean(values);
    return sum + values.reduce((inner, value) => inner + (value - avg) ** 2, 0);
  }, 0);
  const dfBetween = eligible.length - 1;
  const dfWithin = allValues.length - eligible.length;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const f = msWithin ? msBetween / msWithin : null;
  return {
    groups: eligible.map(([name, values]) => ({
      name,
      n: values.length,
      mean: mean(values),
      sd: standardDeviation(values),
    })),
    f,
    p: fTestPValue(f, dfBetween, dfWithin),
    etaSquared: ssBetween / (ssBetween + ssWithin),
    dfBetween,
    dfWithin,
  };
};

const buildCorrelationMatrix = (rows) =>
  ANALYSIS_METRICS.map((metricA) => ({
    ...metricA,
    values: ANALYSIS_METRICS.map((metricB) => {
      if (metricA.key === metricB.key) return 1;
      const pairs = rows
        .map((row) => [getMetricValue(row, metricA.key), getMetricValue(row, metricB.key)])
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
      return pearson(pairs);
    }),
  }));

const buildRegression = (rows) => {
  const pairs = rows
    .map((row) => [getMetricValue(row, "chest_standing_height"), getMetricValue(row, "weight")])
    .filter(([height, weight]) => Number.isFinite(height) && Number.isFinite(weight));
  if (pairs.length < 3) return { n: pairs.length };
  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const mx = mean(xs);
  const my = mean(ys);
  const ssx = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
  const slope = pairs.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0) / ssx;
  const intercept = my - slope * mx;
  const r = pearson(pairs);
  const t =
    r && Math.abs(r) < 1 ? Math.abs(r) * Math.sqrt((pairs.length - 2) / (1 - r ** 2)) : null;
  return {
    n: pairs.length,
    slope,
    intercept,
    r,
    r2: r ** 2,
    p: tTestPValue(t, pairs.length - 2),
    equation: `Vazn = ${formatNumber(intercept)} + ${formatNumber(slope, 3)} x Bo'y`,
  };
};

const buildResearchStats = (rows) => {
  const descriptive = buildDescriptiveStats(rows);
  const bmi = descriptive.find((item) => item.key === "bmi");
  return {
    count: rows.length,
    descriptive,
    zScore: bmi
      ? [
          { label: "Z < -2", count: bmi.zLow || 0 },
          { label: "-2 <= Z <= 2", count: bmi.zNormal || 0 },
          { label: "Z > 2", count: bmi.zHigh || 0 },
        ]
      : [],
    gender: compareByGender(rows),
    region: compareByRegion(rows),
    correlation: buildCorrelationMatrix(rows),
    regression: buildRegression(rows),
  };
};

const getPLabel = (p) => {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.001) return "<0.001";
  return p.toFixed(3);
};

const getSignificanceChip = (p) => {
  if (!Number.isFinite(p)) return { label: "N/A", color: "default" };
  if (p < 0.001) return { label: "p < 0.001", color: "error" };
  if (p < 0.01) return { label: "p < 0.01", color: "warning" };
  if (p < 0.05) return { label: "p < 0.05", color: "success" };
  return { label: "p >= 0.05", color: "default" };
};

const getCorrelationColor = (value) => {
  if (!Number.isFinite(value)) return "transparent";
  const abs = Math.abs(value);
  if (abs >= 0.7) return value > 0 ? "rgba(25,118,210,0.22)" : "rgba(211,47,47,0.18)";
  if (abs >= 0.4) return value > 0 ? "rgba(46,125,50,0.18)" : "rgba(245,124,0,0.18)";
  if (abs >= 0.2) return "rgba(2,136,209,0.08)";
  return "transparent";
};

const StatCard = ({ label, value, sub }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      height: "100%",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
      {value}
    </Typography>
    {sub && (
      <Typography variant="caption" color="text.secondary">
        {sub}
      </Typography>
    )}
  </Paper>
);

const ResearchStatisticsPanel = ({ rows }) => {
  const stats = useMemo(() => buildResearchStats(rows), [rows]);
  const mainMetric = stats.descriptive.find((item) => item.key === "bmi");
  const regressionChip = getSignificanceChip(stats.regression.p);
  const anovaChip = getSignificanceChip(stats.region.p);
  const maxZ = Math.max(...stats.zScore.map((item) => item.count), 1);

  return (
    <GlassPaper sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        <Box display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Science color="primary" />
              <Typography variant="h6" fontWeight={900}>
                Avtomatik statistik tahlil
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Natijalar joriy filtrlangan jadval bo'yicha real vaqt rejimida hisoblanadi.
            </Typography>
          </Box>
          <Chip label={`N = ${stats.count}`} color="primary" sx={{ fontWeight: 800 }} />
        </Box>

        {stats.count < 3 && (
          <Alert severity="info">
            Ishonchli statistik testlar uchun kamida 3 ta yozuv kerak. Yozuvlar ko'payganda p-value,
            effect size, ANOVA va regressiya avtomatik to'liq chiqadi.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Mean +/- SD"
              value={
                mainMetric?.n
                  ? `${formatNumber(mainMetric.mean)} +/- ${formatNumber(mainMetric.sd)}`
                  : "—"
              }
              sub="BMI bo'yicha"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Median"
              value={mainMetric?.n ? formatNumber(mainMetric.median) : "—"}
              sub="50-percentile"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Min-Max"
              value={
                mainMetric?.n
                  ? `${formatNumber(mainMetric.min)} - ${formatNumber(mainMetric.max)}`
                  : "—"
              }
              sub="BMI diapazoni"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Regression R2"
              value={
                Number.isFinite(stats.regression.r2) ? formatNumber(stats.regression.r2, 3) : "—"
              }
              sub="Vazn ~ Bo'y"
            />
          </Grid>
        </Grid>

        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Science color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={800}>
              Descriptive statistics
            </Typography>
          </Box>
          <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ko'rsatkich</TableCell>
                  <TableCell align="right">N</TableCell>
                  <TableCell align="right">Mean +/- SD</TableCell>
                  <TableCell align="right">Median</TableCell>
                  <TableCell align="right">Min-Max</TableCell>
                  <TableCell align="right">P5 / P25 / P75 / P95</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.descriptive.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.n}</TableCell>
                    <TableCell align="right">
                      {item.n ? `${formatNumber(item.mean)} +/- ${formatNumber(item.sd)}` : "—"}
                    </TableCell>
                    <TableCell align="right">{item.n ? formatNumber(item.median) : "—"}</TableCell>
                    <TableCell align="right">
                      {item.n ? `${formatNumber(item.min)} - ${formatNumber(item.max)}` : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {item.n
                        ? `${formatNumber(item.p5)} / ${formatNumber(item.p25)} / ${formatNumber(item.p75)} / ${formatNumber(item.p95)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight={800} mb={1}>
                Z-score distribution (BMI)
              </Typography>
              <Stack spacing={1.25}>
                {stats.zScore.map((item) => (
                  <Box key={item.label}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption">{item.label}</Typography>
                      <Typography variant="caption" fontWeight={800}>
                        {item.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / maxZ) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Regression analysis
                </Typography>
                <Chip size="small" label={regressionChip.label} color={regressionChip.color} />
              </Box>
              <Typography variant="body2" fontWeight={700}>
                {stats.regression.equation || "Yetarli ma'lumot yo'q"}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                r = {formatNumber(stats.regression.r, 3)}; R2 ={" "}
                {formatNumber(stats.regression.r2, 3)}; p = {getPLabel(stats.regression.p)}; n ={" "}
                {stats.regression.n || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2" fontWeight={800}>
                  ANOVA: regional difference
                </Typography>
                <Chip size="small" label={anovaChip.label} color={anovaChip.color} />
              </Box>
              <Typography variant="body2" fontWeight={700}>
                BMI hududlar bo'yicha
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                F({stats.region.dfBetween || 0}, {stats.region.dfWithin || 0}) ={" "}
                {formatNumber(stats.region.f, 3)}; p = {getPLabel(stats.region.p)}; eta2 ={" "}
                {formatNumber(stats.region.etaSquared, 3)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <FitnessCenter color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={800}>
                Sex difference
              </Typography>
            </Box>
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ko'rsatkich</TableCell>
                    <TableCell align="right">O'g'il/Erkak</TableCell>
                    <TableCell align="right">Qiz/Ayol</TableCell>
                    <TableCell align="right">p-value</TableCell>
                    <TableCell align="right">Effect size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.gender.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell align="right">
                        {item.maleN >= 2
                          ? `${formatNumber(item.maleMean)} (n=${item.maleN})`
                          : `n=${item.maleN}`}
                      </TableCell>
                      <TableCell align="right">
                        {item.femaleN >= 2
                          ? `${formatNumber(item.femaleMean)} (n=${item.femaleN})`
                          : `n=${item.femaleN}`}
                      </TableCell>
                      <TableCell align="right">{getPLabel(item.p)}</TableCell>
                      <TableCell align="right">{formatNumber(item.effect, 3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={800} mb={1.5}>
              Regional difference
            </Typography>
            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hudud</TableCell>
                    <TableCell align="right">N</TableCell>
                    <TableCell align="right">BMI mean +/- SD</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.region.groups.length ? (
                    stats.region.groups.map((group) => (
                      <TableRow key={group.name}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell align="right">{group.n}</TableCell>
                        <TableCell align="right">
                          {formatNumber(group.mean)} +/- {formatNumber(group.sd)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        Yetarli hududiy guruh yo'q
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <Box>
          <Typography variant="subtitle1" fontWeight={800} mb={1.5}>
            Correlation matrix (Pearson r)
          </Typography>
          <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  {ANALYSIS_METRICS.map((metric) => (
                    <TableCell key={metric.key} align="center" sx={{ fontWeight: 800 }}>
                      {metric.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.correlation.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell sx={{ fontWeight: 800 }}>{row.label}</TableCell>
                    {row.values.map((value, index) => (
                      <TableCell
                        key={`${row.key}-${ANALYSIS_METRICS[index].key}`}
                        align="center"
                        sx={{
                          bgcolor: getCorrelationColor(value),
                          fontWeight: Math.abs(value || 0) > 0.5 ? 800 : 500,
                        }}
                      >
                        {formatNumber(value, 2)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </GlassPaper>
  );
};

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
const ResearcherDataView = ({ isSuperAdmin = true }) => {
  const { lang } = useLanguage();
  const t = (key) => researcherT(lang, key);
  const [data, setData] = useState([]);
  const [deletedData, setDeletedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);

  const [activeTab, setActiveTab] = useState(0); // 0: Active, 1: Deleted
  const [filter, setFilter] = useState({
    search: "",
    full_name: "",
    school_name: "",
    settlement: "",
    feeding_type: "",
    parents_marriage: "",
    weight_min: "",
    weight_max: "",
    height_min: "",
    height_max: "",
    date_from: "",
    date_to: "",
  });
  const [detailRecord, setDetailRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [checked, setChecked] = useState(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  const toggleAll = useCallback(() => {
    const rows = activeTab === 0 ? data : deletedData;
    const next = new Set(checked);
    const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id));
    if (allChecked) rows.forEach((r) => next.delete(r.id));
    else rows.forEach((r) => next.add(r.id));
    setChecked(next);
  }, [checked, data, deletedData, activeTab]);

  const toggleOne = useCallback(
    (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setChecked(next);
    },
    [checked],
  );

  const onDeleteSelected = useCallback(() => {
    if (checked.size > 0) setDeleteConfirmOpen(true);
  }, [checked.size]);

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.code === "Delete" || e.key === "Backspace") {
        const el = document.activeElement;
        const tag = el.tagName.toUpperCase();
        const isTextInput =
          (tag === "INPUT" &&
            !["checkbox", "radio", "range", "button", "submit"].includes(el.type)) ||
          tag === "TEXTAREA" ||
          el.isContentEditable;

        if (isTextInput) return;

        if (checked.size > 0) {
          onDeleteSelected();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checked.size, onDeleteSelected]);

  useEffect(() => {
    if (activeTab === 0) fetchData();
    else if (activeTab === 1) fetchDeletedData();
  }, [activeTab]);

  const fetchData = async (params = filter) => {
    setLoading(true);
    try {
      const result = await ResearchApi.list(params);
      setData(result);
    } catch (err) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedData = async () => {
    setDeletedLoading(true);
    try {
      const result = await ResearchApi.deletedList();
      setDeletedData(result);
    } catch (err) {
      toast.error("O'chirilgan yozuvlarni yuklashda xatolik");
    } finally {
      setDeletedLoading(false);
    }
  };

  const handleDelete = async (idOrIds, type) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (ids.length === 0) return;

    setDeleteConfirmLoading(true);
    try {
      if (type === "hard") {
        for (const id of ids) await ResearchApi.hardDelete(id);
        toast.success(ids.length > 1 ? "Ma'lumotlar butunlay o'chirildi" : "Butunlay o'chirildi");
      } else if (type === "restore") {
        for (const id of ids) await ResearchApi.restore(id);
        toast.success(ids.length > 1 ? "Ma'lumotlar tiklandi" : "Tiklandi");
        fetchDeletedData();
      } else {
        for (const id of ids) await ResearchApi.softDelete(id);
        toast.success(ids.length > 1 ? "Ma'lumotlar savatga yuborildi" : "O'chirildi");
      }

      setChecked(new Set());
      setDeleteConfirmOpen(false);
      fetchData();
      if (activeTab === 1) fetchDeletedData();
      if (detailRecord && ids.includes(detailRecord.id)) setDetailRecord(null);
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const { id, created_at, created_by_id, is_deleted, deleted_at, ...payload } = editForm;
      await ResearchApi.update(id, payload);
      toast.success("Ma'lumot yangilandi");
      setEditRecord(null);
      fetchData();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportXlsx = async () => {
    try {
      const blob = await ResearchApi.exportXlsx();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "research_data.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleDownloadDocx = (id, lang = "ru") => {
    ResearchApi.downloadDocx(id, lang);
  };

  /* ── Table Components ── */
  const renderTable = (rows, isLoading, isDeletedView = false) => (
    <TableContainer component={GlassPaper}>
      <Table size="small">
        <TableHead
          sx={{ background: isDeletedView ? "rgba(244,67,54,0.06)" : "rgba(0,123,255,0.06)" }}
        >
          <TableRow>
            <TableCell sx={{ width: 40, p: 1 }}>
              <IconButton size="small" onClick={toggleAll} color="primary">
                {rows.length > 0 && rows.every((r) => checked.has(r.id)) ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <InfoOutlined fontSize="small" />
                )}
              </IconButton>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t("fullName")}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t("schoolKindergarten")}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t("exam")}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t("heightWeight")}</TableCell>
            {isDeletedView && (
              <TableCell sx={{ fontWeight: 700, color: "error.main" }}>
                {t("deletedDate")}
              </TableCell>
            )}
            <TableCell sx={{ fontWeight: 700 }} align="right">
              {t("actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={isDeletedView ? 7 : 6} align="center" sx={{ py: 6 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isDeletedView ? 7 : 6}
                align="center"
                sx={{ py: 6, color: "text.secondary" }}
              >
                {t("noData")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  cursor: "pointer",
                  "&:hover": { background: "rgba(0,123,255,0.04)" },
                  bgcolor: checked.has(row.id) ? "rgba(0,123,255,0.08)" : "inherit",
                }}
                onClick={() => setDetailRecord(row)}
              >
                <TableCell
                  sx={{ p: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOne(row.id);
                  }}
                >
                  <IconButton size="small" color={checked.has(row.id) ? "primary" : "default"}>
                    {checked.has(row.id) ? (
                      <CheckCircle fontSize="small" />
                    ) : (
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          border: "2px solid",
                          borderColor: "divider",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {idx + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "primary.light" }}>
                      {(row.full_name || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                      {row.full_name || "—"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.school_name || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.settlement || ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.examination_date || "—"}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {row.chest_standing_height ? `${row.chest_standing_height} sm` : "—"} /
                    {row.weight ? ` ${row.weight} kg` : " —"}
                  </Typography>
                </TableCell>
                {isDeletedView && (
                  <TableCell>
                    <Typography variant="caption" color="error">
                      {row.deleted_at ? new Date(row.deleted_at).toLocaleDateString("uz-UZ") : "—"}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Batafsil">
                      <IconButton size="small" color="info" onClick={() => setDetailRecord(row)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!isDeletedView ? (
                      <>
                        <Tooltip title="Tahrirlash">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setEditRecord(row);
                              setEditForm({ ...row });
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Soft o'chirish">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => {
                              setChecked(new Set([row.id]));
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isSuperAdmin && (
                          <Tooltip title="Butunlay o'chirish">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setChecked(new Set([row.id]));
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <DeleteForever fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <>
                        <Tooltip title="Tiklash">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDelete(row.id, "restore")}
                          >
                            <Refresh fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Butunlay o'chirish">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(row.id, "hard")}
                          >
                            <DeleteForever fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="DOCX (RU)">
                      <IconButton size="small" onClick={() => handleDownloadDocx(row.id, "ru")}>
                        <Description fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="DOCX (UZ)">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleDownloadDocx(row.id, "uz")}
                      >
                        <Description fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={900}>
          {t("researcherDataTitle")}
        </Typography>
        <Stack direction="row" spacing={2}>
          {checked.size > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              O'chirish ({checked.size})
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setShowAdd(true)}
          >
            {t("addRecord")}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Download />}
            onClick={handleExportXlsx}
          >
            XLSX
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => (activeTab === 0 ? fetchData() : fetchDeletedData())}
          >
            {t("refresh")}
          </Button>
        </Stack>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2, borderBottom: "1px solid rgba(0,0,0,0.1)" }}
      >
        <Tab label={t("dataList")} sx={{ textTransform: "none", fontWeight: 600 }} />
        {isSuperAdmin && (
          <Tab
            label={t("deleted")}
            icon={<RestoreFromTrash />}
            iconPosition="start"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        )}
      </Tabs>

      {activeTab === 0 && (
        <Stack spacing={3}>
          <AdvancedResearchFilter filter={filter} setFilter={setFilter} onSearch={fetchData} />

          <ResearchStatisticsPanel rows={data} />

          {renderTable(data, loading)}
        </Stack>
      )}

      {activeTab === 1 && renderTable(deletedData, deletedLoading, true)}

      {/* ── Detail Modal ── */}
      <DetailModal
        record={detailRecord}
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        onEdit={(r) => {
          setDetailRecord(null);
          setEditRecord(r);
          setEditForm({ ...r });
        }}
        onDelete={(id, type) => {
          handleDelete(id, type);
          setDetailRecord(null);
        }}
        isSuperAdmin={isSuperAdmin}
        handleDownloadDocx={handleDownloadDocx}
      />

      {/* ── Edit Modal ── */}
      <Dialog
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Tahrirlash
          <IconButton
            onClick={() => setEditRecord(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Section I: Demographic */}
          <SectionTitle icon={Person} title="I. Pasport / Umumiy Ma'lumotlar" />
          <Grid container spacing={2} pt={1}>
            {[
              ["F.I.SH", "full_name", "text"],
              ["Maktab / Bog'cha", "school_name", "text"],
              ["Aholi punkti", "settlement", "text"],
              ["Tug'ilgan joyi", "birth_place", "text"],
              ["Tug'ilgan sana", "birth_date", "date"],
              ["Ota millati", "father_nationality", "text"],
              ["Ona millati", "mother_nationality", "text"],
              ["Yashashni boshlagan", "living_since", "text"],
              ["Muassasaga qabul", "enrolled_date", "text"],
              ["Maishiy sharoit", "living_conditions", "text"],
              ["Mehnat rejimi", "labor_regime", "text"],
              ["O'tkir kasalliklar", "past_illnesses", "text"],
              ["Farzandlar soni", "children_count", "number"],
              ["Nechanchi farzand", "child_order", "number"],
              [
                "Oziqlanish turi",
                "feeding_type",
                "select",
                [
                  {
                    value: "Tabiiy (естественном вскармливании)",
                    label: "Tabiiy (естественном вскармливании)",
                  },
                  {
                    value: "Sun'iy (искусственном вскармливании)",
                    label: "Sun'iy (искусственном вскармливании)",
                  },
                ],
              ],
              [
                "Ota-ona qarindoshligi",
                "parents_marriage",
                "select",
                [
                  {
                    value: "Yaqin qarindosh (близкородственный)",
                    label: "Yaqin qarindosh (близкородственный)",
                  },
                  {
                    value: "Uzoq qarindosh (дальнородственный)",
                    label: "Uzoq qarindosh (дальнородственный)",
                  },
                  {
                    value: "Qarindosh emas (неродственный)",
                    label: "Qarindosh emas (неродственный)",
                  },
                ],
              ],
              ["Ona sog'ligi", "mother_health_status", "text"],
              ["Tekshiruv sanasi", "examination_date", "date"],
            ].map(([label, key, type, options]) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={key === "feeding_type" || key === "parents_marriage" ? 6 : 4}
                key={key}
              >
                <TextField
                  select={type === "select"}
                  label={label}
                  fullWidth
                  size="small"
                  type={type === "select" ? undefined : type}
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                  InputLabelProps={
                    type === "date" || type === "select" ? { shrink: true } : undefined
                  }
                  sx={{ minWidth: type === "select" ? { xs: 120, sm: 200 } : "auto" }}
                >
                  {type === "select" &&
                    options?.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            ))}
          </Grid>

          {/* Section II: Lower Leg */}
          <SectionTitle icon={Place} title="II. Jismoniy Rivojlanish (Oyoqlar)" />
          <Grid container spacing={2} pt={1}>
            {[
              ["Spina iliaca", "lower_leg_spina_iliaca"],
              ["Symphysion", "lower_leg_symphysion"],
              ["Tibiale balandligi", "tibiale_height"],
              ["Chanoq kengligi", "pelvic_width"],
              ["Son uzunligi", "thigh_length"],
              ["Son aylanasi", "thigh_circumference"],
              ["Boldir uzunligi", "calf_length"],
              ["Boldir aylanasi", "calf_circumference"],
              ["Oyoq panja uzunligi", "foot_length"],
              ["Tishlar soni", "teeth_count"],
              ["Menstruatsiya", "menstruation_start", "text"],
            ].map(([label, key, type]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type={type || "number"}
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>

          {/* Section III: Skull */}
          <SectionTitle icon={Science} title="III. Bosh suyagi" />
          <Grid container spacing={2} pt={1}>
            {[
              ["Uzunasiga diametr", "skull_longitudinal"],
              ["Ko'ndalang diametr", "skull_transverse"],
              ["Bosh aylanasi", "head_circumference"],
              ["Peshona ko'ndalang", "forehead_transverse"],
              ["Bosh balandligi", "skull_height"],
              ["Asos uzunligi", "skull_base_length"],
              ["Asos kengligi", "skull_base_width"],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>

          {/* Section IV: Face */}
          <SectionTitle icon={Person} title="IV. Yuz o'lchamlari" />
          <Grid container spacing={2} pt={1}>
            {[
              ["Yanoq diametri", "face_bizygomatic"],
              ["Pastki jag' diametri", "face_bigonial"],
              ["Morfologik balandlik", "face_morphological_height"],
              ["Fizionomik balandlik", "face_physiognomic_height"],
              ["Burun balandligi", "nose_height"],
              ["Burun kengligi", "nose_width"],
              ["Tashqi ko'z kengligi", "outer_canthal_width"],
              ["Ichki ko'z kengligi", "inner_canthal_width"],
              ["Lab qalinligi", "lips_mucosa_height"],
              ["Og'iz kengligi", "mouth_width"],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>

          {/* Section V: Chest */}
          <SectionTitle icon={FitnessCenter} title="V. Ko'krak qafasi va gavda" />
          <Grid container spacing={2} pt={1}>
            {[
              ["Bo'y (tik)", "chest_standing_height"],
              ["Bo'y (o'tirgan)", "chest_sitting_height"],
              ["Vazn (kg)", "weight"],
              ["Tana uzunligi", "trunk_length"],
              ["Korpus uzunligi", "torso_length"],
              ["Ko'krak aylanasi (pauza)", "chest_circumference_pause"],
              ["Nafas olganda", "chest_circumference_inhale"],
              ["Nafas chiqarganda", "chest_circumference_exhale"],
              ["Bel aylanasi", "waist_circumference"],
              ["Qorin aylanasi", "abdomen_circumference"],
              ["Yuqori segment", "upper_segment_length"],
              ["Ko'ndalang diametr", "chest_transverse_diameter"],
              ["Old-orqa diametr", "chest_anteroposterior_diameter"],
              ["Ko'krak balandligi", "chest_height"],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>

          {/* Section VI: Arms and Fat */}
          <SectionTitle icon={FitnessCenter} title="VI. Qo'l va Yog' qatlami" />
          <Grid container spacing={2} pt={1}>
            {[
              ["Qo'l uzunligi", "arm_length"],
              ["Yelka uzunligi", "shoulder_length"],
              ["Yelka kengligi", "shoulder_width"],
              ["Yelka aylanasi (tinch)", "shoulder_circumference_rest"],
              ["Yelka aylanasi (tarang)", "shoulder_circumference_flexed"],
              ["Bilak uzunligi", "forearm_length"],
              ["Panja uzunligi", "hand_length"],
              ["Dinamometriya", "dynamometry"],
              ["Triseps yog'i", "fat_triceps"],
              ["Biseps yog'i", "fat_biceps"],
              ["Kurak osti yog'i", "fat_subscapular"],
              ["Yonbosh yog'i", "fat_iliac"],
              ["Tizza orqa yog'i", "fat_popliteal"],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditRecord(null)}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add New Record Modal ── */}
      <Dialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {t("addRecord")}
          <IconButton onClick={() => setShowAdd(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ResearcherForm
            onSuccess={() => {
              setShowAdd(false);
              fetchData();
            }}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Siz <strong>{checked.size}</strong> ta yozuvni tanladingiz.{" "}
            {activeTab === 1
              ? "Bularni butunlay o'chirib tashlamoqchimisiz?"
              : "Haqiqatan ham o'chirmoqchimisiz?"}
          </Typography>
          {activeTab === 1 && (
            <Box
              sx={{
                bgcolor: "error.lighter",
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "error.light",
              }}
            >
              <Typography
                variant="caption"
                color="error.dark"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Lock fontSize="small" /> Bu amalni qaytarib bo'lmaydi!
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDelete(Array.from(checked), activeTab === 1 ? "hard" : "soft")}
            disabled={deleteConfirmLoading}
          >
            {deleteConfirmLoading ? <CircularProgress size={20} color="inherit" /> : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DetailModal = ({
  record,
  open,
  onClose,
  onEdit,
  onDelete,
  isSuperAdmin,
  handleDownloadDocx,
}) => {
  if (!record) return null;

  const Section = ({ title, Icon, fields }) => (
    <>
      <SectionTitle icon={Icon} title={title} />
      <Grid container spacing={2}>
        {fields.map(([label, key]) =>
          record[key] !== null && record[key] !== undefined && record[key] !== "" ? (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: "rgba(0,123,255,0.04)",
                  border: "1px solid rgba(0,123,255,0.08)",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {record[key]}
                </Typography>
              </Box>
            </Grid>
          ) : null,
        )}
      </Grid>
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {record.full_name || "Noma'lum"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {record.id} | Sana: {record.examination_date || "-"}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Section
          title="I. Pasport / Umumiy Ma'lumotlar"
          Icon={Person}
          fields={[
            ["F.I.SH", "full_name"],
            ["Maktab / Bog'cha", "school_name"],
            ["Aholi punkti", "settlement"],
            ["Tug'ilgan joyi", "birth_place"],
            ["Tug'ilgan sana", "birth_date"],
            ["Ota millati", "father_nationality"],
            ["Ona millati", "mother_nationality"],
            ["Yashashni boshlagan", "living_since"],
            ["Muassasaga qabul", "enrolled_date"],
            ["Maishiy sharoit", "living_conditions"],
            ["Mehnat rejimi", "labor_regime"],
            ["O'tkir kasalliklar", "past_illnesses"],
            ["Farzandlar soni", "children_count"],
            ["Nechanchi farzand", "child_order"],
            ["Oziqlanish turi", "feeding_type"],
            ["Ota-ona qarindoshligi", "parents_marriage"],
            ["Ona sog'ligi", "mother_health_status"],
            ["Tekshiruv sanasi", "examination_date"],
          ]}
        />
        <Section
          title="II. Jismoniy Rivojlanish (Oyoqlar)"
          Icon={Place}
          fields={[
            ["Spina iliaca", "lower_leg_spina_iliaca"],
            ["Symphysion", "lower_leg_symphysion"],
            ["Tibiale balandligi", "tibiale_height"],
            ["Chanoq kengligi", "pelvic_width"],
            ["Son uzunligi", "thigh_length"],
            ["Son aylanasi", "thigh_circumference"],
            ["Boldir uzunligi", "calf_length"],
            ["Boldir aylanasi", "calf_circumference"],
            ["Oyoq panja uzunligi", "foot_length"],
            ["Tishlar soni", "teeth_count"],
            ["Menstruatsiya", "menstruation_start"],
          ]}
        />
        <Section
          title="III. Bosh suyagi"
          Icon={Science}
          fields={[
            ["Uzunasiga diametr", "skull_longitudinal"],
            ["Ko'ndalang diametr", "skull_transverse"],
            ["Bosh aylanasi", "head_circumference"],
            ["Peshona ko'ndalang", "forehead_transverse"],
            ["Bosh balandligi", "skull_height"],
            ["Asos uzunligi", "skull_base_length"],
            ["Asos kengligi", "skull_base_width"],
          ]}
        />
        <Section
          title="IV. Yuz o'lchamlari"
          Icon={Person}
          fields={[
            ["Yanoq diametri", "face_bizygomatic"],
            ["Pastki jag' diametri", "face_bigonial"],
            ["Morfologik balandlik", "face_morphological_height"],
            ["Fizionomik balandlik", "face_physiognomic_height"],
            ["Burun balandligi", "nose_height"],
            ["Burun kengligi", "nose_width"],
            ["Tashqi ko'z kengligi", "outer_canthal_width"],
            ["Ichki ko'z kengligi", "inner_canthal_width"],
            ["Lab qalinligi", "lips_mucosa_height"],
            ["Og'iz kengligi", "mouth_width"],
          ]}
        />
        <Section
          title="V. Ko'krak qafasi va gavda"
          Icon={FitnessCenter}
          fields={[
            ["Bo'y (tik)", "chest_standing_height"],
            ["Bo'y (o'tirgan)", "chest_sitting_height"],
            ["Vazn (kg)", "weight"],
            ["Tana uzunligi", "trunk_length"],
            ["Korpus uzunligi", "torso_length"],
            ["Ko'krak aylanasi (pauza)", "chest_circumference_pause"],
            ["Nafas olganda", "chest_circumference_inhale"],
            ["Nafas chiqarganda", "chest_circumference_exhale"],
            ["Bel aylanasi", "waist_circumference"],
            ["Qorin aylanasi", "abdomen_circumference"],
            ["Yuqori segment", "upper_segment_length"],
            ["Ko'ndalang diametr", "chest_transverse_diameter"],
            ["Old-orqa diametr", "chest_anteroposterior_diameter"],
            ["Ko'krak balandligi", "chest_height"],
          ]}
        />
        <Section
          title="VI. Qo'l va Yog' qatlami"
          Icon={FitnessCenter}
          fields={[
            ["Qo'l uzunligi", "arm_length"],
            ["Yelka uzunligi", "shoulder_length"],
            ["Yelka kengligi", "shoulder_width"],
            ["Yelka aylanasi (tinch)", "shoulder_circumference_rest"],
            ["Yelka aylanasi (tarang)", "shoulder_circumference_flexed"],
            ["Bilak uzunligi", "forearm_length"],
            ["Panja uzunligi", "hand_length"],
            ["Dinamometriya", "dynamometry"],
            ["Triseps yog'i", "fat_triceps"],
            ["Biseps yog'i", "fat_biceps"],
            ["Kurak osti yog'i", "fat_subscapular"],
            ["Yonbosh yog'i", "fat_iliac"],
            ["Tizza orqa yog'i", "fat_popliteal"],
          ]}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => handleDownloadDocx(record.id, "uz")}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX (UZ)
          </Button>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => handleDownloadDocx(record.id, "ru")}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX (RU)
          </Button>
        </Stack>
        <Box flex={1} />
        <Button startIcon={<Edit />} variant="contained" onClick={() => onEdit(record)}>
          Tahrirlash
        </Button>
        <Button
          startIcon={<Delete />}
          color="warning"
          variant="outlined"
          onClick={() => onDelete(record.id, "soft")}
        >
          O'chirish
        </Button>
        {isSuperAdmin && (
          <Button
            startIcon={<DeleteForever />}
            color="error"
            variant="outlined"
            onClick={() => onDelete(record.id, "hard")}
          >
            Butunlay
          </Button>
        )}
        <Button onClick={onClose}>Yopish</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResearcherDataView;
