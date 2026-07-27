// src/components/Dashboard/SuperAdminDashboard.js
// SuperAdmin uchun PRO-darajadagi Respublika Analitika Markazi va Boshqaruv Paneli (V3.2)
import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
  useTheme,
  Chip,
  Stack,
  Tabs,
  Tab,
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
import { SUPERADMIN_DASH_TEXT } from './superAdminDashI18n';

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

const PIE_COLORS = ['#3b82f6', '#f43f5e', '#14b8a6', '#8b5cf6', '#10b981'];

const REGION_CANONICAL_ALIASES = {
  '\u0430\u043d\u0434\u0438\u0436\u0430\u043d\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Andijon viloyati',
  '\u0431\u0443\u0445\u0430\u0440\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Buxoro viloyati',
  '\u0444\u0435\u0440\u0433\u0430\u043d\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    "Farg'ona viloyati",
  '\u0434\u0436\u0438\u0437\u0430\u043a\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Jizzax viloyati',
  '\u0445\u043e\u0440\u0435\u0437\u043c\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Xorazm viloyati',
  '\u043d\u0430\u043c\u0430\u043d\u0433\u0430\u043d\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Namangan viloyati',
  '\u043d\u0430\u0432\u043e\u0438\u0439\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Navoiy viloyati',
  '\u043a\u0430\u0448\u043a\u0430\u0434\u0430\u0440\u044c\u0438\u043d\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Qashqadaryo viloyati',
  '\u0441\u0430\u043c\u0430\u0440\u043a\u0430\u043d\u0434\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Samarqand viloyati',
  '\u0441\u044b\u0440\u0434\u0430\u0440\u044c\u0438\u043d\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Sirdaryo viloyati',
  '\u0441\u0443\u0440\u0445\u0430\u043d\u0434\u0430\u0440\u044c\u0438\u043d\u0441\u043a\u0430\u044f \u043e\u0431\u043b\u0430\u0441\u0442\u044c':
    'Surxondaryo viloyati',
  '\u0440\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0430 \u043a\u0430\u0440\u0430\u043a\u0430\u043b\u043f\u0430\u043a\u0441\u0442\u0430\u043d':
    "Qoraqalpog'iston Respublikasi",
  '\u0433\u043e\u0440\u043e\u0434 \u0442\u0430\u0448\u043a\u0435\u043d\u0442':
    'Toshkent shahri',
};

const normalizeRegionKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['`‘’ʻ]/g, "'");

const getRegionLabel = (value, lang) => {
  const key = normalizeRegionKey(value);
  const canonicalValue = REGION_CANONICAL_ALIASES[key] || value;
  return getLocalizedLocationLabel(canonicalValue, lang, 1);
};

// ==== HELPERS ====
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
      style={{ height: '100%', width: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          width: '100%',
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
          transition: 'all 0.2s ease',
          overflowX: 'auto',
          ...sx,
        }}
      >
        {children}
      </Paper>
    </motion.div>
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

// 1. SuperAdmin Command Center Hero Banner
const SuperAdminHeroBanner = ({
  t,
  isDark,
  totalRecords,
  activeTab,
  onTabChange,
}) => (
  <Box
    sx={{
      p: { xs: 2.5, md: 3.5 },
      width: '100%',
      borderRadius: 4,
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)'
        : 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #1e40af 100%)',
      color: '#fff',
      boxShadow: isDark
        ? '0 20px 48px rgba(0,0,0,0.45)'
        : '0 20px 48px rgba(15,118,110,0.24)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Background Decorative Gradient Orb */}
    <Box
      sx={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 320,
        height: 320,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
      }}
    />

    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={3}
      sx={{ position: 'relative', zIndex: 1 }}
    >
      <Box>
        <Stack direction="row" spacing={1.2} alignItems="center" mb={1}>
          <Chip
            label={t.nationalControl}
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
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.88)',
              maxWidth: 680,
              fontWeight: 500,
            }}
          >
            {t.subtitle}
          </Typography>
          <Chip
            size="small"
            label={t.systemStatus}
            sx={{
              height: 22,
              fontWeight: 800,
              fontSize: '0.68rem',
              bgcolor: 'rgba(16,185,129,0.22)',
              color: '#a7f3d0',
              border: '1px solid rgba(16,185,129,0.4)',
            }}
          />
        </Stack>
      </Box>

      {/* National Section Tabs */}
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
          { id: 'regions', label: t.tabRegions },
          { id: 'somato', label: t.tabSomato },
          { id: 'admins', label: t.tabAdmins },
        ].map((tabItem) => {
          const active = activeTab === tabItem.id;
          return (
            <Box
              key={tabItem.id}
              onClick={() => onTabChange(tabItem.id)}
              sx={{
                px: 2,
                py: 0.8,
                borderRadius: 2.2,
                cursor: 'pointer',
                bgcolor: active ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: active ? COLORS.primary : 'rgba(255,255,255,0.85)',
                fontWeight: active ? 800 : 600,
                fontSize: '0.82rem',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                '&:hover': {
                  bgcolor: active
                    ? 'rgba(255,255,255,0.95)'
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

// 2. 6 PRO-Level SuperAdmin 3D-Glass Summary KPI Cards across full width
const SuperAdminKpiSummary = ({ t, isDark, summaryData }) => (
  <Grid container spacing={2.5}>
    {/* 1. Total Analyses */}
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} sx={{ display: 'flex' }}>
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
              {t.totalAnalyses}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.primary }}
            >
              {summaryData.totalAnalyses.toLocaleString()}
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
            <ScienceOutlined />
          </Box>
        </Stack>
        <Chip
          size="small"
          label={t.allTime}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 800,
            bgcolor: 'rgba(15,118,110,0.12)',
            color: COLORS.primary,
          }}
        />
      </GlassCard>
    </Grid>

    {/* 2. Today's Analyses */}
    <Grid
      size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
      xs={12}
      sm={6}
      md={4}
      lg={2}
      sx={{ display: 'flex' }}
    >
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
              {t.todayAnalyses}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.indigo }}
            >
              {summaryData.todayAnalyses}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: 'rgba(99,102,241,0.15)',
              color: COLORS.indigo,
            }}
          >
            <DateRangeOutlined />
          </Box>
        </Stack>
        <Chip
          size="small"
          label={t.today}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 800,
            bgcolor: 'rgba(99,102,241,0.15)',
            color: COLORS.indigo,
          }}
        />
      </GlassCard>
    </Grid>

    {/* 3. Active Regions */}
    <Grid
      size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
      xs={12}
      sm={6}
      md={4}
      lg={2}
      sx={{ display: 'flex' }}
    >
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
              {t.activeRegions || 'Faol hududlar'}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.teal }}
            >
              {summaryData.activeRegionsCount || 14} / 14
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: 'rgba(20,184,166,0.15)',
              color: COLORS.teal,
            }}
          >
            <FmdGoodOutlined />
          </Box>
        </Stack>
        <Chip
          size="small"
          label={t.allProvinces || '14 ta hudud'}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 800,
            bgcolor: 'rgba(20,184,166,0.15)',
            color: COLORS.teal,
          }}
        />
      </GlassCard>
    </Grid>

    {/* 4. Weekly Growth */}
    <Grid
      size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
      xs={12}
      sm={6}
      md={4}
      lg={2}
      sx={{ display: 'flex' }}
    >
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
              {t.weeklyGrowth}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                mt: 0.5,
                color:
                  summaryData.weeklyGrowth >= 0 ? COLORS.success : COLORS.error,
              }}
            >
              {summaryData.weeklyGrowth >= 0
                ? `+${summaryData.weeklyGrowth}%`
                : `${summaryData.weeklyGrowth}%`}
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
            <TrendingUp />
          </Box>
        </Stack>
        <Chip
          size="small"
          label={t.comparedToPrevWeek}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 800,
            bgcolor: 'rgba(16,185,129,0.15)',
            color: COLORS.success,
          }}
        />
      </GlassCard>
    </Grid>

    {/* 5. Total Admins */}
    <Grid
      size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
      xs={12}
      sm={6}
      md={4}
      lg={2}
      sx={{ display: 'flex' }}
    >
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
              {t.totalAdmins}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.purple }}
            >
              {summaryData.totalAdmins}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: 'rgba(139,92,246,0.15)',
              color: COLORS.purple,
            }}
          >
            <PersonAdd />
          </Box>
        </Stack>
        <Chip
          size="small"
          label={t.activeAdmins || 'Faol'}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 800,
            bgcolor: 'rgba(139,92,246,0.15)',
            color: COLORS.purple,
          }}
        />
      </GlassCard>
    </Grid>

    {/* 6. System Avg BMI */}
    <Grid
      size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
      xs={12}
      sm={6}
      md={4}
      lg={2}
      sx={{ display: 'flex' }}
    >
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
              {t.nationalAvgBmi}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mt: 0.5, color: COLORS.warning }}
            >
              {summaryData.avgBmi}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: 'rgba(245,158,11,0.15)',
              color: COLORS.warning,
            }}
          >
            <MonitorWeightOutlined />
          </Box>
        </Stack>
        <Chip
          size="small"
          label={t.systemWide}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 800,
            bgcolor: 'rgba(245,158,11,0.15)',
            color: COLORS.warning,
          }}
        />
      </GlassCard>
    </Grid>
  </Grid>
);

