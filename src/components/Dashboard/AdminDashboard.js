// src/components/Dashboard/AdminDashboard.js
// Oddiy Admin uchun pro darajadagi analitika, somatotip, AI maslahatchi va 8 ta tilda to'liq qo'llab-quvvatlovchi dashboard
import React, { useMemo, useState } from 'react';
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
  Tabs,
  Tab,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  PersonAdd,
  TrendingUp,
  MonitorWeightOutlined,
  DateRangeOutlined,
  FmdGoodOutlined,
  ReportProblemOutlined,
  CheckCircle,
  AutoGraphOutlined,
  BiotechOutlined,
  ScienceOutlined,
  AccessibilityNewOutlined,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';
import { ADMIN_DASH_I18N } from './adminDashI18n';

const COLORS = {
  primary: '#0f766e',
  secondary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  teal: '#14b8a6',
  rose: '#f43f5e',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  ink: '#0f172a',
};

const PIE_COLORS = ['#3b82f6', '#f43f5e', '#14b8a6'];

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

const getRegionLabel = (value, lang) => {
  return getLocalizedLocationLabel(value, lang, 1) || value || '-';
};

const GlassCard = ({ children, sx = {}, hover = true }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={
        hover
          ? {
              y: -4,
              scale: 1.006,
              transition: { duration: 0.2 },
            }
          : {}
      }
      style={{ height: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(15,23,42,0.86), rgba(30,41,59,0.72))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))',
          backdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: isDark
            ? 'rgba(148,163,184,0.18)'
            : 'rgba(15,118,110,0.14)',
          boxShadow: isDark
            ? '0 20px 48px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 18px 46px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.85)',
          ...sx,
        }}
      >
        {children}
      </Paper>
    </motion.div>
  );
};

const KpiCard = ({ label, value, sub, icon, color, loading, badgeText }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <GlassCard
      sx={{
        minHeight: 156,
        borderTop: `4px solid ${color}`,
        background: isDark
          ? `linear-gradient(180deg, ${color}16 0%, rgba(15,23,42,0.85) 75%)`
          : `linear-gradient(180deg, ${color}12 0%, rgba(255,255,255,0.95) 75%)`,
      }}
    >
      {loading ? (
        <CircularProgress size={24} sx={{ color }} />
      ) : (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          height="100%"
        >
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            height="100%"
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 1.1,
                  fontSize: '0.68rem',
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ color, mt: 0.6, lineHeight: 1.1, letterSpacing: -0.5 }}
              >
                {value ?? '—'}
              </Typography>
            </Box>
            <Box mt={1.5}>
              {badgeText && (
                <Chip
                  label={badgeText}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.66rem',
                    bgcolor: `${color}18`,
                    color: color,
                    mb: 0.5,
                  }}
                />
              )}
              {sub && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  fontWeight={500}
                >
                  {sub}
                </Typography>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              p: 1.4,
              borderRadius: 2.5,
              background: isDark ? `${color}24` : `${color}16`,
              color,
              display: 'flex',
              boxShadow: `0 8px 20px ${color}20`,
            }}
          >
            {icon}
          </Box>
        </Box>
      )}
    </GlassCard>
  );
};

