import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
  TablePagination,
} from '@mui/material';
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
  CloudUpload,
} from '@mui/icons-material';
import ResearcherForm from '../Research/ResearcherForm';
import { ResearchApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import AdvancedResearchFilter from '../Research/AdvancedResearchFilter';
import { researcherT } from '../../utils/researcherI18n';
import { ConsentStatus } from '../Consent/PrivacyConsentPanel';

/* ════════════════════════════════════════════════════
   Utility Components
════════════════════════════════════════════════════ */
const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.7)'
          : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.05)',
      overflow: 'hidden',
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

const getDateLocale = (lang) => {
  if (lang === 'ru') return 'ru-RU';
  if (lang === 'kz') return 'kk-KZ';
  if (lang === 'tg') return 'tg-TJ';
  if (lang === 'en') return 'en-US';
  return 'uz-UZ';
};

const RESEARCH_METRICS = [
  {
    key: 'chest_standing_height',
    labelKey: 'standingHeight',
    label: "Bo'y (tik)",
    unit: 'sm',
  },
  { key: 'weight', labelKey: 'weight', label: 'Vazn', unit: 'kg' },
  { key: 'bmi', labelKey: 'bmi', label: 'BMI', unit: 'kg/m2' },
  {
    key: 'chest_circumference_pause',
    labelKey: 'chestPause',
    label: "Ko'krak aylanasi",
    unit: 'sm',
  },
  {
    key: 'waist_circumference',
    labelKey: 'waistCircumference',
    label: 'Bel aylanasi',
    unit: 'sm',
  },
  {
    key: 'head_circumference',
    labelKey: 'headCircumference',
    label: 'Bosh aylanasi',
    unit: 'sm',
  },
  {
    key: 'thigh_circumference',
    labelKey: 'thighCircumference',
    label: 'Son aylanasi',
    unit: 'sm',
  },
  {
    key: 'calf_circumference',
    labelKey: 'calfCircumference',
    label: 'Boldir aylanasi',
    unit: 'sm',
  },
  {
    key: 'dynamometry',
    labelKey: 'dynamometry',
    label: 'Dinamometriya',
    unit: 'kg',
  },
];

const ANALYSIS_METRICS = RESEARCH_METRICS.slice(0, 6);

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatNumber = (value, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : '-';

const getAgeYears = (record) => {
  if (!record.birth_date) return null;
  const birthDate = new Date(record.birth_date);
  const examDate = record.examination_date
    ? new Date(record.examination_date)
    : new Date();
  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(examDate.getTime()))
    return null;
  const years = (examDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
  return Number.isFinite(years) && years >= 0 ? years : null;
};

const getMetricValue = (record, key) => {
  if (key === 'bmi') {
    const weight = toNumber(record.weight);
    const height = toNumber(record.chest_standing_height);
    return weight && height ? weight / (height / 100) ** 2 : null;
  }
  if (key === 'age') return getAgeYears(record);
  return toNumber(record[key]);
};

const mean = (values) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
      (values.length - 1)
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
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5)
    return (
      Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
    );
  let x = 0.9999999999998099;
  const shifted = z - 1;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (shifted + index + 1);
  });
  const t = shifted + coefficients.length - 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) +
    (shifted + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  );
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
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x)
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

const normalizeGender = (gender = '') => {
  const value = String(gender).toLowerCase();
  if (value.includes('girl') || value.includes('ayol') || value.includes('qiz'))
    return 'Qiz/Ayol';
  if (
    value.includes('boy') ||
    value.includes('erkak') ||
    value.includes("o'g") ||
    value.includes('og')
  ) {
    return "O'g'il/Erkak";
  }
  return null;
};

const buildDescriptiveStats = (rows) =>
  RESEARCH_METRICS.map((metric) => {
    const values = rows
      .map((row) => getMetricValue(row, metric.key))
      .filter(Number.isFinite);
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
      { "O'g'il/Erkak": [], 'Qiz/Ayol': [] }
    );
    const male = groups["O'g'il/Erkak"];
    const female = groups['Qiz/Ayol'];
    if (male.length < 2 || female.length < 2)
      return { ...metric, maleN: male.length, femaleN: female.length };
    const m1 = mean(male);
    const m2 = mean(female);
    const sd1 = standardDeviation(male);
    const sd2 = standardDeviation(female);
    const pooled = Math.sqrt(
      ((male.length - 1) * sd1 ** 2 + (female.length - 1) * sd2 ** 2) /
        (male.length + female.length - 2)
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

const compareByRegion = (rows, metricKey = 'bmi', unknownLabel = 'Unknown') => {
  const groups = rows.reduce((acc, row) => {
    const region =
      (row.settlement || row.birth_place || unknownLabel).toString().trim() ||
      unknownLabel;
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
    0
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
        .map((row) => [
          getMetricValue(row, metricA.key),
          getMetricValue(row, metricB.key),
        ])
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
      return pearson(pairs);
    }),
  }));

