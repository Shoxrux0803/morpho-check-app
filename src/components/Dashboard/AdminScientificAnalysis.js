// src/components/Dashboard/AdminScientificAnalysis.js
// Adminlar uchun PRO-darajadagi Ilmiy-Antropometrik Tahlil va Statistik Modellar (V3.2)
import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  BiotechOutlined,
  ScienceOutlined,
  AutoGraphOutlined,
  EqualizerOutlined,
  CheckCircle,
  TrendingUp,
  MonitorWeightOutlined,
  AccessibilityNewOutlined,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { ADMIN_SCI_TEXT } from './adminSciI18n';

const COLORS = {
  primary: '#0f766e',
  secondary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  teal: '#14b8a6',
};

const localeByLang = {
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  tm: 'tk-TM',
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
  ky: 'ky-KG',
  tr: 'tr-TR',
};

const GlassCard = ({ children, sx = {}, hover = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      elevation={0}
      component={hover ? motion.div : 'div'}
      whileHover={hover ? { y: -4 } : undefined}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 3,
        background: isDark
          ? 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.78) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid',
        borderColor: isDark
          ? 'rgba(148,163,184,0.18)'
          : 'rgba(15,118,110,0.14)',
        boxShadow: isDark
          ? '0 18px 45px rgba(0,0,0,0.28)'
          : '0 16px 44px rgba(15,23,42,0.07)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <Box
    display="flex"
    alignItems="flex-start"
    justifyContent="space-between"
    mb={2.5}
  >
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        {icon}
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
    {badge}
  </Box>
);

// Hero Header with WHO Badge & Interactive Section Tabs
const ScientificHeroBanner = ({
  t,
  isDark,
  totalN,
  activeTab,
  onTabChange,
}) => (
  <Box
    sx={{
      p: { xs: 2.5, md: 3.5 },
      borderRadius: 4,
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #115e59 100%)'
        : 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #1e40af 100%)',
      color: '#fff',
      boxShadow: '0 20px 45px rgba(15,118,110,0.25)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
      }}
    />

    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', lg: 'center' }}
      spacing={3}
    >
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ScienceOutlined sx={{ color: '#5eead4', fontSize: 26 }} />
          </Box>
          <Typography
            variant="h5"
            fontWeight={900}
            sx={{ letterSpacing: '-0.3px', color: '#fff' }}
          >
            {t.title}
          </Typography>
          <Chip
            icon={
              <BiotechOutlined
                sx={{ color: '#fff !important', fontSize: 16 }}
              />
            }
            label={t.statConfidence}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.72rem',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          />
        </Stack>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 680,
            fontWeight: 500,
          }}
        >
          {t.subtitle} — {t.whoReference}
        </Typography>
      </Box>

      {/* Interactive Tabs / Filter Pills */}
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        sx={{
          bgcolor: 'rgba(0,0,0,0.24)',
          p: 0.6,
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {[
          { id: 'all', label: t.tabAll },
          { id: 'dist', label: t.tabDist },
          { id: 'corr', label: t.tabCorr },
          { id: 'risk', label: t.tabRisk },
        ].map((tabItem) => {
          const active = activeTab === tabItem.id;
          return (
            <Box
              key={tabItem.id}
              onClick={() => onTabChange(tabItem.id)}
              sx={{
                px: 2.2,
                py: 0.8,
                borderRadius: 2.5,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
                color: '#fff',
                bgcolor: active ? 'rgba(255,255,255,0.25)' : 'transparent',
                border: active
                  ? '1px solid rgba(255,255,255,0.4)'
                  : '1px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: active
                    ? 'rgba(255,255,255,0.28)'
                    : 'rgba(255,255,255,0.12)',
                },
              }}
            >
              {tabItem.label}
            </Box>
          );
        })}
      </Stack>
    </Stack>
  </Box>
);