const SectionTitle = ({ title, subtitle, icon }) => (
  <Box mb={2.5} display="flex" alignItems="center" gap={1.2}>
    {icon && (
      <Box
        sx={{
          p: 0.8,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          color: '#fff',
          display: 'flex',
        }}
      >
        {icon}
      </Box>
    )}
    <Box>
      <Typography
        variant="h6"
        fontWeight={900}
        sx={{
          color: 'text.primary',
          letterSpacing: -0.3,
          lineHeight: 1.25,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

const getTooltipStyle = (isDark) => ({
  contentStyle: {
    borderRadius: '14px',
    border: 'none',
    boxShadow: isDark
      ? '0 16px 32px -4px rgba(0, 0, 0, 0.55)'
      : '0 16px 32px -4px rgba(0, 0, 0, 0.12)',
    background: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(12px)',
    color: isDark ? '#f8fafc' : '#1e293b',
    fontSize: '13px',
    padding: '12px 16px',
    borderLeft: isDark ? '4px solid #14b8a6' : '4px solid #0f766e',
  },
  itemStyle: {
    color: isDark ? '#f1f5f9' : '#334155',
    padding: '3px 0',
    fontWeight: 600,
  },
  labelStyle: {
    color: isDark ? '#5eead4' : '#0f766e',
    fontWeight: 900,
    marginBottom: '6px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  cursor: {
    stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
    strokeWidth: 2,
  },
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
  const isDark = theme.palette.mode === 'dark';
  const { lang } = useLanguage();
  const t = ADMIN_DASH_I18N[lang] || ADMIN_DASH_I18N.uz;
  const locale = localeByLang[lang] || 'uz-UZ';
  const customTooltip = useMemo(() => getTooltipStyle(isDark), [isDark]);

  // Dashboard ichki filter paneli (Barcha ko'rsatkichlar / Xavf guruhi / Normal)
  const [activeFilterMode, setActiveFilterMode] = useState('all');
  const [aiTab, setAiTab] = useState(0);

  // Filterlangan ma'lumotlar to'plami
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    if (activeFilterMode === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return data.filter(
        (r) => r.createdAt && r.createdAt.startsWith(todayStr)
      );
    }
    if (activeFilterMode === 'normal') {
      return data.filter((r) => {
        const bmi = parseFloat(r.bmi);
        return bmi >= 18.5 && bmi < 25;
      });
    }
    if (activeFilterMode === 'risk') {
      return data.filter((r) => {
        const bmi = parseFloat(r.bmi);
        return bmi < 18.5 || bmi >= 25;
      });
    }
    return data;
  }, [data, activeFilterMode]);

  // Derive statistics from loaded data (admin's own data)
  const localStats = useMemo(() => {
    const targetData = filteredData.length ? filteredData : data;
    if (!targetData.length)
      return {
        avgBmi: 0,
        maleCount: 0,
        femaleCount: 0,
        unknownCount: 0,
        avgAge: 0,
        bmiCategories: [],
        somatotypes: [],
        healthScore: 100,
        riskRate: 0,
        normalcyRate: 0,
      };

    const maleCount = targetData.filter((r) => {
      const g = (r.gender || '').toLowerCase();
      return (
        g === 'erkak' ||
        g === 'male' ||
        g === 'm' ||
        g === 'boy' ||
        g.includes("o'g'il") ||
        g.includes("о'ғил")
      );
    }).length;
    const femaleCount = targetData.filter((r) => {
      const g = (r.gender || '').toLowerCase();
      return (
        g === 'ayol' ||
        g === 'female' ||
        g === 'f' ||
        g === 'girl' ||
        g.includes('qiz') ||
        g.includes('қиз')
      );
    }).length;
    const unknownCount = targetData.length - maleCount - femaleCount;

    const bmiValues = targetData
      .filter((r) => r.bmi && !isNaN(r.bmi))
      .map((r) => parseFloat(r.bmi));
    const avgBmi = bmiValues.length
      ? (bmiValues.reduce((s, v) => s + v, 0) / bmiValues.length).toFixed(1)
      : 0;

    const ageValues = targetData
      .filter((r) => r.age && !isNaN(r.age))
      .map((r) => Number(r.age));
    const avgAge = ageValues.length
      ? Math.round(ageValues.reduce((s, v) => s + v, 0) / ageValues.length)
      : 0;

    const normal = bmiValues.filter((v) => v >= 18.5 && v < 25).length;
    const underweight = bmiValues.filter((v) => v < 18.5).length;
    const overweight = bmiValues.filter((v) => v >= 25 && v < 30).length;
    const obese = bmiValues.filter((v) => v >= 30).length;
    const bmiTotal = bmiValues.length || 1;

    // Somatotip hisoblash (yoki r.somatotype dan olish)
    let endomorph = 0;
    let mesomorph = 0;
    let ectomorph = 0;
    targetData.forEach((r) => {
      if (r.somatotype) {
        const s = String(r.somatotype).toLowerCase();
        if (s.includes('endo')) endomorph++;
        else if (s.includes('ekto') || s.includes('ecto')) ectomorph++;
        else mesomorph++;
      } else {
        const b = parseFloat(r.bmi);
        if (b >= 25) endomorph++;
        else if (b < 18.5) ectomorph++;
        else mesomorph++;
      }
    });

    const totalSoma = targetData.length || 1;
    const endoPct = Math.round((endomorph / totalSoma) * 100);
    const mesoPct = Math.round((mesomorph / totalSoma) * 100);
    const ectoPct = Math.round((ectomorph / totalSoma) * 100);

    const normalPct = Math.round((normal / bmiTotal) * 100);
    const riskRate = Math.round(((overweight + obese) / bmiTotal) * 100);
    const normalcyRate = normalPct;

    // Integratsiyalashgan salomatlik indeksi (0-100)
    const healthScore = Math.min(
      100,
      Math.max(10, Math.round(normalPct * 0.75 + (100 - riskRate) * 0.25))
    );

    return {
      avgBmi,
      maleCount,
      femaleCount,
      unknownCount,
      avgAge,
      healthScore,
      riskRate,
      normalcyRate,
      bmiCategories: [
        {
          name: t.normal,
          pct: normalPct,
          count: normal,
          color: COLORS.success,
        },
        {
          name: t.overweight,
          pct: Math.round((overweight / bmiTotal) * 100),
          count: overweight,
          color: COLORS.warning,
        },
        {
          name: t.obese,
          pct: Math.round((obese / bmiTotal) * 100),
          count: obese,
          color: COLORS.error,
        },
        {
          name: t.underweight,
          pct: Math.round((underweight / bmiTotal) * 100),
          count: underweight,
          color: COLORS.info,
        },
      ],
      somatotypes: [
        { name: t.endomorph, value: endoPct, count: endomorph, fullMark: 100 },
        { name: t.mesomorph, value: mesoPct, count: mesomorph, fullMark: 100 },
        { name: t.ectomorph, value: ectoPct, count: ectomorph, fullMark: 100 },
      ],
      dominantSomatotype: [
        { name: t.endomorph, value: endoPct, count: endomorph },
        { name: t.mesomorph, value: mesoPct, count: mesomorph },
        { name: t.ectomorph, value: ectoPct, count: ectomorph },
      ].sort((a, b) => b.value - a.value)[0],
      stats: {
        normalPct,
        riskPct: riskRate,
        underweightPct: Math.round((underweight / bmiTotal) * 100),
      },
    };
  }, [data, filteredData, t]);

  // AI maslahatchi xulosalari va tavsiyalari
  const aiIntelligence = useMemo(() => {
    const targetData = filteredData.length ? filteredData : data;
    if (!targetData.length)
      return { insights: [], risks: [], recommendations: [] };
    const { stats: s, avgBmi, somatotypes } = localStats;
    const insights = [];
    const risks = [];
    const recommendations = [];

    if (s.normalPct > 60) insights.push(t.insightNormal);
    if (avgBmi > 25) insights.push(t.insightBmi(avgBmi));

    const maleCount = stats?.by_gender?.erkak ?? localStats.maleCount;
    const femaleCount = stats?.by_gender?.ayol ?? localStats.femaleCount;
    const unknownCount =
      stats?.by_gender?.["noma'lum"] ?? localStats.unknownCount;
    const totalN = maleCount + femaleCount + unknownCount;

    const malePct = totalN > 0 ? Math.round((maleCount / totalN) * 100) : 0;
    const femalePct = totalN > 0 ? Math.round((femaleCount / totalN) * 100) : 0;
    insights.push(t.insightGender(malePct, femalePct));

    // Xavf signallari
    if (s.riskPct > 40) {
      risks.push(t.insightRisk);
    } else {
      risks.push(t.noAlerts);
    }

    // Dominant somatotip bo'yicha tavsiya
    const dominant = [...somatotypes].sort((a, b) => b.value - a.value)[0];
    if (dominant) {
      recommendations.push(t.dominantSomatotype(dominant.name, dominant.value));
    }
    if (s.normalPct > 50) recommendations.push(t.recNormal);
    if (s.riskPct > 30) recommendations.push(t.recRisk);

    return { insights, risks, recommendations };
  }, [data, filteredData, localStats, stats?.by_gender, t]);

  const genderData = useMemo(
    () =>
      [
        {
          name: t.male,
          value: stats?.by_gender?.erkak ?? localStats.maleCount,
        },
        {
          name: t.female,
          value: stats?.by_gender?.ayol ?? localStats.femaleCount,
        },
        {
          name: t.unknown,
          value: stats?.by_gender?.["noma'lum"] ?? localStats.unknownCount,
        },
      ].filter((d) => d.value > 0),
    [localStats, stats, t]
  );

  const ageGroupData = useMemo(() => {
    const targetData = filteredData.length ? filteredData : data;
    const groups = {
      '0-10': 0,
      '11-20': 0,
      '21-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0,
    };
    targetData.forEach((r) => {
      const age = Number(r.age);
      if (age <= 10) groups['0-10']++;
      else if (age <= 20) groups['11-20']++;
      else if (age <= 35) groups['21-35']++;
      else if (age <= 50) groups['36-50']++;
      else if (age <= 65) groups['51-65']++;
      else groups['65+']++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [data, filteredData]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const targetData = filteredData.length ? filteredData : data;
    const byDate = {};
    targetData.forEach((r) => {
      if (r.createdAt) {
        const d = r.createdAt.split('T')[0];
        byDate[d] = (byDate[d] || 0) + 1;
      }
    });
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => {
        const [, m, day] = date.split('-');
        return { date: `${day}.${m}`, count };
      });
  }, [data, filteredData]);

  // Risk regions
  const riskRegionRows = useMemo(() => {
    const targetData = filteredData.length ? filteredData : data;
    const byReg = {};
    targetData.forEach((r) => {
      const reg = r.region || r.location || r.district || '-';
      if (!byReg[reg]) byReg[reg] = { total: 0, risk: 0 };
      byReg[reg].total++;
      const bmi = parseFloat(r.bmi);
      const zs = parseFloat(r.zscore);
      if (bmi < 18.5 || bmi >= 25 || (zs && Math.abs(zs) >= 2)) {
        byReg[reg].risk++;
      }
    });
    return Object.entries(byReg)
      .map(([region, val]) => ({
        region,
        regionLabel: getRegionLabel(region, lang),
        total: val.total,
        count: val.risk,
        risk_rate: val.total > 0 ? Math.round((val.risk / val.total) * 100) : 0,
      }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [data, filteredData, lang]);

  const todayCount = useMemo(() => {
    const targetData = filteredData.length ? filteredData : data;
    const todayStr = new Date().toISOString().split('T')[0];
    return targetData.filter(
      (r) => r.createdAt && r.createdAt.startsWith(todayStr)
    ).length;
  }, [data, filteredData]);

  const healthStatusInfo = useMemo(() => {
    const score = localStats.healthScore;
    if (score >= 80) return { label: t.optimal, color: COLORS.success };
    if (score >= 65) return { label: t.good, color: COLORS.info };
    if (score >= 50) return { label: t.needsAttention, color: COLORS.warning };
    return { label: t.critical, color: COLORS.error };
  }, [localStats.healthScore, t]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* ===== 1. HERO COMMAND HEADER BANNER & HEALTH SCORE ===== */}
      <GlassCard
        hover={false}
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          position: 'relative',
          overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(135deg, rgba(15, 118, 110, 0.16) 0%, rgba(15, 23, 42, 0.94) 60%, rgba(37, 99, 235, 0.14) 100%)'
            : 'linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(255, 255, 255, 0.98) 60%, rgba(37, 99, 235, 0.08) 100%)',
          border: '1px solid',
          borderColor: isDark
            ? 'rgba(94, 234, 212, 0.22)'
            : 'rgba(15, 118, 110, 0.18)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Chip
                icon={
                  <BiotechOutlined
                    style={{ fontSize: 16, color: COLORS.primary }}
                  />
                }
                label={t.aiActive}
                size="small"
                sx={{
                  fontWeight: 800,
                  bgcolor: isDark
                    ? 'rgba(20, 184, 166, 0.16)'
                    : 'rgba(15, 118, 110, 0.12)',
                  color: isDark ? '#5eead4' : '#0f766e',
                  border: '1px solid',
                  borderColor: isDark
                    ? 'rgba(94, 234, 212, 0.3)'
                    : 'rgba(15, 118, 110, 0.25)',
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                MORPHO CHECK PRO V3.2
              </Typography>
            </Box>

            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, #fff 30%, #5eead4 100%)'
                  : 'linear-gradient(135deg, #0f172a 30%, #0f766e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.5,
                lineHeight: 1.2,
                mb: 0.8,
              }}
            >
              {t.welcome(userName)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ maxWidth: 580, lineHeight: 1.6, mb: 2.5 }}
            >
              {t.subtitle}. {t.desc}
            </Typography>

            {/* Header tezkor filter tugmalari */}
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {[
                { id: 'all', label: t.filterAll },
                { id: 'today', label: t.filterToday },
                { id: 'normal', label: t.filterNormal },
                { id: 'risk', label: t.filterRisk },
              ].map((pill) => (
                <Chip
                  key={pill.id}
                  label={pill.label}
                  clickable
                  onClick={() => setActiveFilterMode(pill.id)}
                  color={activeFilterMode === pill.id ? 'primary' : 'default'}
                  variant={activeFilterMode === pill.id ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 800,
                    px: 0.8,
                    py: 1.8,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor:
                      activeFilterMode === pill.id
                        ? 'primary.main'
                        : isDark
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(0,0,0,0.12)',
                  }}
                />
              ))}
            </Stack>
          </Grid>

          {/* O'ng tomon: Kogorta Salomatlik Indeksi Gaugesi */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: isDark
                  ? 'rgba(15, 23, 42, 0.72)'
                  : 'rgba(255, 255, 255, 0.85)',
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={800}
                  textTransform="uppercase"
                >
                  {t.healthIndexTitle}
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{ color: healthStatusInfo.color, mt: 0.3 }}
                >
                  {localStats.healthScore}
                  <Box
                    component="span"
                    sx={{
                      fontSize: '1rem',
                      color: 'text.secondary',
                      fontWeight: 600,
                    }}
                  >
                    /100
                  </Box>
                </Typography>
                <Chip
                  label={healthStatusInfo.label}
                  size="small"
                  sx={{
                    mt: 0.8,
                    fontWeight: 800,
                    bgcolor: `${healthStatusInfo.color}18`,
                    color: healthStatusInfo.color,
                  }}
                />
              </Box>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={localStats.healthScore}
                  size={100}
                  thickness={6}
                  sx={{ color: healthStatusInfo.color }}
                />
                <AutoGraphOutlined
                  sx={{
                    position: 'absolute',
                    fontSize: 32,
                    color: healthStatusInfo.color,
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </GlassCard>

      {/* ===== 2. 6 TA ULTRAPREMIUM KPI CARDS ===== */}
      <Grid container spacing={2.5} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            label={t.totalMine}
            value={
              stats
                ? (stats.total_analyses?.toLocaleString(locale) ?? '0')
                : totalCount.toLocaleString(locale)
            }
            sub={t.allTime}
            icon={<PersonAdd fontSize="medium" />}
            color={COLORS.primary}
            loading={loading}
            badgeText={t.groupWide}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            label={t.todayEntered}
            value={stats ? (stats.today_analyses ?? 0) : todayCount}
            sub={t.todaySession}
            icon={<DateRangeOutlined fontSize="medium" />}
            color={COLORS.success}
            loading={loading}
            badgeText="LIVE STREAM"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            label={t.avgBmi}
            value={
              stats && stats.avg_bmi
                ? parseFloat(stats.avg_bmi).toFixed(1)
                : localStats.avgBmi
            }
            sub={t.whoReference}
            icon={<MonitorWeightOutlined fontSize="medium" />}
            color={COLORS.info}
            loading={loading}
            badgeText={`${t.vsGroupAvg}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            label={t.avgAge}
            value={`${localStats.avgAge} ${t.years}`}
            sub={t.ageGroupsSub}
            icon={<TrendingUp fontSize="medium" />}
            color={COLORS.secondary}
            loading={loading}
            badgeText={t.patients}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            label={t.riskRateTitle}
            value={`${localStats.riskRate}%`}
            sub={t.riskRegionsSub}
            icon={<ReportProblemOutlined fontSize="medium" />}
            color={COLORS.error}
            loading={loading}
            badgeText={t.riskAlert}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiCard
            label={t.normalcyRateTitle}
            value={`${localStats.normalcyRate}%`}
            sub={t.whoReference}
            icon={<CheckCircle fontSize="medium" />}
            color={COLORS.teal}
            loading={loading}
            badgeText={t.healthyGroup}
          />
        </Grid>
      </Grid>

      {/* ===== 3. NEW: SOMATOTYPE RADAR CHART & AI CLINICAL ADVISOR ===== */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          <GlassCard>
            <SectionTitle
              title={t.somatotypeTitle}
              subtitle={t.somatotypeSub}
              icon={<AccessibilityNewOutlined />}
            />
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  data={localStats.somatotypes}
                >
                  <PolarGrid
                    stroke={
                      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                    }
                  />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{
                      fill: isDark ? '#cbd5e1' : '#334155',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
                  <Radar
                    name={t.patients}
                    dataKey="value"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.45}
                  />
                  <ReTooltip {...customTooltip} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
            <Box
              sx={{
                p: 2,
                mt: 1,
                borderRadius: 2,
                bgcolor: isDark
                  ? 'rgba(20,184,166,0.12)'
                  : 'rgba(15,118,110,0.06)',
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(94,234,212,0.2)'
                  : 'rgba(15,118,110,0.15)',
              }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ color: isDark ? '#5eead4' : '#0f766e' }}
              >
                {localStats.dominantSomatotype
                  ? t.dominantSomatotype(
                      localStats.dominantSomatotype.name,
                      localStats.dominantSomatotype.value
                    )
                  : t.noEnoughData}
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <GlassCard>
            <SectionTitle
              title={t.aiAdvisorTitle}
              subtitle={t.aiAdvisorSub}
              icon={<BiotechOutlined />}
            />
            <Tabs
              value={aiTab}
              onChange={(e, v) => setAiTab(v)}
              variant="fullWidth"
              sx={{
                mb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 800,
                  textTransform: 'none',
                  fontSize: '0.88rem',
                },
              }}
            >
              <Tab label={t.tabInsights} />
              <Tab label={t.tabRisks} />
              <Tab label={t.tabRecommendations} />
            </Tabs>

            <Box sx={{ minHeight: 220 }}>
              {aiTab === 0 && (
                <Stack spacing={1.5}>
                  {aiIntelligence.insights.length ? (
                    aiIntelligence.insights.map((text, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.8,
                          borderRadius: 2,
                          bgcolor: isDark
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
                          borderLeft: `4px solid ${COLORS.primary}`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          {text}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      {t.noEnoughData}
                    </Typography>
                  )}
                </Stack>
              )}

              {aiTab === 1 && (
                <Stack spacing={1.5}>
                  {aiIntelligence.risks.map((text, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.8,
                        borderRadius: 2,
                        bgcolor: isDark
                          ? 'rgba(239,68,68,0.08)'
                          : 'rgba(239,68,68,0.04)',
                        borderLeft: `4px solid ${COLORS.error}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="error.main"
                      >
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}

              {aiTab === 2 && (
                <Stack spacing={1.5}>
                  {aiIntelligence.recommendations.length ? (
                    aiIntelligence.recommendations.map((text, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.8,
                          borderRadius: 2,
                          bgcolor: isDark
                            ? 'rgba(37,99,235,0.1)'
                            : 'rgba(37,99,235,0.05)',
                          borderLeft: `4px solid ${COLORS.secondary}`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                        >
                          {text}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      {t.noEnoughData}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== 4. BMI SALOMATLIK SPEKTRI (HORIZONTAL SEGMENTED BAR) ===== */}
      <GlassCard sx={{ mb: 4 }}>
        <SectionTitle
          title={t.bmiSpectrumTitle}
          subtitle={t.bmiSpectrumSub}
          icon={<ScienceOutlined />}
        />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            height: 20,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            mb: 3,
          }}
        >
          {localStats.bmiCategories.map((cat, idx) => (
            <MuiTooltip
              key={idx}
              title={`${cat.name}: ${cat.pct}% (${cat.count} ${t.unit})`}
            >
              <Box
                sx={{
                  width: `${Math.max(cat.pct, 4)}%`,
                  bgcolor: cat.color,
                  transition: 'width 0.4s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.85,
                  },
                }}
              />
            </MuiTooltip>
          ))}
        </Stack>

        <Grid container spacing={2}>
          {localStats.bmiCategories.map((cat, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                  bgcolor: `${cat.color}10`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    color="text.secondary"
                    textTransform="uppercase"
                  >
                    {cat.name}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    sx={{ color: cat.color, mt: 0.5 }}
                  >
                    {cat.pct}%
                  </Typography>
                </Box>
                <Chip
                  label={`${cat.count} ${t.unit}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: `${cat.color}22`,
                    color: cat.color,
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </GlassCard>

      {/* ===== 5. REGIONAL RISK ALERT CARDS (LOCALIZED) ===== */}
      {riskRegionRows.length > 0 && (
        <GlassCard sx={{ mb: 4 }}>
          <SectionTitle
            title={t.riskRegions}
            subtitle={t.riskRegionsSub}
            icon={<FmdGoodOutlined />}
          />
          <Grid container spacing={2}>
            {riskRegionRows.map((row) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={row.region}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isDark
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(239, 68, 68, 0.04)',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" gap={2}>
                    <Box display="flex" gap={1.2} alignItems="center">
                      <FmdGoodOutlined color="error" fontSize="small" />
                      <Typography variant="body2" fontWeight={800}>
                        {row.regionLabel}
                      </Typography>
                    </Box>
                    <ReportProblemOutlined
                      sx={{ color: COLORS.error }}
                      fontSize="small"
                    />
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    color="error.main"
                    mt={1}
                  >
                    {row.count} {t.unit}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {row.total} {t.from} — {row.risk_rate}% {t.risk}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(row.risk_rate, 100)}
                    sx={{
                      mt: 1.2,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(239,68,68,0.12)',
                      '& .MuiLinearProgress-bar': { bgcolor: COLORS.error },
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </GlassCard>
      )}

      {/* ===== 6. DAILY TREND AREA CHART ===== */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12 }}>
          <GlassCard>
            <SectionTitle
              title={t.dailyDynamics}
              subtitle={t.dailyDynamicsSub}
              icon={<TrendingUp />}
            />
            {dailyTrend.length === 0 ? (
              <Box py={8} textAlign="center">
                <Typography color="text.secondary">{t.noResult}</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient
                        id="adminGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.primary}
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.primary}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={
                        isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                      }
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      allowDecimals={false}
                    />
                    <ReTooltip {...customTooltip} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name={t.entered}
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      fill="url(#adminGrad)"
                      dot={{
                        r: 5,
                        fill: COLORS.primary,
                        strokeWidth: 2,
                        stroke: '#fff',
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== 7. TRIPLE DISTRIBUTION CHARTS (GENDER, AGE, BMI CATEGORIES) ===== */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              title={t.genderDistribution}
              subtitle={t.genderDistributionSub}
            />
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={6}
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
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: PIE_COLORS[i],
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={600}
                      >
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
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle title={t.ageGroups} subtitle={t.ageGroupsSub} />
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={
                      isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                    }
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    allowDecimals={false}
                  />
                  <ReTooltip {...customTooltip} />
                  <Bar
                    dataKey="value"
                    name={t.patients}
                    fill={COLORS.secondary}
                    radius={[8, 8, 0, 0]}
                    barSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle title={t.bmiStatus} subtitle={t.bmiStatusSub} />
            <Stack spacing={2.5} mt={1}>
              {localStats.bmiCategories.map((cat) => (
                <Box key={cat.name}>
                  <Box display="flex" justifyContent="space-between" mb={0.8}>
                    <Typography variant="body2" fontWeight={800}>
                      {cat.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={900}
                      color={cat.color}
                    >
                      {cat.pct}% ({cat.count})
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cat.pct}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: cat.color,
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