const buildRegression = (rows) => {
  const pairs = rows
    .map((row) => [
      getMetricValue(row, 'chest_standing_height'),
      getMetricValue(row, 'weight'),
    ])
    .filter(
      ([height, weight]) => Number.isFinite(height) && Number.isFinite(weight)
    );
  if (pairs.length < 3) return { n: pairs.length };
  const xs = pairs.map(([x]) => x);
  const ys = pairs.map(([, y]) => y);
  const mx = mean(xs);
  const my = mean(ys);
  const ssx = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
  const slope =
    pairs.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0) / ssx;
  const intercept = my - slope * mx;
  const r = pearson(pairs);
  const t =
    r && Math.abs(r) < 1
      ? Math.abs(r) * Math.sqrt((pairs.length - 2) / (1 - r ** 2))
      : null;
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

const buildResearchStats = (rows, unknownLabel = 'Unknown') => {
  const descriptive = buildDescriptiveStats(rows);
  const bmi = descriptive.find((item) => item.key === 'bmi');
  return {
    count: rows.length,
    descriptive,
    zScore: bmi
      ? [
          { label: 'Z < -2', count: bmi.zLow || 0 },
          { label: '-2 <= Z <= 2', count: bmi.zNormal || 0 },
          { label: 'Z > 2', count: bmi.zHigh || 0 },
        ]
      : [],
    gender: compareByGender(rows),
    region: compareByRegion(rows, 'bmi', unknownLabel),
    correlation: buildCorrelationMatrix(rows),
    regression: buildRegression(rows),
  };
};

const getPLabel = (p) => {
  if (!Number.isFinite(p)) return '—';
  if (p < 0.001) return '<0.001';
  return p.toFixed(3);
};

const getSignificanceChip = (p) => {
  if (!Number.isFinite(p)) return { label: 'N/A', color: 'default' };
  if (p < 0.001) return { label: 'p < 0.001', color: 'error' };
  if (p < 0.01) return { label: 'p < 0.01', color: 'warning' };
  if (p < 0.05) return { label: 'p < 0.05', color: 'success' };
  return { label: 'p >= 0.05', color: 'default' };
};

const getCorrelationColor = (value) => {
  if (!Number.isFinite(value)) return 'transparent';
  const abs = Math.abs(value);
  if (abs >= 0.7)
    return value > 0 ? 'rgba(25,118,210,0.22)' : 'rgba(211,47,47,0.18)';
  if (abs >= 0.4)
    return value > 0 ? 'rgba(46,125,50,0.18)' : 'rgba(245,124,0,0.18)';
  if (abs >= 0.2) return 'rgba(2,136,209,0.08)';
  return 'transparent';
};

const StatCard = ({ label, value, sub }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      height: '100%',
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
      {value}
    </Typography>
    {sub && (
      <Typography variant="caption" color="text.secondary">
        {sub}
      </Typography>
    )}
  </Paper>
);