// 4 PRO-Level Scientific 3D-Glass Summary KPI Cards
const ScientificKpiSummary = ({
  t,
  isDark,
  medianBmi,
  avgZScore,
  normalcyRate,
  pearsonR,
  totalN,
}) => (
  <Grid container spacing={2.5}>
    <Grid item xs={12} sm={6} md={3}>
      <GlassCard hover>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
            >
              {t.kpiMedianBmi}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.primary }}
            >
              {medianBmi}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: isDark
                ? 'rgba(20,184,166,0.15)'
                : 'rgba(15,118,110,0.1)',
              color: COLORS.primary,
            }}
          >
            <MonitorWeightOutlined />
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <Chip
            size="small"
            label={`N = ${totalN}`}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 800,
              bgcolor: 'rgba(15,118,110,0.12)',
              color: COLORS.primary,
            }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {t.kpiMedianBmiSub}
          </Typography>
        </Stack>
      </GlassCard>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <GlassCard hover>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
            >
              {t.kpiAvgZScore}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                mt: 0.5,
                color:
                  Math.abs(parseFloat(avgZScore)) <= 1
                    ? COLORS.success
                    : COLORS.warning,
              }}
            >
              {avgZScore > 0 ? `+${avgZScore}` : avgZScore} SD
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor:
                Math.abs(parseFloat(avgZScore)) <= 1
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(245,158,11,0.15)',
              color:
                Math.abs(parseFloat(avgZScore)) <= 1
                  ? COLORS.success
                  : COLORS.warning,
            }}
          >
            <EqualizerOutlined />
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <Chip
            size="small"
            label={
              Math.abs(parseFloat(avgZScore)) <= 1 ? t.lowRisk : t.mediumRisk
            }
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 800,
              bgcolor:
                Math.abs(parseFloat(avgZScore)) <= 1
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(245,158,11,0.15)',
              color:
                Math.abs(parseFloat(avgZScore)) <= 1
                  ? COLORS.success
                  : COLORS.warning,
            }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {t.kpiAvgZScoreSub}
          </Typography>
        </Stack>
      </GlassCard>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <GlassCard hover>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
            >
              {t.kpiNormalcy}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.success }}
            >
              {normalcyRate}%
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: 'rgba(16,185,129,0.15)',
              color: COLORS.success,
            }}
          >
            <CheckCircle />
          </Box>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={normalcyRate}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': {
              bgcolor: COLORS.success,
              borderRadius: 3,
            },
            mb: 1,
          }}
        />
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {t.kpiNormalcySub}
        </Typography>
      </GlassCard>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <GlassCard hover>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
            >
              {t.kpiCorrelation}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.info }}
            >
              r = {pearsonR}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: 'rgba(59,130,246,0.15)',
              color: COLORS.info,
            }}
          >
            <AutoGraphOutlined />
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <Chip
            size="small"
            label={Math.abs(pearsonR) >= 0.5 ? 'Strong' : 'Moderate'}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 800,
              bgcolor: 'rgba(59,130,246,0.15)',
              color: COLORS.info,
            }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {t.kpiCorrelationSub}
          </Typography>
        </Stack>
      </GlassCard>
    </Grid>
  </Grid>
);

// AI Scientific Statistical Advisor Widget
const ScientificAiAdvisorCard = ({ t, isDark, normalcyRate, outlierCount }) => {
  const [tabIdx, setTabIdx] = useState(0);

  return (
    <GlassCard>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
              color: '#fff',
              display: 'flex',
            }}
          >
            <BiotechOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {t.aiTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t.aiSubtitle}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label="ANOVA & Z-SCORE ENGINE"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.68rem',
            bgcolor: isDark ? 'rgba(20,184,166,0.18)' : 'rgba(15,118,110,0.12)',
            color: COLORS.primary,
          }}
        />
      </Stack>

      <Tabs
        value={tabIdx}
        onChange={(_, val) => setTabIdx(val)}
        sx={{
          minHeight: 38,
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 38,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.85rem',
          },
        }}
      >
        <Tab label={t.aiTabSummary} />
        <Tab label={t.aiTabOutliers} />
        <Tab label={t.aiTabRecs} />
      </Tabs>

      <Box sx={{ minHeight: 70 }}>
        {tabIdx === 0 && (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              <CheckCircle
                sx={{ color: COLORS.success, fontSize: 20, mt: 0.3 }}
              />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {normalcyRate >= 65 ? t.statNormalSample : t.statSkewedSample}
              </Typography>
            </Stack>
          </Stack>
        )}

        {tabIdx === 1 && (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              <EqualizerOutlined
                sx={{
                  color: outlierCount > 0 ? COLORS.warning : COLORS.success,
                  fontSize: 20,
                  mt: 0.3,
                }}
              />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {outlierCount > 0 ? t.outlierAlert(outlierCount) : t.noOutliers}
              </Typography>
            </Stack>
          </Stack>
        )}

        {tabIdx === 2 && (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              <TrendingUp sx={{ color: COLORS.info, fontSize: 20, mt: 0.3 }} />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {t.recCohort}
              </Typography>
            </Stack>
          </Stack>
        )}
      </Box>
    </GlassCard>
  );
};

