import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AdminApi } from '../services/AdminApi';
import {
  generateConsentDocxById,
  generateDocx,
  generatePdf,
  generatePdfById,
  generateDocxById,
} from '../services/api';
import { LANGUAGES, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

// Material UI importlari
import {
  Container,
  Grid,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Stack,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Delete,
  Download,
  FilterList,
  Close,
  Dashboard as DashboardIcon,
  List as ListIcon,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
  Assessment,
  BiotechOutlined,
  Logout,
  Refresh,
  ErrorOutline,
  CheckCircle,
} from '@mui/icons-material';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';
import { pageT } from '../utils/pageI18n';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Modular Components
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import AdminScientificAnalysis from '../components/Dashboard/AdminScientificAnalysis';
import AdminFilters from '../components/Admin/AdminFilters';
import AdminTable from '../components/Admin/AdminTable';
import InputForm from '../components/InputForm';
import ResearcherDataView from '../components/Admin/ResearcherDataView';
import DashboardFilters from '../components/Dashboard/DashboardFilters';
import { ConsentStatus } from '../components/Consent/PrivacyConsentPanel';

/** ===== Helpers ===== */
const calcBMI = (wKg, hCm) => {
  const h = Number(hCm) / 100;
  if (!h || !wKg) return null;
  return Math.round((Number(wKg) / (h * h)) * 10) / 10;
};

const bmiStatus = (bmi, age) => {
  if (!bmi) return '-';
  if (age >= 20) {
    if (bmi < 18.5) return "Ozg'in";
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Ortiqcha';
    return 'Semizlik';
  }
  return bmi < 18.5 ? "Ozg'in" : bmi < 25 ? 'Normal' : 'Ortiqcha';
};

const normalize = (r) => {
  const bmiVal = r.bmi ?? calcBMI(r.weight, r.height);
  return {
    ...r,
    idCode: r.id_code || r.idCode,
    createdAt: r.created_at || r.createdAt,
    firstName: r.first_name || r.firstName,
    lastName: r.last_name || r.lastName,
    parentsPhone: r.parents_phone || r.parentsPhone || '',
    doctorNote: r.doctor_note || r.doctorNote || '',
    consentConfirmed: r.consent_confirmed ?? r.consentConfirmed ?? false,
    consentGuardianName: r.consent_guardian_name || r.consentGuardianName || '',
    consentGuardianRelationship:
      r.consent_guardian_relationship || r.consentGuardianRelationship || '',
    consentGuardianPhone:
      r.consent_guardian_phone || r.consentGuardianPhone || '',
    consentPolicyVersion:
      r.consent_policy_version || r.consentPolicyVersion || '',
    bmi: bmiVal,
    bmiStatus: r.bmi_status || bmiStatus(bmiVal, r.age),
  };
};

const normalizeImportError = (err, unknownError = 'Unknown error') => {
  if (typeof err === 'string') {
    const match = err.match(/Row\s+(\d+):\s*(.*)/i);
    return {
      row: match ? Number(match[1]) : '-',
      field: '-',
      message: match ? match[2] : err,
      value: '',
    };
  }

  return {
    row: err?.row ?? '-',
    field: err?.field || '-',
    message: err?.message || err?.detail || unknownError,
    value: err?.value ?? '',
  };
};

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(30, 30, 40, 0.7)'
          : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(100, 116, 139, 0.12)',
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        height: '6px',
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(0,0,0,0.2)',
      },
      boxShadow: (theme) =>
        theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(100,116,139,0.1)',
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const horizontalScrollSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: (theme) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255,255,255,0.14)'
        : 'rgba(99,102,241,0.22)',
    borderRadius: '10px',
  },
};

const PAGE_LABELS = {
  uz: { scientificAnalysis: 'Ilmiy Tahlil' },
  ru: { scientificAnalysis: 'Научный анализ' },
  en: { scientificAnalysis: 'Scientific Analysis' },
  tm: { scientificAnalysis: 'Ylmy analiz' },
  tg: { scientificAnalysis: 'Таҳлили илмӣ' },
  kz: { scientificAnalysis: 'Ғылыми талдау' },
  ky: { scientificAnalysis: 'Илимий талдоо' },
};