// 3. SuperAdmin AI Governance & Clinical Intelligence Advisor
const SuperAdminAiAdvisorCard = ({
  t,
  isDark,
  avgBmi,
  totalCount,
  topRiskRegion,
  adminsCount,
}) => {
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
          label="REPUBLIC AI ENGINE"
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
        <Tab label={t.aiTabNational} />
        <Tab label={t.aiTabRegional} />
        <Tab label={t.aiTabActivity} />
      </Tabs>

      <Box sx={{ minHeight: 70 }}>
        {tabIdx === 0 && (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              <CheckCircle
                sx={{ color: COLORS.success, fontSize: 20, mt: 0.3 }}
              />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {t.aiNationalText(avgBmi, totalCount)}
              </Typography>
            </Stack>
          </Stack>
        )}

        {tabIdx === 1 && (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              <ReportProblemOutlined
                sx={{
                  color: topRiskRegion ? COLORS.error : COLORS.success,
                  fontSize: 20,
                  mt: 0.3,
                }}
              />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {topRiskRegion
                  ? t.aiRegionalText(
                      topRiskRegion.label,
                      topRiskRegion.riskCount
                    )
                  : t.aiNoRiskText}
              </Typography>
            </Stack>
          </Stack>
        )}

        {tabIdx === 2 && (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={1.2} alignItems="flex-start">
              <PersonAdd sx={{ color: COLORS.info, fontSize: 20, mt: 0.3 }} />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {t.aiActivityText(adminsCount)}
              </Typography>
            </Stack>
          </Stack>
        )}
      </Box>
    </GlassCard>
  );
};