// Main Component
export default function AdminScientificAnalysis({
  data = [],
  loading = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { language } = useLanguage();
  const t = ADMIN_SCI_TEXT[language] || ADMIN_SCI_TEXT.uz;
  const currentLocale = localeByLang[language] || 'uz-UZ';

  const [activeTab, setActiveTab] = useState('all');

  // ---- 1. Median BMI (P50) ----
  const medianBmi = useMemo(() => {
    const bmis = data
      .map((d) => parseFloat(d.bmi))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);
    if (!bmis.length) return '—';
    const idx = Math.floor(bmis.length * 0.5);
    return bmis[idx].toFixed(1);
  }, [data]);

  // ---- 2. Average Z-Score & Normalcy Rate (-1..+1 SD) ----
  const { avgZScore, normalcyRate, outlierCount } = useMemo(() => {
    if (!data.length)
      return { avgZScore: '0.00', normalcyRate: 0, outlierCount: 0 };
    let sumZ = 0,
      normalCount = 0,
      outliers = 0,
      valid = 0;
    data.forEach((d) => {
      const z = parseFloat(d.zscore);
      if (!isNaN(z)) {
        sumZ += z;
        if (z >= -1 && z <= 1) normalCount++;
        if (Math.abs(z) >= 2) outliers++;
        valid++;
      }
    });
    return {
      avgZScore: valid > 0 ? (sumZ / valid).toFixed(2) : '0.00',
      normalcyRate: valid > 0 ? Math.round((normalCount / valid) * 100) : 0,
      outlierCount: outliers,
    };
  }, [data]);

  // ---- 3. Pearson Correlation r (Age vs BMI) ----
  const pearsonR = useMemo(() => {
    if (data.length < 2) return '0.00';
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;
    let n = 0;
    data.forEach((d) => {
      const x = parseFloat(d.age || d.ageMonths / 12);
      const y = parseFloat(d.bmi);
      if (!isNaN(x) && !isNaN(y) && x > 0 && y > 0) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
        n++;
      }
    });
    if (n < 2) return '0.00';
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );
    if (den === 0) return '0.00';
    return (num / den).toFixed(2);
  }, [data]);

  // ---- 4. BMI Histogram ----
  const bmiHistogram = useMemo(() => {
    const bins = [
      { range: '< 16', count: 0, label: '< 16', color: COLORS.error },
      { range: '16-18.5', count: 0, label: '16 – 18.5', color: COLORS.warning },
      { range: '18.5-25', count: 0, label: '18.5 – 25', color: COLORS.success },
      { range: '25-30', count: 0, label: '25 – 30', color: COLORS.warning },
      { range: '30-35', count: 0, label: '30 – 35', color: COLORS.error },
      { range: '35-40', count: 0, label: '35 – 40', color: COLORS.error },
      { range: '> 40', count: 0, label: '> 40', color: COLORS.error },
    ];

    data.forEach((d) => {
      const bmi = parseFloat(d.bmi);
      if (isNaN(bmi)) return;
      if (bmi < 16) bins[0].count++;
      else if (bmi < 18.5) bins[1].count++;
      else if (bmi < 25) bins[2].count++;
      else if (bmi < 30) bins[3].count++;
      else if (bmi < 35) bins[4].count++;
      else if (bmi < 40) bins[5].count++;
      else bins[6].count++;
    });
    return bins;
  }, [data]);

  // ---- 5. Z-Score (SD) Analysis ----
  const zScoreBins = useMemo(() => {
    const bins = [
      { range: '< -3', count: 0, label: '< -3 SD', color: COLORS.error },
      {
        range: '-3 .. -2',
        count: 0,
        label: '-3..-2 SD',
        color: COLORS.warning,
      },
      { range: '-2 .. -1', count: 0, label: '-2..-1 SD', color: COLORS.info },
      {
        range: '-1 .. +1',
        count: 0,
        label: '-1..+1 SD',
        color: COLORS.success,
      },
      {
        range: '+1 .. +2',
        count: 0,
        label: '+1..+2 SD',
        color: COLORS.warning,
      },
      { range: '+2 .. +3', count: 0, label: '+2..+3 SD', color: COLORS.error },
      { range: '> +3', count: 0, label: '> +3 SD', color: COLORS.error },
    ];

    data.forEach((d) => {
      const z = parseFloat(d.zscore);
      if (isNaN(z)) return;
      if (z < -3) bins[0].count++;
      else if (z < -2) bins[1].count++;
      else if (z < -1) bins[2].count++;
      else if (z <= 1) bins[3].count++;
      else if (z <= 2) bins[4].count++;
      else if (z <= 3) bins[5].count++;
      else bins[6].count++;
    });
    return bins;
  }, [data]);

  // ---- 6. Age vs BMI Scatter ----
  const ageBmiScatter = useMemo(() => {
    return data
      .map((d) => {
        const age = parseFloat(d.age || d.ageMonths / 12);
        const bmi = parseFloat(d.bmi);
        return {
          age: !isNaN(age) ? Number(age.toFixed(1)) : null,
          bmi: !isNaN(bmi) ? Number(bmi.toFixed(1)) : null,
          weight: d.weight,
          height: d.height,
          gender: d.gender,
        };
      })
      .filter((d) => d.age !== null && d.bmi !== null);
  }, [data]);

  // ---- 7. Height vs Chest Scatter ----
  const heightChestScatter = useMemo(() => {
    return data
      .map((d) => {
        const height = parseFloat(d.height);
        const chest = parseFloat(d.chest || d.chestCircumference);
        return {
          height: !isNaN(height) ? Number(height.toFixed(1)) : null,
          chest: !isNaN(chest) ? Number(chest.toFixed(1)) : null,
          weight: d.weight,
          bmi: d.bmi,
          gender: d.gender,
        };
      })
      .filter((d) => d.height !== null && d.chest !== null);
  }, [data]);

  // ---- 8. Statistical Percentile Matrix ----
  const percentileTable = useMemo(() => {
    const bmiVals = data
      .map((d) => parseFloat(d.bmi))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);
    const heightVals = data
      .map((d) => parseFloat(d.height))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);
    const weightVals = data
      .map((d) => parseFloat(d.weight))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);

    const perc = (arr, p) => {
      if (!arr.length) return '—';
      const idx = Math.floor((arr.length * p) / 100);
      return arr[Math.min(idx, arr.length - 1)]?.toFixed(1);
    };

    return [10, 25, 50, 75, 90].map((p) => ({
      p: `P${p}`,
      bmi: perc(bmiVals, p),
      height: perc(heightVals, p),
      weight: perc(weightVals, p),
    }));
  }, [data]);

  // ---- 9. Health Risk Groups ----
  const riskGroups = useMemo(() => {
    const counts = {
      normal: 0,
      overweight: 0,
      obese: 0,
      underweight: 0,
    };
    data.forEach((d) => {
      const bmi = parseFloat(d.bmi);
      if (isNaN(bmi)) return;
      if (bmi < 18.5) counts.underweight++;
      else if (bmi < 25) counts.normal++;
      else if (bmi < 30) counts.overweight++;
      else counts.obese++;
    });
    const total = data.length || 1;
    return [
      {
        label: t.normal,
        count: counts.normal,
        pct: Math.round((counts.normal / total) * 100),
        color: COLORS.success,
        risk: t.lowRisk,
      },
      {
        label: t.overweight,
        count: counts.overweight,
        pct: Math.round((counts.overweight / total) * 100),
        color: COLORS.warning,
        risk: t.mediumRisk,
      },
      {
        label: t.obese,
        count: counts.obese,
        pct: Math.round((counts.obese / total) * 100),
        color: COLORS.error,
        risk: t.highRisk,
      },
      {
        label: t.underweight,
        count: counts.underweight,
        pct: Math.round((counts.underweight / total) * 100),
        color: COLORS.info,
        risk: t.observe,
      },
    ];
  }, [data, t]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <GlassCard
        sx={{
          textAlign: 'center',
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: '50%',
            bgcolor: isDark ? 'rgba(20,184,166,0.1)' : 'rgba(15,118,110,0.08)',
          }}
        >
          <ScienceOutlined
            sx={{ fontSize: 56, color: COLORS.primary, opacity: 0.8 }}
          />
        </Box>
        <Typography variant="h6" fontWeight={800}>
          {t.emptyTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={360}>
          {t.emptySub}
        </Typography>
      </GlassCard>
    );
  }

  const showDist = activeTab === 'all' || activeTab === 'dist';
  const showCorr = activeTab === 'all' || activeTab === 'corr';
  const showRisk = activeTab === 'all' || activeTab === 'risk';

  return (
    <Stack spacing={3.5}>
      {/* 1. Scientific Hero Banner */}
      <ScientificHeroBanner
        t={t}
        isDark={isDark}
        totalN={data.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. PRO 3D-Glass Scientific KPI Cards */}
      <ScientificKpiSummary
        t={t}
        isDark={isDark}
        medianBmi={medianBmi}
        avgZScore={avgZScore}
        normalcyRate={normalcyRate}
        pearsonR={pearsonR}
        totalN={data.length}
      />

      {/* 3. AI Scientific Advisor Widget */}
      <ScientificAiAdvisorCard
        t={t}
        isDark={isDark}
        normalcyRate={normalcyRate}
        outlierCount={outlierCount}
      />

      {/* 4. Distribution Section: BMI & Z-Score Histograms */}
      {showDist && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
                title={t.bmiHistogram}
                subtitle={t.bmiHistogramSub}
                badge={
                  <Chip
                    label="WHO Reference: 25.0"
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    }}
                  />
                }
              />
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bmiHistogram}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                      }
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <ReTooltip
                      cursor={{ fill: 'rgba(15,118,110,0.08)' }}
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(15,118,110,0.2)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name={t.patientCount}
                      radius={[6, 6, 0, 0]}
                    >
                      {bmiHistogram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<ScienceOutlined sx={{ color: COLORS.info }} />}
                title={t.zScoreAnalysis}
                subtitle={t.zScoreAnalysisSub}
                badge={
                  <Chip
                    label="Normal: -1..+1 SD"
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    }}
                  />
                }
              />
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={zScoreBins}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                      }
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <ReTooltip
                      cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(59,130,246,0.2)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name={t.patientCount}
                      radius={[6, 6, 0, 0]}
                    >
                      {zScoreBins.map((entry, index) => (
                        <Cell key={`cell-z-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* 5. Correlation Section: Scatter Charts */}
      {showCorr && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<AutoGraphOutlined sx={{ color: COLORS.teal }} />}
                title={t.ageBmiTitle}
                subtitle={t.ageBmiSub}
                badge={
                  <Chip
                    label={`r = ${pearsonR}`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: 'rgba(20,184,166,0.15)',
                      color: COLORS.teal,
                    }}
                  />
                }
              />
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                      }
                    />
                    <XAxis
                      type="number"
                      dataKey="age"
                      name={t.age}
                      unit={t.yearUnit}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="bmi"
                      name="BMI"
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <ReTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(20,184,166,0.2)',
                      }}
                    />
                    <Scatter
                      name={t.patients}
                      data={ageBmiScatter}
                      fill={COLORS.teal}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<BiotechOutlined sx={{ color: COLORS.secondary }} />}
                title={t.heightChestTitle}
                subtitle={t.heightChestSub}
                badge={
                  <Chip
                    label={t.measurements}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: 'rgba(37,99,235,0.15)',
                      color: COLORS.secondary,
                    }}
                  />
                }
              />
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: -10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                      }
                    />
                    <XAxis
                      type="number"
                      dataKey="height"
                      name={t.height}
                      unit={t.cm}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="chest"
                      name={t.chest}
                      unit={t.cm}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <ReTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(37,99,235,0.2)',
                      }}
                    />
                    <Scatter
                      name={t.patients}
                      data={heightChestScatter}
                      fill={COLORS.secondary}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* 6. Risk & Percentile Section: Matrix & Diagnostic Progress Bars */}
      {showRisk && (
        <Grid container spacing={3}>
          {/* Statistical Percentile Matrix */}
          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
                title={t.percentiles}
                subtitle={t.percentilesSub}
              />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        '& th': {
                          fontWeight: 800,
                          color: 'text.secondary',
                          borderBottom: `2px solid ${theme.palette.divider}`,
                        },
                      }}
                    >
                      <TableCell>{t.percentile}</TableCell>
                      <TableCell align="right">BMI</TableCell>
                      <TableCell align="right">{t.height}</TableCell>
                      <TableCell align="right">{t.weight}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {percentileTable.map((row) => (
                      <TableRow
                        key={row.p}
                        sx={{
                          bgcolor:
                            row.p === 'P50'
                              ? isDark
                                ? 'rgba(20,184,166,0.12)'
                                : 'rgba(15,118,110,0.06)'
                              : 'transparent',
                          '& td': {
                            fontWeight: row.p === 'P50' ? 800 : 600,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          },
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Chip
                              label={row.p}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                bgcolor:
                                  row.p === 'P50'
                                    ? COLORS.primary
                                    : isDark
                                      ? 'rgba(255,255,255,0.1)'
                                      : 'rgba(0,0,0,0.06)',
                                color:
                                  row.p === 'P50' ? '#fff' : 'text.primary',
                              }}
                            />
                            {row.p === 'P50' && (
                              <Typography
                                variant="caption"
                                fontWeight={800}
                                color={COLORS.primary}
                              >
                                MEDIAN
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{row.bmi}</TableCell>
                        <TableCell align="right">
                          {row.height}
                          {t.cm}
                        </TableCell>
                        <TableCell align="right">
                          {row.weight}
                          {t.kg}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}
              >
                {t.p50Note}
              </Typography>
            </GlassCard>
          </Grid>

          {/* WHO Diagnostic Health Risk Groups */}
          <Grid item xs={12} md={6}>
            <GlassCard>
              <SectionTitle
                icon={<ScienceOutlined sx={{ color: COLORS.warning }} />}
                title={t.riskGroups}
                subtitle={t.riskGroupsSub}
              />
              <Stack spacing={2.6} mt={1}>
                {riskGroups.map((group, idx) => (
                  <Box key={idx}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.8}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: group.color,
                            boxShadow: `0 0 10px ${group.color}66`,
                          }}
                        />
                        <Typography variant="body2" fontWeight={800}>
                          {group.label}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={group.risk}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            bgcolor: `${group.color}22`,
                            color: group.color,
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={900}
                          color={group.color}
                        >
                          {group.pct}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={group.pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: group.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {group.count} {t.patientsLower}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* Footer Info */}
      <Box textAlign="right" pr={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, opacity: 0.8 }}
        >
          WHO 2007/2006 • {data.length} {t.footerSuffix}
        </Typography>
      </Box>
    </Stack>
  );
}