const REGION_LABELS_RU = {
  'toshkent shahri': 'г. Ташкент',
  toshkent: 'Ташкентская область',
  'toshkent viloyati': 'Ташкентская область',
  qoraqalpogiston: 'Республика Каракалпакстан',
  "qoraqalpog'iston": 'Республика Каракалпакстан',
  andijon: 'Андижанская область',
  buxoro: 'Бухарская область',
  fargona: 'Ферганская область',
  "farg'ona": 'Ферганская область',
  jizzax: 'Джизакская область',
  xorazm: 'Хорезмская область',
  namangan: 'Наманганская область',
  navoiy: 'Навоийская область',
  qashqadaryo: 'Кашкадарьинская область',
  samarqand: 'Самаркандская область',
  sirdaryo: 'Сырдарьинская область',
  surxondaryo: 'Сурхандарьинская область',
};

const getRegionLabel = (value, lang) => {
  if (lang !== 'ru') return value || '-';
  const key = String(value || '')
    .toLowerCase()
    .replace(/[‘’`ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return REGION_LABELS_RU[key] || value || '-';
};

const getDateLocale = (lang) => {
  if (lang === 'ru') return 'ru-RU';
  if (lang === 'kz') return 'kk-KZ';
  if (lang === 'en') return 'en-US';
  return 'uz-UZ';
};

const translateBmiStatus = (value, lang) => {
  if (lang !== 'ru') return value || '-';
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('normal')) return 'Норма';
  if (normalized.includes('semizlik') || normalized.includes('obese'))
    return 'Ожирение';
  if (normalized.includes('ozg') || normalized.includes('underweight'))
    return 'Недостаточный вес';
  if (normalized.includes('ortiqcha') || normalized.includes('overweight'))
    return 'Избыточный вес';
  return value || '-';
};

function CustomModal({
  children,
  onClose,
  title,
  onDownloadDocx,
  isDownloading,
  onDownloadPdf,
  isPdfDownloading,
  pdfLang,
  setPdfLang,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { lang } = useLanguage();
  const pt = useCallback((key) => pageT(lang, key), [lang]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions
        sx={{ p: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
      >
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              isDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
            onClick={onDownloadDocx}
            disabled={isDownloading || isPdfDownloading}
            sx={{ borderRadius: 2 }}
          >
            {pt('downloadWord')}
          </Button>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>{pt('pdfLang')}</InputLabel>
            <Select
              value={pdfLang}
              label={pt('pdfLang')}
              onChange={(e) => setPdfLang(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={
              isPdfDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
            onClick={onDownloadPdf}
            disabled={isDownloading || isPdfDownloading}
            sx={{ borderRadius: 2 }}
          >
            {pt('downloadPdf')}
          </Button>
        </Box>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          {pt('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ===== ASOSIY ADMIN PAGE =====
export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login: authLogin, loading: authLoading, logout } = useAuth();
  const { lang } = useLanguage();
  const pageLabels = PAGE_LABELS[lang] || PAGE_LABELS.uz;
  const pt = useCallback((key) => pageT(lang, key), [lang]);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // States for downloads
  const [viewRow, setViewRow] = useState(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingConsentDocx, setDownloadingConsentDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfLang, setPdfLang] = useState(lang);

  // Filters
  // Unified Filters for both Table and Dashboard
  const [dashFilters, setDashFilters] = useState({
    q: '',
    gender: '',
    age_min: 0,
    age_max: 100,
    bmi_min: 10,
    bmi_max: 50,
    region: '',
    somatotype: '',
    date_from: '',
    date_to: '',
  });
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [checked, setChecked] = useState(new Set());

  // Login state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    verification_code: '',
  });
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [importingXlsx, setImportingXlsx] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Edit state
  const [editRow, setEditRow] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  // Load Data - Paginated
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resp = await AdminApi.analyses.list({
        q: dashFilters.q,
        gender: dashFilters.gender,
        ageMin: dashFilters.age_min,
        ageMax: dashFilters.age_max,
        dateFrom: dashFilters.date_from,
        dateTo: dashFilters.date_to,
        region: dashFilters.region,
        somatotype: dashFilters.somatotype,
        sortKey: sort.key === 'createdAt' ? 'created_at' : sort.key,
        sortDir: sort.dir,
        page: page + 1,
        pageSize: rowsPerPage,
      });
      setRaw((resp.items || []).map(normalize));
      setTotalCount(resp.total || 0);
    } catch (e) {
      console.error('Load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [user, dashFilters, sort, page, rowsPerPage]);

  const fetchDashboardStats = useCallback(
    async (filters = dashFilters) => {
      if (!user) return;
      setStatsLoading(true);
      try {
        const data = await AdminApi.stats(filters);
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch admin stats:', e);
      } finally {
        setStatsLoading(false);
      }
    },
    [user, dashFilters]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const analysisId = params.get('analysis_id');
    if (!user || !analysisId || Number.isNaN(Number(analysisId))) return;

    AdminApi.analyses
      .get(Number(analysisId))
      .then((row) => {
        setViewRow(normalize(row));
        setActiveTab(1);
      })
      .catch(() => {
        toast.error(pt('recordNotFound'));
      });
  }, [location.search, pt, user]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoginError('');
      setLoginInProgress(true);
      try {
        const profile = await authLogin(loginForm);
        if (profile.requires_verification) {
          setRequiresVerification(true);
          setLoginError(
            profile.message || 'Emailga yuborilgan tasdiqlash kodini kiriting.'
          );
          return;
        }
        if (profile.role === 'researcher') {
          navigate('/researcher', { replace: true });
        } else if (profile.role !== 'admin' && profile.role !== 'superadmin') {
          navigate('/');
        }
      } catch (err) {
        setLoginError(err.message || pt('errorPrefix'));
      } finally {
        setLoginInProgress(false);
      }
    },
    [authLogin, loginForm, navigate, pt]
  );

  const handleUpdateAnalysis = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!editRow) return;
      setUpdating(true);
      try {
        await AdminApi.analyses.update(editRow.id, editRow);
        toast.success(pt('updated'));
        setEditRow(null);
        load();
      } catch (err) {
        toast.error(`${pt('errorPrefix')} ${err.message}`);
      } finally {
        setUpdating(false);
      }
    },
    [editRow, load, pt]
  );

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const numericFields = [
      'age',
      'age_months',
      'age_days',
      'height',
      'weight',
      'chest',
      'waist',
      'head',
      'father_height',
      'mother_height',
      'shoulder_length',
      'shoulder_breadth',
      'shoulder_circumference',
      'arm_elbow_length',
      'hand_length',
      'thigh_length',
      'thigh_circumference',
      'calf_length',
      'calf_circumference',
      'foot_length',
      'body_length',
      'total_body_water',
      'fat_percent',
      'fat_mass',
      'muscle_mass',
      'bone_mass',
      'acm',
      'visceral_fat',
    ];

    let v = value;
    if (
      numericFields.includes(name) ||
      numericFields
        .map((f) => {
          const camel = f
            .split('_')
            .map((x, i) =>
              i === 0 ? x : x.charAt(0).toUpperCase() + x.slice(1)
            )
            .join('');
          return camel;
        })
        .includes(name)
    ) {
      v = value === '' ? '' : Number(value);
    }

    setEditRow((prev) => ({ ...prev, [name]: v }));
  }, []);

  const handleBulkUpdateEdit = useCallback((data) => {
    setEditRow((prev) => ({ ...prev, ...data }));
  }, []);

  const toggleAll = useCallback(() => {
    const next = new Set(checked);
    const allChecked = raw.length > 0 && raw.every((r) => checked.has(r.id));
    if (allChecked) raw.forEach((r) => next.delete(r.id));
    else raw.forEach((r) => next.add(r.id));
    setChecked(next);
  }, [checked, raw]);

  const toggleOne = useCallback(
    (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setChecked(next);
    },
    [checked]
  );

  const handleDeleteConfirm = useCallback(
    async (mode) => {
      setDeleteConfirmLoading(true);
      try {
        if (mode === 'hard') {
          await AdminApi.analyses.hardDelete(Array.from(checked));
          toast.success(pt('hardDeleted'));
        } else {
          await AdminApi.analyses.removeMany(Array.from(checked));
          toast.success(pt('movedTrashNotice'));
        }
        setChecked(new Set());
        setDeleteConfirmOpen(false);
        load();
      } catch (e) {
        toast.error(`${pt('deleteError')} ${e.message}`);
      } finally {
        setDeleteConfirmLoading(false);
      }
    },
    [checked, load, pt]
  );

  const onDeleteSelected = useCallback(async () => {
    if (!checked.size) return;
    setDeleteConfirmOpen(true);
  }, [checked.size]);

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.code === 'Delete' || e.key === 'Backspace') {
        // Don't trigger if user is typing in a text input or textarea
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

        if (checked.size > 0 && activeTab === 1) {
          onDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checked.size, activeTab, onDeleteSelected]);

  const handleDownloadPdf = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingPdf(true);
    try {
      const blob = await generatePdfById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${viewRow.idCode}_${pdfLang}.pdf`;
      a.click();
    } catch (e) {
      toast.error(`PDF: ${e.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  }, [viewRow, pdfLang]);

  const handleDownloadDocx = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingDocx(true);
    try {
      const blob = await generateDocxById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anketa_${viewRow.idCode}_${pdfLang}.docx`;
      a.click();
    } catch (e) {
      toast.error(`Word: ${e.message}`);
    } finally {
      setDownloadingDocx(false);
    }
  }, [handleDownloadPdf, viewRow, pdfLang]);

  const handleDownloadConsentDocx = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingConsentDocx(true);
    try {
      const blob = await generateConsentDocxById(viewRow.id, pdfLang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent_${viewRow.idCode || viewRow.id}_${pdfLang}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(`${pt('errorPrefix')} ${e.message}`);
    } finally {
      setDownloadingConsentDocx(false);
    }
  }, [pdfLang, pt, viewRow]);

  const handleExportXlsx = useCallback(async () => {
    setExportingXlsx(true);
    try {
      const blob = await AdminApi.analyses.exportXlsx({
        ...dashFilters,
        lang,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyses_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      toast.success(pt('excelLoaded'));
    } catch (e) {
      toast.error(`${pt('excelError')} ${e.message}`);
    } finally {
      setExportingXlsx(false);
    }
  }, [dashFilters, pt]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await AdminApi.analyses.exportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_template.xlsx`;
      a.click();
      toast.success(pt('templateLoaded'));
    } catch (e) {
      toast.error(`${pt('templateError')} ${e.message}`);
    }
  }, [pt]);

  const handleImportXlsx = useCallback(async () => {
    if (!importFile) return;
    setImportingXlsx(true);
    setImportResult(null);
    try {
      const res = await AdminApi.analyses.importXlsx(importFile);
      setImportResult(res);
      const errorCount = res?.errors?.length || 0;
      const skippedCount = res?.skipped || errorCount || 0;
      toast.success(
        `${pt('ready')} ${res.imported} ${pt('newCount')}, ${res.updated} ${pt('updatedCount')}${
          skippedCount ? `, ${skippedCount} ${pt('skippedCount')}` : ''
        }`
      );
      if (!res.errors || res.errors.length === 0) setImportConfirmOpen(false);
      load();
    } catch (e) {
      toast.error(`${pt('importError')} ${e.message}`);
    } finally {
      setImportingXlsx(false);
    }
  }, [importFile, load, pt]);

  const availableTabs = useMemo(() => {
    const allTabs = [
      {
        id: 0,
        label: pt('dashboard'),
        icon: <DashboardIcon />,
        roles: ['admin', 'superadmin'],
        content: (
          <AdminDashboard
            data={raw}
            loading={loading}
            stats={stats}
            statsLoading={statsLoading}
            totalCount={totalCount}
            userName={user?.name}
            filters={dashFilters}
          />
        ),
      },
      {
        id: 1,
        label: pt('data'),
        icon: <ListIcon />,
        roles: ['admin', 'superadmin'],
        content: (
          <Box sx={{ py: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              flexDirection={{ xs: 'column', md: 'row' }}
              gap={2}
              mb={3}
            >
              <Typography variant="h5" fontWeight="bold">
                {pt('dataListTitle')}
              </Typography>
              <Box display="flex" gap={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleDownloadTemplate}
                  startIcon={<Download />}
                >
                  {pt('template')}
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => setImportConfirmOpen(true)}
                  startIcon={
                    importingXlsx ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Visibility />
                    )
                  }
                >
                  {pt('import')}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    exportingXlsx ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Download />
                    )
                  }
                  onClick={handleExportXlsx}
                  disabled={exportingXlsx}
                >
                  {pt('export')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={onDeleteSelected}
                  disabled={!checked.size}
                >
                  {pt('delete')} ({checked.size})
                </Button>
              </Box>
            </Box>

            <Paper
              sx={{
                mt: 3,
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {loading && <LinearProgress />}
              <AdminTable
                rows={raw}
                checked={checked}
                toggleAll={toggleAll}
                toggleOne={toggleOne}
                allChecked={
                  raw.length > 0 && raw.every((r) => checked.has(r.id))
                }
                setViewRow={setViewRow}
                onEdit={(r) => setEditRow(r)}
                formatDate={(d) =>
                  new Date(d).toLocaleDateString(getDateLocale(lang))
                }
                user={user}
              />
              <TablePagination
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          </Box>
        ),
      },

      {
        id: 2,
        label: pageLabels.scientificAnalysis,
        icon: <BiotechOutlined />,
        roles: ['admin', 'superadmin'],
        content: (
          <AdminScientificAnalysis
            data={raw}
            loading={loading}
            totalCount={totalCount}
            filters={dashFilters}
          />
        ),
      },

      {
        id: 3,
        label: pt('researcherData'),
        icon: <Assessment />,
        roles: ['superadmin'],
        content: (
          <ResearcherDataView isSuperAdmin={user?.role === 'superadmin'} />
        ),
      },
    ];
    return allTabs.filter((tab) => tab.roles.includes(user?.role));
  }, [
    user,
    raw,
    loading,
    stats,
    statsLoading,
    totalCount,
    handleDownloadTemplate,
    setImportConfirmOpen,
    importingXlsx,
    exportingXlsx,
    handleExportXlsx,
    onDeleteSelected,
    pt,
    checked,
    dashFilters,
    pageLabels,
    setDashFilters,
    toggleAll,
    toggleOne,
    setViewRow,
    rowsPerPage,
    page,
    setPage,
    setRowsPerPage,
  ]);

  if (authLoading)
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );

  // LOGIN SCREEN
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassPaper sx={{ p: 4, position: 'relative', overflow: 'visible' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(15, 118, 110, 0.24)',
              }}
            >
              <Lock sx={{ color: 'white', fontSize: 40 }} />
            </Box>

            <Box textAlign="center" mt={4} mb={4}>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {pt('adminPanelTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pt('loginSubtitle')}
              </Typography>
            </Box>

            {loginError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {loginError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={pt('emailOrLogin')}
                  variant="outlined"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={pt('password')}
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {requiresVerification && (
                  <TextField
                    fullWidth
                    label="Tasdiqlash kodi"
                    variant="outlined"
                    value={loginForm.verification_code}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        verification_code: e.target.value,
                      })
                    }
                    inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                  />
                )}
                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loginInProgress}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 16px rgba(15, 118, 110, 0.22)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  {loginInProgress ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    pt('login')
                  )}
                </Button>
              </Stack>
            </Box>
          </GlassPaper>
        </motion.div>
      </Container>
    );
  }

  // Check role for authenticated users
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography variant="h5" textAlign="center">
          {pt('accessDenied')}
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          {pt('home')}
        </Button>
      </Container>
    );
  }

  const renderContent = () => {
    const currentTab =
      availableTabs.find((t) => t.id === activeTab) || availableTabs[0];
    return currentTab?.content || null;
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark
            ? 'rgba(23, 26, 33, 0.85)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              gap: { xs: 1, md: 2 },
              minWidth: 0,
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Typography
              variant="h6"
              fontWeight="900"
              sx={{
                flexGrow: 1,
                color: 'primary.main',
                minWidth: { xs: '100%', md: 180 },
              }}
            >
              MORPHO CHECK{' '}
              <Box
                component="span"
                sx={{ color: 'text.primary', fontWeight: 400 }}
              >
                PRO
              </Box>
            </Typography>
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                maxWidth: '100%',
                overflowX: 'auto',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {availableTabs.map((tab) => (
                  <Tab
                    key={tab.id}
                    icon={tab.icon}
                    iconPosition="start"
                    label={tab.label}
                    value={tab.id}
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  />
                ))}
              </Tabs>
            </Box>
            <Box sx={{ ml: 2 }}>
              <Tooltip title={pt('logout')}>
                <IconButton
                  onClick={() => setLogoutDialogOpen(true)}
                  color="error"
                  size="small"
                >
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{ mt: 4, px: { xs: 1.5, sm: 3 }, maxWidth: '100%' }}
      >
        {/* PERSISTENT FILTERS FOR RELEVANT TABS */}
        {(activeTab === 0 || activeTab === 1 || activeTab === 2) && (
          <Box mb={4}>
            <DashboardFilters
              filters={dashFilters}
              onFilterChange={setDashFilters}
              onReset={() =>
                setDashFilters({
                  q: '',
                  gender: '',
                  region: '',
                  age_min: 0,
                  age_max: 100,
                  bmi_min: 10,
                  bmi_max: 50,
                  somatotype: '',
                  date_from: '',
                  date_to: '',
                })
              }
            />
          </Box>
        )}
        <Box sx={horizontalScrollSx}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  minWidth: {
                    xs: activeTab === 0 || activeTab === 2 ? 720 : 0,
                    md: 0,
                  },
                }}
              >
                {renderContent()}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Container>

      {viewRow && (
        <CustomModal
          title={pt('detailsTitle')}
          onClose={() => setViewRow(null)}
          onDownloadDocx={handleDownloadDocx}
          isDownloading={downloadingDocx}
          onDownloadPdf={handleDownloadPdf}
          isPdfDownloading={downloadingPdf}
          pdfLang={pdfLang}
          setPdfLang={setPdfLang}
        >
          <ConsentStatus
            record={viewRow}
            lang={lang}
            downloading={downloadingConsentDocx}
            onDownloadDocx={handleDownloadConsentDocx}
          />
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>
                  <strong>{viewRow.idCode}</strong>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pt('fullName')}</TableCell>
                <TableCell>
                  {viewRow.lastName} {viewRow.firstName}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pt('date')}</TableCell>
                <TableCell>
                  {new Date(viewRow.createdAt).toLocaleString(
                    getDateLocale(lang)
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pt('region')}</TableCell>
                <TableCell>{getRegionLabel(viewRow.region, lang)}</TableCell>
              </TableRow>
              {viewRow.parentsPhone && (
                <TableRow>
                  <TableCell>{pt('parentPhone')}</TableCell>
                  <TableCell>{viewRow.parentsPhone}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell>BMI</TableCell>
                <TableCell>
                  <strong>{viewRow.bmi}</strong> (
                  {translateBmiStatus(viewRow.bmiStatus, lang)})
                </TableCell>
              </TableRow>
              {viewRow.doctorNote && (
                <TableRow>
                  <TableCell>{pt('doctorNote')}</TableCell>
                  <TableCell>{viewRow.doctorNote}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CustomModal>
      )}

      {editRow && (
        <Dialog
          open={true}
          onClose={() => setEditRow(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              bgcolor: 'background.paper',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 4,
              pt: 3,
              pb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={800}>
              {pt('editData')}
            </Typography>
            <IconButton onClick={() => setEditRow(null)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, md: 4 }, py: 0 }}>
            <InputForm
              formData={editRow}
              handleInputChange={handleEditInputChange}
              onBulkUpdate={handleBulkUpdateEdit}
              handleSubmit={handleUpdateAnalysis}
              loading={updating}
              isAdminView={true}
              submitLabel={pt('save')}
            />
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 2 }}>
            <Button
              onClick={() => setEditRow(null)}
              color="inherit"
              sx={{ mr: 2 }}
            >
              {pt('cancel')}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpdateAnalysis}
              disabled={updating}
              sx={{ borderRadius: 3, px: 4 }}
            >
              {updating ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                pt('save')
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog for Super Admin */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {pt('confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {pt('selectedRowsNotice').replace('{count}', checked.size)}{' '}
            {user.role === 'superadmin' ? pt('deleteHow') : pt('deleteSure')}
          </Typography>
          {user.role === 'superadmin' && (
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
                <Lock fontSize="small" /> {pt('hardDeleteNote')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            {pt('cancel')}
          </Button>
          <Button
            variant={user.role === 'superadmin' ? 'outlined' : 'contained'}
            color="error"
            onClick={() => handleDeleteConfirm('soft')}
            disabled={deleteConfirmLoading}
          >
            {user.role === 'superadmin' ? pt('moveTrash') : pt('delete')}
          </Button>
          {user.role === 'superadmin' && (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeleteConfirm('hard')}
              disabled={deleteConfirmLoading}
            >
              {pt('hardDelete')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Import XLSX Dialog */}
      <Dialog
        open={importConfirmOpen}
        onClose={() => !importingXlsx && setImportConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{pt('importTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {pt('importHelp')}
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 4,
              border: '2px dashed',
              borderColor: importFile ? 'primary.main' : 'divider',
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => document.getElementById('xlsx-input').click()}
          >
            <input
              type="file"
              id="xlsx-input"
              hidden
              accept=".xlsx"
              onChange={(e) => setImportFile(e.target.files[0])}
            />
            <Typography
              variant="h6"
              color={importFile ? 'primary.main' : 'text.disabled'}
            >
              {importFile ? importFile.name : pt('chooseXlsx')}
            </Typography>
          </Box>

          {importResult && (
            <Box sx={{ mt: 3 }}>
              <Alert
                severity={importResult.errors?.length ? 'warning' : 'success'}
                icon={
                  importResult.errors?.length ? (
                    <ErrorOutline />
                  ) : (
                    <CheckCircle />
                  )
                }
                sx={{ mb: 2, borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={700}>
                  {pt('importSummary')} {importResult.imported || 0}{' '}
                  {pt('newCount')}, {importResult.updated || 0}{' '}
                  {pt('updatedCount')},{' '}
                  {importResult.skipped || importResult.errors?.length || 0}{' '}
                  {pt('error')}.
                </Typography>
              </Alert>

              {importResult.errors && importResult.errors.length > 0 && (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 260, borderRadius: 2 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('row')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('column')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('error')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('value')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.errors.map((err, idx) => {
                        const item = normalizeImportError(err, pt('unknown'));
                        return (
                          <TableRow
                            key={`${item.row}-${item.field}-${idx}`}
                            hover
                          >
                            <TableCell>{item.row}</TableCell>
                            <TableCell>{item.field}</TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="error.main"
                                fontWeight={600}
                              >
                                {item.message}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.value === '' || item.value == null
                                  ? '-'
                                  : String(item.value)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setImportConfirmOpen(false)}
            disabled={importingXlsx}
            color="inherit"
          >
            {pt('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleImportXlsx}
            disabled={!importFile || importingXlsx}
            startIcon={
              importingXlsx ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {pt('uploadImport')}
          </Button>
        </DialogActions>
      </Dialog>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={() => {
          setLogoutDialogOpen(false);
          logout();
        }}
      />
    </Box>
  );
}