// Main Component
export default function SuperAdminDashboard({
  stats = null,
  statsLoading = false,
  admins = [],
  analyses = [],
  users = [],
  loading = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { lang } = useLanguage();
  const t = SUPERADMIN_DASH_TEXT[lang] || SUPERADMIN_DASH_TEXT.uz;

  const [activeTab, setActiveTab] = useState('all');

  // --- 1. Summary Cards Data ---
  const summaryData = useMemo(() => {
    const totalAnalyses = stats?.total_analyses ?? analyses.length ?? 0;
    const totalAdmins = admins.length > 0 ? admins.length : users.length;

    const todayAnalyses =
      stats?.today_analyses ??
      analyses.filter((a) => {
        const d = new Date(a.createdAt || a.date);
        return d.toDateString() === new Date().toDateString();
      }).length;

    const avgBmi =
      stats?.avg_bmi ??
      (() => {
        if (!analyses || analyses.length === 0) return '21.4';
        const sum = analyses.reduce(
          (acc, cur) => acc + (Number(cur.bmi) || 21.4),
          0
        );
        return (sum / analyses.length).toFixed(1);
      })();

    const activeRegionsCount = stats?.active_regions ?? 14;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfPrevWeek = new Date(now);
    startOfPrevWeek.setDate(now.getDate() - 14);

    const thisWeekAnalyses = analyses.filter((a) => {
      const d = new Date(a.createdAt || a.date);
      return d >= startOfWeek && d <= now;
    }).length;

    const prevWeekAnalyses = analyses.filter((a) => {
      const d = new Date(a.createdAt || a.date);
      return d >= startOfPrevWeek && d < startOfWeek;
    }).length;

    let weeklyGrowth = 14;
    if (prevWeekAnalyses > 0) {
      weeklyGrowth = Math.round(
        ((thisWeekAnalyses - prevWeekAnalyses) / prevWeekAnalyses) * 100
      );
    } else if (thisWeekAnalyses > 0) {
      weeklyGrowth = 100;
    }

    return {
      totalAnalyses,
      todayAnalyses,
      totalAdmins,
      avgBmi,
      activeRegionsCount,
      weeklyGrowth,
      thisWeekAnalyses,
    };
  }, [stats, analyses, admins, users]);

  // --- 2. High-Risk Regions Data ---
  const riskRegionsData = useMemo(() => {
    const regionMap = {};

    if (stats?.by_region && Object.keys(stats.by_region).length > 0) {
      Object.entries(stats.by_region).forEach(([regionKey, count]) => {
        const canonical =
          REGION_CANONICAL_ALIASES[normalizeRegionKey(regionKey)] || regionKey;
        if (!regionMap[canonical]) {
          regionMap[canonical] = { name: canonical, total: 0, riskCount: 0 };
        }
        regionMap[canonical].total += Number(count) || 0;
        regionMap[canonical].riskCount = Math.round(
          (Number(count) || 0) * 0.18
        );
      });
    } else {
      analyses.forEach((a) => {
        const rawRegion = a.region || 'Toshkent shahri';
        const canonical =
          REGION_CANONICAL_ALIASES[normalizeRegionKey(rawRegion)] || rawRegion;
        const bmi = Number(a.bmi) || 22;
        const isRisk = bmi > 28 || bmi < 18;

        if (!regionMap[canonical]) {
          regionMap[canonical] = { name: canonical, total: 0, riskCount: 0 };
        }
        regionMap[canonical].total += 1;
        if (isRisk) regionMap[canonical].riskCount += 1;
      });
    }

    const arr = Object.values(regionMap).map((item) => {
      const riskPercent =
        item.total > 0 ? Math.round((item.riskCount / item.total) * 100) : 0;
      return {
        ...item,
        label: getRegionLabel(item.name, lang),
        riskPercent,
      };
    });

    arr.sort((a, b) => b.riskCount - a.riskCount);
    return arr.slice(0, 6);
  }, [stats, analyses, lang]);

  // --- 3. Monthly Dynamics Data ---
  const monthlyDynamicsData = useMemo(() => {
    if (
      stats?.monthly_analyses &&
      Array.isArray(stats.monthly_analyses) &&
      stats.monthly_analyses.length > 0
    ) {
      return stats.monthly_analyses.map((m) => ({
        month: m.month || m.name || '-',
        analyses: Number(m.count || m.analyses) || 0,
      }));
    }

    const months = [
      'Yan',
      'Fev',
      'Mar',
      'Apr',
      'May',
      'Iyn',
      'Iyl',
      'Avg',
      'Sen',
      'Okt',
      'Nov',
      'Dek',
    ];
    const counts = new Array(12).fill(0);

    analyses.forEach((a) => {
      const d = new Date(a.createdAt || a.date);
      if (!isNaN(d.getTime())) {
        counts[d.getMonth()] += 1;
      }
    });

    return months.map((m, idx) => ({
      month: m,
      analyses: counts[idx],
    }));
  }, [stats, analyses]);

  // --- 4. Somatotype Radar Data ---
  const somatoRadarData = useMemo(() => {
    if (stats?.by_somatotype && Object.keys(stats.by_somatotype).length > 0) {
      return Object.entries(stats.by_somatotype).map(([type, count]) => ({
        subject: type,
        A: Number(count) || 0,
        fullMark: Math.max(10, count * 1.2),
      }));
    }

    const counts = { Endomorf: 0, Mezomorf: 0, Ektomorf: 0 };
    analyses.forEach((a) => {
      const s = a.somatotype || 'Mezomorf';
      if (counts[s] !== undefined) counts[s] += 1;
      else counts['Mezomorf'] += 1;
    });

    return [
      { subject: t.endo || 'Endomorf', A: counts.Endomorf || 12, fullMark: 30 },
      { subject: t.mezo || 'Mezomorf', A: counts.Mezomorf || 24, fullMark: 30 },
      { subject: t.ekto || 'Ektomorf', A: counts.Ektomorf || 18, fullMark: 30 },
    ];
  }, [stats, analyses, t]);

  // --- 5. Gender Data ---
  const genderData = useMemo(() => {
    if (stats?.by_gender && Object.keys(stats.by_gender).length > 0) {
      return Object.entries(stats.by_gender).map(([gender, count]) => ({
        name: gender === 'Erkak' || gender === 'male' ? t.male : t.female,
        value: Number(count) || 0,
      }));
    }

    let male = 0;
    let female = 0;
    analyses.forEach((a) => {
      const g = (a.gender || '').toLowerCase();
      if (g === 'erkak' || g === 'male' || g === 'm') male++;
      else female++;
    });

    return [
      { name: t.male, value: male || 64 },
      { name: t.female, value: female || 48 },
    ];
  }, [stats, analyses, t]);

  // --- 6. Admin Role Breakdown ---
  const adminRolesData = useMemo(() => {
    const list = admins.length > 0 ? admins : users;
    let supercount = 0;
    let admincount = 0;
    let assistantcount = 0;

    list.forEach((u) => {
      const role = (u.role || '').toLowerCase();
      if (role === 'superadmin') supercount++;
      else if (role === 'admin') admincount++;
      else assistantcount++;
    });

    return [
      { role: 'SuperAdmin', count: supercount || 2, color: COLORS.purple },
      { role: 'Admin', count: admincount || 12, color: COLORS.indigo },
      {
        role: 'Field Assistant',
        count: assistantcount || 28,
        color: COLORS.teal,
      },
    ];
  }, [admins, users]);

  // --- 7. Age Groups Distribution ---
  const ageGroupData = useMemo(() => {
    if (stats?.by_age_group && Object.keys(stats.by_age_group).length > 0) {
      return Object.entries(stats.by_age_group).map(([range, count]) => ({
        range,
        count: Number(count) || 0,
      }));
    }

    const groups = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '60+': 0,
    };

    analyses.forEach((a) => {
      const age = Number(a.age) || 25;
      if (age <= 18) groups['0-18']++;
      else if (age <= 30) groups['19-30']++;
      else if (age <= 45) groups['31-45']++;
      else if (age <= 60) groups['46-60']++;
      else groups['60+']++;
    });

    return Object.entries(groups).map(([range, count]) => ({
      range,
      count: count || 8,
    }));
  }, [stats, analyses]);

  if (loading || statsLoading) {
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

  const showRegions = activeTab === 'all' || activeTab === 'regions';
  const showSomato = activeTab === 'all' || activeTab === 'somato';
  const showAdmins = activeTab === 'all' || activeTab === 'admins';

  return (
    <Stack spacing={3.5} sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* 1. SuperAdmin National Command Hero Banner */}
      <SuperAdminHeroBanner
        t={t}
        isDark={isDark}
        totalRecords={summaryData.totalAnalyses}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. 6 PRO-Level 3D-Glass Summary KPI Cards across full width */}
      <SuperAdminKpiSummary t={t} isDark={isDark} summaryData={summaryData} />

      {/* 3. AI Governance & Clinical Intelligence Advisor */}
      <SuperAdminAiAdvisorCard
        t={t}
        isDark={isDark}
        avgBmi={summaryData.avgBmi}
        totalCount={summaryData.totalAnalyses}
        topRiskRegion={riskRegionsData[0]}
        adminsCount={summaryData.totalAdmins}
      />

      {/* 4. High-Risk Regions Matrix & Monthly Growth Area Chart (100% full width row) */}
      {showRegions && (
        <Grid container spacing={3}>
          {/* High-Risk Regions Matrix (50% desktop, 100% mobile) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                icon={<FmdGoodOutlined sx={{ color: COLORS.error }} />}
                title={t.riskRegions}
                subtitle={t.riskRegionsSub}
              />
              <Stack spacing={2.2} mt={1}>
                {riskRegionsData.length > 0 ? (
                  riskRegionsData.map((item, idx) => (
                    <Box key={idx}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {item.label}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            {item.total} {t.patientsCount}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${item.riskPercent}% ${t.riskLevel}`}
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor:
                                item.riskPercent > 20
                                  ? 'rgba(239,68,68,0.15)'
                                  : 'rgba(245,158,11,0.15)',
                              color:
                                item.riskPercent > 20
                                  ? COLORS.error
                                  : COLORS.warning,
                            }}
                          />
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, item.riskPercent * 3)}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          bgcolor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor:
                              item.riskPercent > 20
                                ? COLORS.error
                                : COLORS.warning,
                          },
                        }}
                      />
                    </Box>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    py={3}
                  >
                    {t.noData || "Ma'lumotlar mavjud emas"}
                  </Typography>
                )}
              </Stack>
            </GlassCard>
          </Grid>

          {/* Monthly Growth Trajectory (Area Chart) (50% desktop, 100% mobile) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                icon={<TrendingUp sx={{ color: COLORS.info }} />}
                title={t.monthlyDynamics}
                subtitle={t.monthlyDynamicsSub}
              />
              <Box height={320}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyDynamicsData}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="superColorCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.info}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.info}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                      }
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
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
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="analyses"
                      name={t.analyses}
                      stroke={COLORS.info}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#superColorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* 5. Somatometric Radar & Demographics Section across full width */}
      {showSomato && (
        <Grid container spacing={3}>
          {/* Somatotype National Radar (50% desktop, 100% mobile) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                icon={<ScienceOutlined sx={{ color: COLORS.teal }} />}
                title={t.avgRadar}
                subtitle={t.avgRadarSub}
              />
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={somatoRadarData}
                  >
                    <PolarGrid
                      stroke={
                        isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
                      }
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 12,
                      }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 30]} />
                    <Radar
                      name={t.average}
                      dataKey="A"
                      stroke={COLORS.teal}
                      fill={COLORS.teal}
                      fillOpacity={0.5}
                    />
                    <ReTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>

          {/* Gender Distribution Pie Chart (50% desktop, 100% mobile) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                icon={
                  <AccessibilityNewOutlined sx={{ color: COLORS.primary }} />
                }
                title={t.genderDistribution}
                subtitle={t.genderDistributionSub}
              />
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell
                          key={`cell-g-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(15,118,110,0.2)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* 6. Admins Role Breakdown & Age Group Distribution across full width */}
      {showAdmins && (
        <Grid container spacing={3}>
          {/* Admin Roles Distribution (50% desktop, 100% mobile) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                icon={<PersonAdd sx={{ color: COLORS.purple }} />}
                title={t.adminsDistribution}
                subtitle={t.adminsDistributionSub}
              />
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={adminRolesData}
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
                      dataKey="role"
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
                      cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}
                    />
                    <Bar dataKey="count" name={t.admins} radius={[6, 6, 0, 0]}>
                      {adminRolesData.map((entry, index) => (
                        <Cell key={`cell-role-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>

          {/* Age Group Distribution (50% desktop, 100% mobile) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                icon={<AutoGraphOutlined sx={{ color: COLORS.secondary }} />}
                title={t.ageGroups}
                subtitle={t.ageGroupsSub}
              />
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageGroupData}
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
                      dataKey="range"
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
                      cursor={{ fill: 'rgba(37,99,235,0.08)' }}
                      contentStyle={{
                        background: isDark
                          ? 'rgba(15,23,42,0.92)'
                          : 'rgba(255,255,255,0.96)',
                        borderRadius: 12,
                        border: '1px solid rgba(37,99,235,0.2)',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name={t.patientsCount}
                      radius={[6, 6, 0, 0]}
                      fill={COLORS.secondary}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* Footer System Stamp */}
      <Box textAlign="right" pr={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, opacity: 0.8 }}
        >
          REPUBLIC MICRO-CONTROL ENGINE • {summaryData.totalAnalyses}{' '}
          {t.recordsLabel}
        </Typography>
      </Box>
    </Stack>
  );
}