export const ResearchStatisticsPanel = ({ rows }) => {
  const { lang } = useLanguage();
  const t = (key) => researcherT(lang, key);
  const unknownLabel = t('unknown');
  const stats = useMemo(
    () => buildResearchStats(rows, unknownLabel),
    [rows, unknownLabel]
  );
  const mainMetric = stats.descriptive.find((item) => item.key === 'bmi');
  const regressionChip = getSignificanceChip(stats.regression.p);
  const anovaChip = getSignificanceChip(stats.region.p);
  const maxZ = Math.max(...stats.zScore.map((item) => item.count), 1);
  const metricLabel = (metric) => t(metric.labelKey) || metric.label;
  const regressionEquation = Number.isFinite(stats.regression.intercept)
    ? `${t('weightShort')} = ${formatNumber(stats.regression.intercept)} + ${formatNumber(
        stats.regression.slope,
        3
      )} x ${t('heightShort')}`
    : t('notEnoughData');

  return (
    <GlassPaper sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        <Box
          display="flex"
          justifyContent="space-between"
          gap={2}
          flexWrap="wrap"
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Science color="primary" />
              <Typography variant="h6" fontWeight={800}>
                {t('autoStatsTitle')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('autoStatsSubtitle')}
            </Typography>
          </Box>
          <Chip
            label={`N = ${stats.count}`}
            color="primary"
            sx={{ fontWeight: 800 }}
          />
        </Box>

        {stats.count < 3 && (
          <Alert severity="info">{t('autoStatsMinimum')}</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Mean +/- SD"
              value={
                mainMetric?.n
                  ? `${formatNumber(mainMetric.mean)} +/- ${formatNumber(mainMetric.sd)}`
                  : '—'
              }
              sub={t('byBmi')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Median"
              value={mainMetric?.n ? formatNumber(mainMetric.median) : '—'}
              sub={t('percentile50')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Min-Max"
              value={
                mainMetric?.n
                  ? `${formatNumber(mainMetric.min)} - ${formatNumber(mainMetric.max)}`
                  : '—'
              }
              sub={t('bmiRange')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Regression R2"
              value={
                Number.isFinite(stats.regression.r2)
                  ? formatNumber(stats.regression.r2, 3)
                  : '—'
              }
              sub={t('weightHeightRelation')}
            />
          </Grid>
        </Grid>

        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Science color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={800}>
              {t('descriptiveStats')}
            </Typography>
          </Box>
          <TableContainer
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('indicator')}</TableCell>
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
                        {metricLabel(item)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.n}</TableCell>
                    <TableCell align="right">
                      {item.n
                        ? `${formatNumber(item.mean)} +/- ${formatNumber(item.sd)}`
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {item.n ? formatNumber(item.median) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {item.n
                        ? `${formatNumber(item.min)} - ${formatNumber(item.max)}`
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {item.n
                        ? `${formatNumber(item.p5)} / ${formatNumber(item.p25)} / ${formatNumber(item.p75)} / ${formatNumber(item.p95)}`
                        : '—'}
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
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} mb={1}>
                {t('zScoreDistribution')}
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
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  {t('regressionAnalysis')}
                </Typography>
                <Chip
                  size="small"
                  label={regressionChip.label}
                  color={regressionChip.color}
                />
              </Box>
              <Typography variant="body2" fontWeight={700}>
                {regressionEquation}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={1}
              >
                r = {formatNumber(stats.regression.r, 3)}; R2 ={' '}
                {formatNumber(stats.regression.r2, 3)}; p ={' '}
                {getPLabel(stats.regression.p)}; n = {stats.regression.n || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  {t('anovaRegionalDifference')}
                </Typography>
                <Chip
                  size="small"
                  label={anovaChip.label}
                  color={anovaChip.color}
                />
              </Box>
              <Typography variant="body2" fontWeight={700}>
                {t('bmiByRegion')}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={1}
              >
                F({stats.region.dfBetween || 0}, {stats.region.dfWithin || 0}) ={' '}
                {formatNumber(stats.region.f, 3)}; p ={' '}
                {getPLabel(stats.region.p)}; eta2 ={' '}
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
                {t('sexDifference')}
              </Typography>
            </Box>
            <TableContainer
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('indicator')}</TableCell>
                    <TableCell align="right">{t('maleGroup')}</TableCell>
                    <TableCell align="right">{t('femaleGroup')}</TableCell>
                    <TableCell align="right">p-value</TableCell>
                    <TableCell align="right">Effect size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.gender.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>{metricLabel(item)}</TableCell>
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
                      <TableCell align="right">
                        {formatNumber(item.effect, 3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight={800} mb={1.5}>
              {t('regionalDifference')}
            </Typography>
            <TableContainer
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('region')}</TableCell>
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
                          {formatNumber(group.mean)} +/-{' '}
                          {formatNumber(group.sd)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        {t('notEnoughRegionalGroups')}
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
            {t('correlationMatrix')}
          </Typography>
          <TableContainer
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  {ANALYSIS_METRICS.map((metric) => (
                    <TableCell
                      key={metric.key}
                      align="center"
                      sx={{ fontWeight: 800 }}
                    >
                      {metricLabel(metric)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.correlation.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {metricLabel(row)}
                    </TableCell>
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
  const t = useCallback((key) => researcherT(lang, key), [lang]);
  const dateLocale = getDateLocale(lang);
  const [data, setData] = useState([]);
  const [deletedData, setDeletedData] = useState([]);
  const [total, setTotal] = useState(0);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [deletedPage, setDeletedPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [activeTab, setActiveTab] = useState(0); // 0: Active, 1: Deleted
  const [filter, setFilter] = useState({
    search: '',
    full_name: '',
    school_name: '',
    settlement: '',
    feeding_type: '',
    parents_marriage: '',
    gender: '',
    weight_min: '',
    weight_max: '',
    height_min: '',
    height_max: '',
    date_from: '',
    date_to: '',
  });
  const [appliedFilter, setAppliedFilter] = useState(filter);
  const [detailRecord, setDetailRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);

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
    [checked]
  );

  const onDeleteSelected = useCallback(() => {
    if (checked.size > 0) setDeleteConfirmOpen(true);
  }, [checked.size]);

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.code === 'Delete' || e.key === 'Backspace') {
        const el = document.activeElement;
        const tag = el.tagName.toUpperCase();
        const isTextInput =
          (tag === 'INPUT' &&
            !['checkbox', 'radio', 'range', 'button', 'submit'].includes(
              el.type
            )) ||
          tag === 'TEXTAREA' ||
          el.isContentEditable;

        if (isTextInput) return;

        if (checked.size > 0) {
          onDeleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checked.size, onDeleteSelected]);

  const fetchData = useCallback(
    async (
      params = appliedFilter,
      nextPage = page,
      nextRowsPerPage = rowsPerPage
    ) => {
      setLoading(true);
      try {
        const result = await ResearchApi.list({
          ...params,
          page: nextPage + 1,
          page_size: nextRowsPerPage,
          paginated: true,
        });
        const items = Array.isArray(result) ? result : result.items || [];
        setData(items);
        setTotal(Array.isArray(result) ? items.length : result.total || 0);
      } catch (err) {
        toast.error(t('loadDataError'));
      } finally {
        setLoading(false);
      }
    },
    [appliedFilter, page, rowsPerPage, t]
  );

  const fetchDeletedData = useCallback(
    async (nextPage = deletedPage, nextRowsPerPage = rowsPerPage) => {
      setDeletedLoading(true);
      try {
        const result = await ResearchApi.deletedList({
          page: nextPage + 1,
          page_size: nextRowsPerPage,
          paginated: true,
        });
        const items = Array.isArray(result) ? result : result.items || [];
        setDeletedData(items);
        setDeletedTotal(
          Array.isArray(result) ? items.length : result.total || 0
        );
      } catch (err) {
        toast.error(t('loadDeletedError'));
      } finally {
        setDeletedLoading(false);
      }
    },
    [deletedPage, rowsPerPage, t]
  );

  useEffect(() => {
    if (activeTab === 0) fetchData();
    else if (activeTab === 1) fetchDeletedData();
  }, [activeTab, fetchData, fetchDeletedData]);

  useEffect(() => {
    setChecked(new Set());
  }, [activeTab, page, deletedPage, rowsPerPage]);

  const handleSearch = useCallback(() => {
    setAppliedFilter(filter);
    setPage(0);
  }, [filter]);

  const handlePageChange = useCallback(
    (_, nextPage) => {
      if (activeTab === 0) setPage(nextPage);
      else setDeletedPage(nextPage);
    },
    [activeTab]
  );

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setDeletedPage(0);
  }, []);

  const handleDelete = async (idOrIds, type) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (ids.length === 0) return;

    setDeleteConfirmLoading(true);
    try {
      if (type === 'hard') {
        for (const id of ids) await ResearchApi.hardDelete(id);
        toast.success(
          ids.length > 1 ? t('hardDeletedMany') : t('hardDeletedOne')
        );
      } else if (type === 'restore') {
        for (const id of ids) await ResearchApi.restore(id);
        toast.success(ids.length > 1 ? t('restoredMany') : t('restoredOne'));
        fetchDeletedData();
      } else {
        for (const id of ids) await ResearchApi.softDelete(id);
        toast.success(
          ids.length > 1 ? t('movedTrashMany') : t('movedTrashOne')
        );
      }

      setChecked(new Set());
      setDeleteConfirmOpen(false);
      fetchData();
      if (activeTab === 1) fetchDeletedData();
      if (detailRecord && ids.includes(detailRecord.id)) setDetailRecord(null);
    } catch (err) {
      toast.error(`${t('errorPrefix')} ${err.message}`);
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const {
        id,
        created_at,
        created_by_id,
        created_by_name,
        created_by_email,
        is_deleted,
        deleted_by_id,
        deleted_by_name,
        deleted_at,
        ...payload
      } = editForm;
      await ResearchApi.update(id, payload);
      toast.success(t('updated'));
      setEditRecord(null);
      fetchData();
    } catch (err) {
      toast.error(`${t('errorPrefix')} ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportXlsx = async () => {
    try {
      const blob = await ResearchApi.exportXlsx({ ...appliedFilter, lang });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'research_data.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast.error(`${t('errorPrefix')} ${err.message}`);
    }
  };

  const handleExportSummaryDocx = async () => {
    try {
      const blob = await ResearchApi.exportSummaryDocx({ ...filter, lang });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_summary_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`${t('errorPrefix')} ${err.message}`);
    }
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const blob = await ResearchApi.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'research_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`${t('templateError')} ${err.message}`);
    }
  };

  const handleImportXlsx = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const result = await ResearchApi.importXlsx(file);
      toast.success(
        `${result.imported || 0} ${t('importSuccess')}${
          result.skipped ? `, ${result.skipped} ${t('skippedEmptyRows')}` : ''
        }`
      );
      fetchData();
    } catch (err) {
      toast.error(`${t('importError')} ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadDocx = (id, selectedLang = lang) => {
    ResearchApi.downloadDocx(id, selectedLang);
  };

  const handleDownloadConsentDocx = (id, selectedLang = lang) => {
    ResearchApi.downloadConsentDocx(id, selectedLang);
  };

  const getCreatorName = (row) =>
    row.created_by_name ||
    row.created_by_email ||
    (row.created_by_id ? `ID: ${row.created_by_id}` : '—');

  /* ── Table Components ── */
  const renderTable = (rows, isLoading, isDeletedView = false) => {
    const columnCount = 6 + (isSuperAdmin ? 1 : 0) + (isDeletedView ? 1 : 0);
    const currentPage = isDeletedView ? deletedPage : page;
    const rowTotal = isDeletedView ? deletedTotal : total;

    return (
      <>
        <TableContainer component={GlassPaper}>
          <Table size="small" sx={{ minWidth: isSuperAdmin ? 980 : 760 }}>
            <TableHead
              sx={{
                background: isDeletedView
                  ? 'rgba(244,67,54,0.06)'
                  : 'rgba(15,118,110,0.06)',
              }}
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
                <TableCell sx={{ fontWeight: 700 }}>{t('fullName')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('schoolKindergarten')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('exam')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('heightWeight')}
                </TableCell>
                {isSuperAdmin && (
                  <TableCell sx={{ fontWeight: 700 }}>
                    {t('createdByResearcher')}
                  </TableCell>
                )}
                {isDeletedView && (
                  <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>
                    {t('deletedDate')}
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  {t('actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    align="center"
                    sx={{ py: 6, color: 'text.secondary' }}
                  >
                    {t('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { background: 'rgba(15,118,110,0.04)' },
                      bgcolor: checked.has(row.id)
                        ? 'rgba(15,118,110,0.08)'
                        : 'inherit',
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
                      <IconButton
                        size="small"
                        color={checked.has(row.id) ? 'primary' : 'default'}
                      >
                        {checked.has(row.id) ? (
                          <CheckCircle fontSize="small" />
                        ) : (
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              border: '2px solid',
                              borderColor: 'divider',
                              borderRadius: '4px',
                            }}
                          />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {currentPage * rowsPerPage + idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            fontSize: 12,
                            bgcolor: 'primary.light',
                          }}
                        >
                          {(row.full_name || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {row.full_name || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.school_name || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.settlement || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.examination_date || '—'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {row.chest_standing_height
                          ? `${row.chest_standing_height} sm`
                          : '—'}{' '}
                        /{row.weight ? ` ${row.weight} kg` : ' —'}
                      </Typography>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {getCreatorName(row)}
                        </Typography>
                        {row.created_by_email &&
                          row.created_by_email !== row.created_by_name && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {row.created_by_email}
                            </Typography>
                          )}
                      </TableCell>
                    )}
                    {isDeletedView && (
                      <TableCell>
                        <Typography variant="caption" color="error">
                          {row.deleted_at
                            ? new Date(row.deleted_at).toLocaleDateString(
                                dateLocale
                              )
                            : '—'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        <Tooltip title={t('viewDetails')}>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => setDetailRecord(row)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!isDeletedView ? (
                          <>
                            <Tooltip title={t('edit')}>
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
                            <Tooltip title={t('softDelete')}>
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
                              <Tooltip title={t('hardDelete')}>
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
                            <Tooltip title={t('restore')}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleDelete(row.id, 'restore')}
                              >
                                <Refresh fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('hardDelete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(row.id, 'hard')}
                              >
                                <DeleteForever fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title={`DOCX (${lang.toUpperCase()})`}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownloadDocx(row.id, lang)}
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
        <TablePagination
          component="div"
          count={rowTotal}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Sahifada:"
        />
      </>
    );
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={900}>
          {t('researcherDataTitle')}
        </Typography>
        <Stack direction="row" spacing={2}>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={handleImportXlsx}
          />
          {checked.size > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {t('delete')} ({checked.size})
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setShowAdd(true)}
          >
            {t('addRecord')}
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
            variant="contained"
            color="secondary"
            startIcon={<Description />}
            onClick={handleExportSummaryDocx}
          >
            {t('docxReport')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={handleDownloadImportTemplate}
          >
            {t('template')}
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={
              importing ? <CircularProgress size={18} /> : <CloudUpload />
            }
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            {t('importXlsx')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => (activeTab === 0 ? fetchData() : fetchDeletedData())}
          >
            {t('refresh')}
          </Button>
        </Stack>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}
      >
        <Tab
          label={t('dataList')}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        />
        {isSuperAdmin && (
          <Tab
            label={t('deleted')}
            icon={<RestoreFromTrash />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        )}
      </Tabs>

      {activeTab === 0 && (
        <Stack spacing={3}>
          <AdvancedResearchFilter
            filter={filter}
            setFilter={setFilter}
            onSearch={handleSearch}
          />

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
        handleDownloadConsentDocx={handleDownloadConsentDocx}
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
          {t('editDialogTitle')}
          <IconButton
            onClick={() => setEditRecord(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Section I: Demographic */}
          <SectionTitle icon={Person} title={t('sectionPassport')} />
          <Grid container spacing={2} pt={1}>
            {[
              [t('fullName'), 'full_name', 'text'],
              [t('schoolKindergarten'), 'school_name', 'text'],
              [t('settlement'), 'settlement', 'text'],
              [t('birthPlace'), 'birth_place', 'text'],
              [t('birthDate'), 'birth_date', 'date'],
              [t('fatherNationality'), 'father_nationality', 'text'],
              [t('motherNationality'), 'mother_nationality', 'text'],
              [t('livingSince'), 'living_since', 'text'],
              [t('enrolledDate'), 'enrolled_date', 'text'],
              [t('livingConditions'), 'living_conditions', 'text'],
              [t('laborRegime'), 'labor_regime', 'text'],
              [t('pastIllnesses'), 'past_illnesses', 'text'],
              [t('childrenCount'), 'children_count', 'number'],
              [t('childOrder'), 'child_order', 'number'],
              [
                t('feedingType'),
                'feeding_type',
                'select',
                [
                  {
                    value: t('natural'),
                    label: t('natural'),
                  },
                  {
                    value: t('artificial'),
                    label: t('artificial'),
                  },
                ],
              ],
              [
                t('parentsMarriage'),
                'parents_marriage',
                'select',
                [
                  {
                    value: t('closeRelative'),
                    label: t('closeRelative'),
                  },
                  {
                    value: t('distantRelative'),
                    label: t('distantRelative'),
                  },
                  {
                    value: t('notRelative'),
                    label: t('notRelative'),
                  },
                ],
              ],
              [t('motherHealth'), 'mother_health_status', 'text'],
              [t('examDate'), 'examination_date', 'date'],
            ].map(([label, key, type, options]) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={
                  key === 'feeding_type' || key === 'parents_marriage' ? 6 : 4
                }
                key={key}
              >
                <TextField
                  select={type === 'select'}
                  label={label}
                  fullWidth
                  size="small"
                  type={type === 'select' ? undefined : type}
                  value={editForm[key] || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  InputLabelProps={
                    type === 'date' || type === 'select'
                      ? { shrink: true }
                      : undefined
                  }
                  sx={{
                    minWidth: type === 'select' ? { xs: 120, sm: 200 } : 'auto',
                  }}
                >
                  {type === 'select' &&
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
          <SectionTitle icon={Place} title={t('sectionLegs')} />
          <Grid container spacing={2} pt={1}>
            {[
              ['Spina iliaca', 'lower_leg_spina_iliaca'],
              ['Symphysion', 'lower_leg_symphysion'],
              [t('tibialeHeight'), 'tibiale_height'],
              [t('pelvicWidth'), 'pelvic_width'],
              [t('thighLength'), 'thigh_length'],
              [t('thighCircumference'), 'thigh_circumference'],
              [t('calfLength'), 'calf_length'],
              [t('calfCircumference'), 'calf_circumference'],
              [t('footLength'), 'foot_length'],
              [t('teethCount'), 'teeth_count'],
              [t('menstruationStart'), 'menstruation_start', 'text'],
            ].map(([label, key, type]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type={type || 'number'}
                  value={editForm[key] || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}
          </Grid>

          {/* Section III: Skull */}
          <SectionTitle icon={Science} title={t('sectionSkull')} />
          <Grid container spacing={2} pt={1}>
            {[
              [t('skullLongitudinal'), 'skull_longitudinal'],
              [t('skullTransverse'), 'skull_transverse'],
              [t('headCircumference'), 'head_circumference'],
              [t('foreheadTransverse'), 'forehead_transverse'],
              [t('skullHeight'), 'skull_height'],
              [t('skullBaseLength'), 'skull_base_length'],
              [t('skullBaseWidth'), 'skull_base_width'],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}
          </Grid>

          {/* Section IV: Face */}
          <SectionTitle icon={Person} title={t('sectionFace')} />
          <Grid container spacing={2} pt={1}>
            {[
              [t('faceBizygomatic'), 'face_bizygomatic'],
              [t('faceBigonial'), 'face_bigonial'],
              [t('faceMorphologicalHeight'), 'face_morphological_height'],
              [t('facePhysiognomicHeight'), 'face_physiognomic_height'],
              [t('noseHeight'), 'nose_height'],
              [t('noseWidth'), 'nose_width'],
              [t('outerCanthalWidth'), 'outer_canthal_width'],
              [t('innerCanthalWidth'), 'inner_canthal_width'],
              [t('lipsMucosaHeight'), 'lips_mucosa_height'],
              [t('mouthWidth'), 'mouth_width'],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}
          </Grid>

          {/* Section V: Chest */}
          <SectionTitle icon={FitnessCenter} title={t('sectionChest')} />
          <Grid container spacing={2} pt={1}>
            {[
              [t('standingHeight'), 'chest_standing_height'],
              [t('sittingHeight'), 'chest_sitting_height'],
              [t('weight'), 'weight'],
              [t('trunkLength'), 'trunk_length'],
              [t('torsoLength'), 'torso_length'],
              [t('chestPause'), 'chest_circumference_pause'],
              [t('chestInhale'), 'chest_circumference_inhale'],
              [t('chestExhale'), 'chest_circumference_exhale'],
              [t('waistCircumference'), 'waist_circumference'],
              [t('abdomenCircumference'), 'abdomen_circumference'],
              [t('upperSegmentLength'), 'upper_segment_length'],
              [t('chestTransverseDiameter'), 'chest_transverse_diameter'],
              [
                t('chestAnteroposteriorDiameter'),
                'chest_anteroposterior_diameter',
              ],
              [t('chestHeight'), 'chest_height'],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}
          </Grid>

          {/* Section VI: Arms and Fat */}
          <SectionTitle icon={FitnessCenter} title={t('sectionArmFat')} />
          <Grid container spacing={2} pt={1}>
            {[
              [t('armLength'), 'arm_length'],
              [t('shoulderLength'), 'shoulder_length'],
              [t('shoulderWidth'), 'shoulder_width'],
              [t('shoulderCircumferenceRest'), 'shoulder_circumference_rest'],
              [
                t('shoulderCircumferenceFlexed'),
                'shoulder_circumference_flexed',
              ],
              [t('forearmLength'), 'forearm_length'],
              [t('handLength'), 'hand_length'],
              [t('dynamometry'), 'dynamometry'],
              [t('fatTriceps'), 'fat_triceps'],
              [t('fatBiceps'), 'fat_biceps'],
              [t('fatSubscapular'), 'fat_subscapular'],
              [t('fatIliac'), 'fat_iliac'],
              [t('fatPopliteal'), 'fat_popliteal'],
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  label={label}
                  fullWidth
                  size="small"
                  type="number"
                  value={editForm[key] || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditRecord(null)}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : t('save')}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {t('addRecord')}
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
        <DialogTitle sx={{ fontWeight: 800 }}>{t('delete')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('selectedDeleteMessage').replace('{count}', checked.size)}{' '}
            {activeTab === 1 ? t('confirmHardDelete') : t('confirmSoftDelete')}
          </Typography>
          {activeTab === 1 && (
            <Box
              sx={{
                bgcolor: 'error.lighter',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography
                variant="caption"
                color="error.dark"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Lock fontSize="small" /> {t('irreversibleWarning')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              handleDelete(
                Array.from(checked),
                activeTab === 1 ? 'hard' : 'soft'
              )
            }
            disabled={deleteConfirmLoading}
          >
            {deleteConfirmLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('delete')
            )}
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
  handleDownloadConsentDocx,
}) => {
  const { lang } = useLanguage();
  const t = useCallback((key) => researcherT(lang, key), [lang]);

  if (!record) return null;

  const Section = ({ title, Icon, fields }) => (
    <>
      <SectionTitle icon={Icon} title={title} />
      <Grid container spacing={2}>
        {fields.map(([label, key]) =>
          record[key] !== null &&
          record[key] !== undefined &&
          record[key] !== '' ? (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: 'rgba(15,118,110,0.04)',
                  border: '1px solid rgba(15,118,110,0.08)',
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
          ) : null
        )}
      </Grid>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {record.full_name || t('unknown')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {record.id} | {t('date')}: {record.examination_date || '-'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <ConsentStatus
          record={record}
          lang={lang}
          onDownloadDocx={() => handleDownloadConsentDocx(record.id, lang)}
        />
        <Section
          title={t('sectionPassport')}
          Icon={Person}
          fields={[
            [t('fullName'), 'full_name'],
            [t('schoolKindergarten'), 'school_name'],
            [t('settlement'), 'settlement'],
            [t('birthPlace'), 'birth_place'],
            [t('birthDate'), 'birth_date'],
            [t('gender'), 'gender'],
            ...(isSuperAdmin
              ? [
                  [t('createdByName'), 'created_by_name'],
                  [t('createdByEmail'), 'created_by_email'],
                ]
              : []),
            [t('fatherNationality'), 'father_nationality'],
            [t('motherNationality'), 'mother_nationality'],
            [t('livingSince'), 'living_since'],
            [t('enrolledDate'), 'enrolled_date'],
            [t('livingConditions'), 'living_conditions'],
            [t('laborRegime'), 'labor_regime'],
            [t('pastIllnesses'), 'past_illnesses'],
            [t('childrenCount'), 'children_count'],
            [t('childOrder'), 'child_order'],
            [t('feedingType'), 'feeding_type'],
            [t('parentsMarriage'), 'parents_marriage'],
            [t('motherHealth'), 'mother_health_status'],
            [t('examDate'), 'examination_date'],
          ]}
        />
        <Section
          title={t('sectionLegs')}
          Icon={Place}
          fields={[
            ['Spina iliaca', 'lower_leg_spina_iliaca'],
            ['Symphysion', 'lower_leg_symphysion'],
            [t('tibialeHeight'), 'tibiale_height'],
            [t('pelvicWidth'), 'pelvic_width'],
            [t('thighLength'), 'thigh_length'],
            [t('thighCircumference'), 'thigh_circumference'],
            [t('calfLength'), 'calf_length'],
            [t('calfCircumference'), 'calf_circumference'],
            [t('footLength'), 'foot_length'],
            [t('teethCount'), 'teeth_count'],
            [t('menstruationStart'), 'menstruation_start'],
          ]}
        />
        <Section
          title={t('sectionSkull')}
          Icon={Science}
          fields={[
            [t('skullLongitudinal'), 'skull_longitudinal'],
            [t('skullTransverse'), 'skull_transverse'],
            [t('headCircumference'), 'head_circumference'],
            [t('foreheadTransverse'), 'forehead_transverse'],
            [t('skullHeight'), 'skull_height'],
            [t('skullBaseLength'), 'skull_base_length'],
            [t('skullBaseWidth'), 'skull_base_width'],
          ]}
        />
        <Section
          title={t('sectionFace')}
          Icon={Person}
          fields={[
            [t('faceBizygomatic'), 'face_bizygomatic'],
            [t('faceBigonial'), 'face_bigonial'],
            [t('faceMorphologicalHeight'), 'face_morphological_height'],
            [t('facePhysiognomicHeight'), 'face_physiognomic_height'],
            [t('noseHeight'), 'nose_height'],
            [t('noseWidth'), 'nose_width'],
            [t('outerCanthalWidth'), 'outer_canthal_width'],
            [t('innerCanthalWidth'), 'inner_canthal_width'],
            [t('lipsMucosaHeight'), 'lips_mucosa_height'],
            [t('mouthWidth'), 'mouth_width'],
          ]}
        />
        <Section
          title={t('sectionChest')}
          Icon={FitnessCenter}
          fields={[
            [t('standingHeight'), 'chest_standing_height'],
            [t('sittingHeight'), 'chest_sitting_height'],
            [t('weight'), 'weight'],
            [t('trunkLength'), 'trunk_length'],
            [t('torsoLength'), 'torso_length'],
            [t('chestPause'), 'chest_circumference_pause'],
            [t('chestInhale'), 'chest_circumference_inhale'],
            [t('chestExhale'), 'chest_circumference_exhale'],
            [t('waistCircumference'), 'waist_circumference'],
            [t('abdomenCircumference'), 'abdomen_circumference'],
            [t('upperSegmentLength'), 'upper_segment_length'],
            [t('chestTransverseDiameter'), 'chest_transverse_diameter'],
            [
              t('chestAnteroposteriorDiameter'),
              'chest_anteroposterior_diameter',
            ],
            [t('chestHeight'), 'chest_height'],
          ]}
        />
        <Section
          title={t('sectionArmFat')}
          Icon={FitnessCenter}
          fields={[
            [t('armLength'), 'arm_length'],
            [t('shoulderLength'), 'shoulder_length'],
            [t('shoulderWidth'), 'shoulder_width'],
            [t('shoulderCircumferenceRest'), 'shoulder_circumference_rest'],
            [t('shoulderCircumferenceFlexed'), 'shoulder_circumference_flexed'],
            [t('forearmLength'), 'forearm_length'],
            [t('handLength'), 'hand_length'],
            [t('dynamometry'), 'dynamometry'],
            [t('fatTriceps'), 'fat_triceps'],
            [t('fatBiceps'), 'fat_biceps'],
            [t('fatSubscapular'), 'fat_subscapular'],
            [t('fatIliac'), 'fat_iliac'],
            [t('fatPopliteal'), 'fat_popliteal'],
          ]}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => handleDownloadDocx(record.id, lang)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX ({lang.toUpperCase()})
          </Button>
        </Stack>
        <Box flex={1} />
        <Button
          startIcon={<Edit />}
          variant="contained"
          onClick={() => onEdit(record)}
        >
          {t('edit')}
        </Button>
        <Button
          startIcon={<Delete />}
          color="warning"
          variant="outlined"
          onClick={() => onDelete(record.id, 'soft')}
        >
          {t('delete')}
        </Button>
        {isSuperAdmin && (
          <Button
            startIcon={<DeleteForever />}
            color="error"
            variant="outlined"
            onClick={() => onDelete(record.id, 'hard')}
          >
            {t('hardDelete')}
          </Button>
        )}
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResearcherDataView;
