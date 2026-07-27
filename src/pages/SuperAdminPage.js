import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Stack,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Lock,
  Person,
  Logout,
  Dashboard,
  People,
  Visibility,
  VisibilityOff,
  Security,
  History,
  Storage,
  RestoreFromTrash,
  AutoGraph,
  SettingsSuggest,
  Refresh,
  Download,
  DeleteForever,
  Place,
  Close,
  MyLocation,
  Search,
  WarningAmber,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { pageT } from '../utils/pageI18n';
import { getLocalizedLocationLabel } from '../utils/locationI18n';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminApi, ResearchApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { UZB_LOCATIONS } from '../data/uzbLocations';
import {
  getAdminPermissionLabels,
  getAdminPermissionText,
  normalizeAdminPermissions,
} from '../utils/adminPermissions';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';
import {
  PAGE_LABELS,
  formatPanelDate,
  HEADER_LABELS,
  RESEARCH_TYPE_OPTIONS,
  ADMIN_REPORT_LABELS,
  ADMIN_REPORT_COLUMN_KEYS,
  CONFIRM_MESSAGES,
} from './superAdmin/i18n';
import {
  GlassPaper,
  scrollableContentSx,
  blurActiveElement,
} from './superAdmin/ui';
import {
  formatReportDate,
  escapeExcelCell,
  downloadBlob,
} from './superAdmin/utils';

import SuperAdminTabContent from './superAdmin/SuperAdminTabContent';

const SuperAdminPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'security') {
      setActiveTab(5);
    }
  }, [location.search]);

  const {
    user,
    login: authLogin,
    logout,
    loading: authLoading,
    refreshUser,
  } = useAuth();
  const { lang, t } = useLanguage();
  const pageLabels = PAGE_LABELS[lang] || PAGE_LABELS.uz;
  const adminPermissionLabels = getAdminPermissionLabels(lang);
  const apt = useCallback((key) => getAdminPermissionText(lang, key), [lang]);
  const pt = useCallback((key) => pageT(lang, key), [lang]);
  const reportLabels = ADMIN_REPORT_LABELS[lang] || ADMIN_REPORT_LABELS.uz;

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

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminReportOpen, setAdminReportOpen] = useState(false);
  const [adminReportDownloading, setAdminReportDownloading] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminDialogStep, setAdminDialogStep] = useState(0);
  const [adminGeocoding, setAdminGeocoding] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    phone: '',
    region: '',
    district: '',
    mahalla: '',
    address: '',
    latitude: '',
    longitude: '',
    research_topic: '',
    research_type: '',
    research_area: '',
    scientific_supervisor: '',
    supervisor_id: '',
    admin_permissions: normalizeAdminPermissions(),
    is_restricted: 0,
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCurrentAdminPassword, setShowCurrentAdminPassword] =
    useState(false);
  const [boundaryIndex, setBoundaryIndex] = useState(null);
  const [mahallaOptions, setMahallaOptions] = useState([]);
  const [mahallaLoading, setMahallaLoading] = useState(false);
  const adminMahallaValue = adminForm.mahalla || '';
  const hasSelectedAdminMahallaOption =
    !adminMahallaValue ||
    mahallaOptions.some((mahalla) => mahalla.label === adminMahallaValue);
  const isEditingCurrentUser = Boolean(
    currentAdmin?.id && user?.id && currentAdmin.id === user.id
  );

  useEffect(() => {
    if (adminDialogOpen) setAdminDialogStep(0);
  }, [adminDialogOpen]);

  const normalizeAdminForm = (admin = {}) => ({
    name: admin.name || '',
    email: admin.email || '',
    plain_password: admin.plain_password || '',
    password: '',
    confirmPassword: '',
    role: admin.role || 'admin',
    phone: admin.phone || '',
    region: admin.region || '',
    district: admin.district || '',
    mahalla: admin.mahalla || '',
    address: admin.address || '',
    latitude: admin.latitude ?? '',
    longitude: admin.longitude ?? '',
    research_topic: admin.research_topic || '',
    research_type: admin.research_type || '',
    research_area: admin.research_area || '',
    scientific_supervisor: admin.scientific_supervisor || '',
    supervisor_id: admin.supervisor_id || '',
    admin_permissions: normalizeAdminPermissions(admin.admin_permissions),
    is_restricted: admin.is_restricted || 0,
  });

  // Deleted Data State
  const [deletedData, setDeletedData] = useState([]);
  const [deletedAdmins, setDeletedAdmins] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(25);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditUserFilter, setAuditUserFilter] = useState('');
  const [auditTargetFilter, setAuditTargetFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const showConfirm = (
    message,
    onConfirm,
    isDestructive = false,
    title = ''
  ) => {
    setConfirmDialog({
      open: true,
      title: title,
      message: message,
      onConfirm: onConfirm,
      isDestructive: isDestructive,
    });
  };

  const openAuditDrawer = (log) => {
    blurActiveElement();
    setSelectedAuditLog(log);
    setIsAuditDrawerOpen(true);
  };

  const closeAuditDrawer = () => {
    blurActiveElement();
    setIsAuditDrawerOpen(false);
  };

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dashFilters, setDashFilters] = useState({
    gender: '',
    region: '',
    age_min: 0,
    age_max: 100,
    bmi_min: 10,
    bmi_max: 50,
    somatotype: '',
    date_from: '',
    date_to: '',
  });
  const [viewRow, setViewRow] = useState(null);

  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  const [checked, setChecked] = useState(new Set());
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const getDeletedRowKey = (row) =>
    row.__rowKey || `${row.__deletedSource || 'analysis'}:${row.id}`;
  const getDeletedRowCode = (row) =>
    row.id_code || (row.id ? `#${row.id}` : '-');
  const getDeletedRowPatientName = (row) =>
    row.full_name ||
    row.name ||
    [row.last_name, row.first_name].filter(Boolean).join(' ') ||
    '-';
  const getDeletedByName = (row) =>
    row.deleted_by_name ||
    row.deleted_by?.name ||
    row.deleted_by_email ||
    pt('unknown');
  const getDeletedDate = (row) => {
    if (!row.deleted_at) return '-';
    const date = new Date(row.deleted_at);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };
  const normalizeLocationName = useCallback(
    (value = '') =>
      String(value)
        .toLowerCase()
        .replace(/[‘’`ʻʼ]/g, "'")
        .replace(/\s+/g, ' ')
        .replace(' respublikasi', '')
        .replace(' viloyati', '')
        .replace(' tumani', '')
        .replace(' shahri', '')
        .replace(' mahallasi', '')
        .replace(/[‘’ʻʼ']/g, '')
        .replace(/\bsergeli\b/g, 'sirgali')
        .trim(),
    []
  );
  const featureLabel = useCallback(
    (item) =>
      item?.name_uz ||
      item?.display_name ||
      item?.name_en ||
      item?.name_ru ||
      '',
    []
  );
  const canonicalRegionName = useCallback(
    (value = '') => {
      const raw = String(value).toLowerCase();
      if (raw.includes('toshkent')) {
        if (
          raw.includes('shah') ||
          raw.includes('city') ||
          raw.includes('город')
        ) {
          return 'toshkent shahri';
        }
        if (
          raw.includes('viloyat') ||
          raw.includes('region') ||
          raw.includes('област')
        ) {
          return 'toshkent viloyati';
        }
        return 'toshkent shahri';
      }
      return normalizeLocationName(value);
    },
    [normalizeLocationName]
  );
  const locationTokens = useCallback(
    (value = '') =>
      normalizeLocationName(value)
        .split(' ')
        .filter((part) => part && part.length > 1),
    [normalizeLocationName]
  );
  const locationMatches = useCallback(
    (left = '', right = '') => {
      const a = normalizeLocationName(left);
      const b = normalizeLocationName(right);
      if (!a || !b) return false;
      if (a === b || a.includes(b) || b.includes(a)) return true;
      const aTokens = locationTokens(a);
      const bTokens = locationTokens(b);
      return (
        aTokens.length > 0 && aTokens.every((token) => bTokens.includes(token))
      );
    },
    [locationTokens, normalizeLocationName]
  );
  const findBoundaryRegion = useCallback(
    (regionName) => {
      const key = canonicalRegionName(regionName);
      return (boundaryIndex?.levels?.['1'] || []).find(
        (item) => canonicalRegionName(featureLabel(item)) === key
      );
    },
    [boundaryIndex, canonicalRegionName, featureLabel]
  );
  const findBoundaryDistrict = useCallback(
    (districtName, regionName = adminForm.region) => {
      const region = findBoundaryRegion(regionName);
      const sameRegionDistricts = (boundaryIndex?.levels?.['2'] || []).filter(
        (item) => !region || String(item.parent_id) === String(region.id)
      );
      return (
        sameRegionDistricts.find((item) =>
          locationMatches(featureLabel(item), districtName)
        ) ||
        (boundaryIndex?.levels?.['2'] || []).find((item) =>
          locationMatches(featureLabel(item), districtName)
        )
      );
    },
    [
      adminForm.region,
      boundaryIndex,
      featureLabel,
      findBoundaryRegion,
      locationMatches,
    ]
  );
  const parseMaybeJson = (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };
  const getGeometryBounds = (geometry) => {
    const points = [];
    const collectPoints = (coordinates) => {
      if (!Array.isArray(coordinates)) return;
      if (
        typeof coordinates[0] === 'number' &&
        typeof coordinates[1] === 'number'
      ) {
        points.push(coordinates);
        return;
      }
      coordinates.forEach(collectPoints);
    };
    collectPoints(geometry?.coordinates);
    if (!points.length) return null;
    return [
      Math.min(...points.map(([lng]) => lng)),
      Math.min(...points.map(([, lat]) => lat)),
      Math.max(...points.map(([lng]) => lng)),
      Math.max(...points.map(([, lat]) => lat)),
    ];
  };
  const getLocationCenter = (item) => {
    const center = parseMaybeJson(item?.center);
    const bbox =
      parseMaybeJson(item?.bbox) || getGeometryBounds(item?.geometry);
    if (Array.isArray(center) && center.length >= 2) return center;
    if (Array.isArray(bbox) && bbox.length === 4) {
      return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    }
    return null;
  };
  const getAdminLocationSearchText = useCallback(
    (form = adminForm) =>
      [form.address, form.mahalla, form.district, form.region, 'Uzbekistan']
        .map((part) => String(part || '').trim())
        .filter(Boolean)
        .join(', '),
    [adminForm]
  );
  const MAX_MERCATOR = 20037508.342789244;
  const normalizeCoordinatePair = useCallback((latitude, longitude) => {
    const rawLat = Number(latitude);
    const rawLng = Number(longitude);
    const isLngLatUzbekistan = (lng, lat) =>
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= 55 &&
      lng <= 74 &&
      lat >= 37 &&
      lat <= 46;
    const mercatorToLngLat = (x, y) => {
      const lng = (x / MAX_MERCATOR) * 180;
      const lat = (Math.atan(Math.exp(y / 6378137)) * 360) / Math.PI - 90;
      return [lng, lat];
    };
    const isMercator = (x, y) =>
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Math.abs(x) <= MAX_MERCATOR &&
      Math.abs(y) <= MAX_MERCATOR;

    if (isLngLatUzbekistan(rawLng, rawLat))
      return { latitude: rawLat, longitude: rawLng };
    if (isLngLatUzbekistan(rawLat, rawLng))
      return { latitude: rawLng, longitude: rawLat };

    if (isMercator(rawLng, rawLat)) {
      const [lng, lat] = mercatorToLngLat(rawLng, rawLat);
      if (isLngLatUzbekistan(lng, lat))
        return { latitude: lat, longitude: lng };
    }
    if (isMercator(rawLat, rawLng)) {
      const [lng, lat] = mercatorToLngLat(rawLat, rawLng);
      if (isLngLatUzbekistan(lng, lat))
        return { latitude: lat, longitude: lng };
    }

    return null;
  }, []);
  const getGenderLabel = (gender) => {
    if (!gender) return '-';
    const normalized = String(gender).toLowerCase();
    if (['male', 'erkak', 'boy'].includes(normalized)) return 'Erkak';
    if (['female', 'ayol', 'girl'].includes(normalized)) return 'Ayol';
    return gender;
  };
  const getDeletedRowBmiText = (row) => {
    const bmi =
      row.bmi ??
      (row.weight && row.chest_standing_height
        ? (row.weight / Math.pow(row.chest_standing_height / 100, 2)).toFixed(1)
        : null);
    if (!bmi) return '-';
    return row.bmi_status ? `${bmi} (${row.bmi_status})` : String(bmi);
  };

  const toggleAll = useCallback(
    (rows) => {
      const next = new Set(checked);
      const allChecked =
        rows.length > 0 && rows.every((r) => checked.has(getDeletedRowKey(r)));
      if (allChecked) rows.forEach((r) => next.delete(getDeletedRowKey(r)));
      else rows.forEach((r) => next.add(getDeletedRowKey(r)));
      setChecked(next);
    },
    [checked]
  );

  const toggleOne = useCallback(
    (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setChecked(next);
    },
    [checked]
  );

  const handleBulkRestore = async () => {
    if (checked.size === 0) return;
    try {
      const selectedRows = deletedData.filter((row) =>
        checked.has(getDeletedRowKey(row))
      );
      const analysisIds = selectedRows
        .filter((row) => row.__deletedSource !== 'research')
        .map((row) => row.id);
      const researchIds = selectedRows
        .filter((row) => row.__deletedSource === 'research')
        .map((row) => row.id);

      if (analysisIds.length) await AdminApi.analyses.restore(analysisIds);
      for (const id of researchIds) await ResearchApi.restore(id);

      toast.success(pt('restoredMany'));
      setChecked(new Set());
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleBulkHardDelete = useCallback(async () => {
    if (checked.size === 0) return;
    blurActiveElement();
    setDeleteConfirmOpen(true);
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

        if (checked.size > 0 && activeTab === 4) {
          handleBulkHardDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checked.size, activeTab, handleBulkHardDelete]);

  useEffect(() => {
    let mounted = true;
    fetch('/maps/admin-boundaries/index.json')
      .then((response) => response.json())
      .then((data) => {
        if (mounted) setBoundaryIndex(data);
      })
      .catch((error) => console.warn('Boundary index load error:', error));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const districtName = adminForm.district;
    setMahallaOptions([]);
    setMahallaLoading(false);
    if (!districtName || !boundaryIndex?.levels?.['2']) return undefined;
    const district = findBoundaryDistrict(districtName, adminForm.region);
    const path =
      district &&
      (boundaryIndex.files?.['3']?.[String(district.id)] ||
        `level3/${district.id}.geojson`);
    if (!path) return undefined;
    setMahallaLoading(true);
    fetch(`/maps/admin-boundaries/${path}`)
      .then((response) => response.json())
      .then((geoJson) => {
        if (!mounted) return;
        setMahallaOptions(
          (geoJson.features || [])
            .map((feature) => ({
              ...feature.properties,
              geometry: feature.geometry,
              bbox: parseMaybeJson(feature.bbox || feature.properties?.bbox),
              center: parseMaybeJson(feature.properties?.center),
              label: featureLabel(feature.properties),
            }))
            .filter((item) => item.label)
            .sort((a, b) =>
              a.label.localeCompare(b.label, lang === 'kz' ? 'kk' : lang)
            )
        );
      })
      .catch((error) => console.warn('Mahalla layer load error:', error))
      .finally(() => {
        if (mounted) setMahallaLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adminForm.district,
    adminForm.region,
    boundaryIndex,
    featureLabel,
    findBoundaryDistrict,
  ]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      if (activeTab === 0 || activeTab === 1) {
        fetchDashboardStats(dashFilters);
        fetchAdmins();
      }
      if (activeTab === 2) {
        fetchDashboardStats(dashFilters);
        fetchAdmins();
      }
      if (activeTab === 3) fetchAdmins();
      if (activeTab === 4) {
        fetchDeletedAnalyses();
        fetchDeletedAdmins();
      }
      if (activeTab === 7) fetchBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, dashFilters]);

  // Dedicated useEffect for Audit Logs with debounced search
  useEffect(() => {
    if (activeTab === 6 && user?.role === 'superadmin') {
      if (!admins || admins.length === 0) {
        fetchAdmins();
      }
      const delayDebounceFn = setTimeout(() => {
        fetchAuditLogs();
      }, 250);
      return () => clearTimeout(delayDebounceFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    user,
    auditPage,
    auditPageSize,
    auditActionFilter,
    auditUserFilter,
    auditTargetFilter,
    auditSearch,
  ]);

  const getAdminReportRows = useCallback(
    () =>
      (admins || []).map((admin, index) => ({
        index: index + 1,
        name: admin.name || '-',
        email: admin.email || '-',
        role: admin.role || '-',
        phone: admin.phone || '-',
        region: admin.region
          ? getLocalizedLocationLabel(admin.region, lang, 1)
          : '-',
        district: admin.district
          ? getLocalizedLocationLabel(admin.district, lang, 2)
          : '-',
        mahalla: admin.mahalla
          ? getLocalizedLocationLabel(admin.mahalla, lang, 3)
          : '-',
        researchTopic: admin.research_topic || '-',
        researchType: admin.research_type || '-',
        researchArea: admin.research_area || '-',
        supervisor: admin.scientific_supervisor || '-',
        createdAt: formatReportDate(admin.created_at),
      })),
    [admins, lang]
  );

  const createAdminReportFallbackBlob = useCallback(() => {
    const rows = getAdminReportRows();
    const columns = reportLabels.columns;
    const header = ADMIN_REPORT_COLUMN_KEYS.map(
      (key) => `<th>${escapeExcelCell(columns[key] || key)}</th>`
    ).join('');
    const body = rows
      .map(
        (row) =>
          `<tr>${ADMIN_REPORT_COLUMN_KEYS.map(
            (key) => `<td>${escapeExcelCell(row[key])}</td>`
          ).join('')}</tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><h2>${escapeExcelCell(
      reportLabels.title
    )}</h2><p>${escapeExcelCell(reportLabels.generatedAt)}: ${escapeExcelCell(
      new Date().toLocaleString()
    )}</p><table border="1"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;

    return new Blob([html], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
  }, [getAdminReportRows, reportLabels]);

  const handleOpenAdminReport = () => {
    blurActiveElement();
    setAdminReportOpen(true);
    if (!admins.length && !adminsLoading) fetchAdmins();
  };

  const handleDownloadAdminReport = async () => {
    setAdminReportDownloading(true);
    try {
      let blob;
      let filename = `admin_researchers_report_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      try {
        blob = await AdminApi.users.exportXlsx({ include_researchers: true });
      } catch {
        blob = createAdminReportFallbackBlob();
        filename = filename.replace(/\.xlsx$/i, '.xls');
      }

      downloadBlob(blob, filename);
      toast.success(reportLabels.downloaded);
    } catch (err) {
      toast.error(`${reportLabels.downloadError} ${err.message}`);
    } finally {
      setAdminReportDownloading(false);
    }
  };

  const fetchDashboardStats = async (filters = dashFilters) => {
    setStatsLoading(true);
    try {
      const data = await AdminApi.stats(filters);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const setAdminPinFromBoundary = () => {
    const center = resolveAdminBoundaryCenter();
    if (!center) {
      toast.error(pt('locationNotFound'));
      return;
    }
    setAdminForm((current) => ({
      ...current,
      longitude: Number(center[0]).toFixed(6),
      latitude: Number(center[1]).toFixed(6),
    }));
    toast.success(pt('pinSelectedCenter'));
  };

  const geocodeAdminLocation = async (form = adminForm) => {
    const query = getAdminLocationSearchText(form);
    if (!query || query === 'Uzbekistan') {
      toast.error(pt('locationNotFound'));
      return null;
    }

    setAdminGeocoding(true);
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: query,
        countrycodes: 'uz',
        limit: '1',
        addressdetails: '1',
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const [result] = await response.json();
      const normalizedPair = result
        ? normalizeCoordinatePair(result.lat, result.lon)
        : null;

      if (!normalizedPair) {
        toast.error(pt('preciseLocationNotFound'));
        return null;
      }

      setAdminForm((current) => ({
        ...current,
        latitude: normalizedPair.latitude.toFixed(6),
        longitude: normalizedPair.longitude.toFixed(6),
      }));
      toast.success(pt('preciseLocationFound'));
      return normalizedPair;
    } catch (error) {
      console.warn('Admin geocoding failed:', error);
      toast.error(pt('preciseLocationNotFound'));
      return null;
    } finally {
      setAdminGeocoding(false);
    }
  };

  const setAdminFormWithBoundaryCenter = async (patch, options = {}) => {
    const nextForm = { ...adminForm, ...patch };
    const selectedMahalla = mahallaOptions.find(
      (item) => item.label === nextForm.mahalla
    );
    const selectedDistrict = findBoundaryDistrict(
      nextForm.district,
      nextForm.region
    );
    const preferredBoundary =
      options.preferMahalla && selectedMahalla
        ? selectedMahalla
        : options.preferDistrict && selectedDistrict
          ? selectedDistrict
          : null;
    const center = getLocationCenter(preferredBoundary);

    setAdminForm({ ...nextForm });

    if (options.geocode) {
      const geocoded = await geocodeAdminLocation(nextForm);
      if (geocoded) return;
    }

    if (options.fillFallbackCenter && center) {
      setAdminForm((current) => ({
        ...current,
        longitude: Number(center[0]).toFixed(6),
        latitude: Number(center[1]).toFixed(6),
      }));
      toast.success(pt('pinSelectedCenter'));
    }
  };

  const resolveAdminBoundaryCenter = () => {
    const selectedMahalla = mahallaOptions.find(
      (item) => item.label === adminForm.mahalla
    );
    const selectedDistrict = findBoundaryDistrict(
      adminForm.district,
      adminForm.region
    );
    const selectedRegion = findBoundaryRegion(adminForm.region);
    return (
      getLocationCenter(selectedMahalla) ||
      getLocationCenter(selectedDistrict) ||
      getLocationCenter(selectedRegion)
    );
  };

  const useCurrentLocationForAdmin = () => {
    if (!navigator.geolocation) {
      toast.error(pt('geolocationUnsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAdminForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast.success(pt('currentLocationFetched'));
      },
      () => toast.error(pt('geolocationDenied')),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await AdminApi.users.list();
      setAdmins(
        data.filter(
          (userItem) => userItem.email !== 'security_bot@system.local'
        )
      );
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchDeletedAnalyses = async () => {
    setDeletedLoading(true);
    try {
      const [analysisResult, researchResult] = await Promise.allSettled([
        AdminApi.analyses.deletedList({ page_size: 200 }),
        ResearchApi.deletedList({ page_size: 200 }),
      ]);

      if (analysisResult.status === 'rejected') {
        console.error(
          'Failed to fetch deleted analyses:',
          analysisResult.reason
        );
      }
      if (researchResult.status === 'rejected') {
        console.error(
          'Failed to fetch deleted research records:',
          researchResult.reason
        );
      }

      const analysisRows =
        analysisResult.status === 'fulfilled'
          ? (analysisResult.value.items || [])
              .filter((i) => i.is_deleted)
              .map((i) => ({
                ...i,
                deleted_by_name: getDeletedByName(i),
                __deletedSource: 'analysis',
                __rowKey: `analysis:${i.id}`,
              }))
          : [];
      const researchRows =
        researchResult.status === 'fulfilled'
          ? (researchResult.value || [])
              .filter((i) => i.is_deleted)
              .map((i) => ({
                ...i,
                deleted_by_name: getDeletedByName(i),
                __deletedSource: 'research',
                __rowKey: `research:${i.id}`,
              }))
          : [];

      setDeletedData(
        [...analysisRows, ...researchRows].sort(
          (a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0)
        )
      );
    } catch (err) {
      console.error('Failed to fetch deleted analyses:', err);
    } finally {
      setDeletedLoading(false);
    }
  };
  const fetchDeletedAdmins = async () => {
    setDeletedLoading(true);
    try {
      const data = await AdminApi.users.deletedList();
      setDeletedAdmins((data || []).filter((u) => u.is_deleted));
    } catch (err) {
      console.error('Failed to fetch deleted admins:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await AdminApi.auditLogs.list({
        page: auditPage,
        page_size: auditPageSize,
        action: auditActionFilter,
        user_id: auditUserFilter,
        target_type: auditTargetFilter,
        search: auditSearch,
      });
      setAuditLogs(data.items || []);
      setAuditTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchBackups = async () => {
    setBackupLoading(true);
    try {
      const data = await AdminApi.backup.list();
      setBackups(data.items || []);
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleLogin = async (e) => {
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
      } else if (profile.role !== 'superadmin' && profile.role !== 'admin') {
        navigate('/');
      }
    } catch (err) {
      setLoginError(err.message || pt('errorPrefix'));
    } finally {
      setLoginInProgress(false);
    }
  };

  const handleAdminAction = async () => {
    // Validation
    if (adminForm.password) {
      if (adminForm.password !== adminForm.confirmPassword) {
        toast.error(pt('passwordsNoMatch'));
        return;
      }
      if (adminForm.password.length < 6) {
        toast.error(`${pt('password')} 6+`);
        return;
      }
    } else if (!currentAdmin) {
      // New admin must have a password
      toast.error(pt('password'));
      return;
    }

    if (adminForm.role === 'field_assistant' && !adminForm.supervisor_id) {
      toast.error('Iltimos, assistent uchun kuratorni tanlang');
      return;
    }

    try {
      const { confirmPassword, ...payload } = adminForm;
      payload.admin_permissions = normalizeAdminPermissions(
        payload.admin_permissions
      );
      if (payload.role === 'field_assistant') {
        payload.supervisor_id = Number(payload.supervisor_id);
      } else {
        payload.supervisor_id = null;
      }
      if (isEditingCurrentUser) {
        payload.is_restricted = 0;
      }
      [
        'research_topic',
        'research_type',
        'research_area',
        'scientific_supervisor',
      ].forEach((key) => {
        if (payload[key]) payload[key] = payload[key].trim();
        if (payload[key] === '') payload[key] = null;
      });
      const latMissing =
        payload.latitude === '' ||
        payload.latitude === null ||
        payload.latitude === undefined;
      const lngMissing =
        payload.longitude === '' ||
        payload.longitude === null ||
        payload.longitude === undefined;
      if (latMissing !== lngMissing) {
        toast.error(
          'Aniq pin uchun latitude va longitude ikkisi ham kiritilishi kerak'
        );
        return;
      }
      const normalizedPair =
        payload.latitude !== '' &&
        payload.latitude !== null &&
        payload.latitude !== undefined &&
        payload.longitude !== '' &&
        payload.longitude !== null &&
        payload.longitude !== undefined
          ? normalizeCoordinatePair(payload.latitude, payload.longitude)
          : null;
      if (normalizedPair) {
        payload.latitude = normalizedPair.latitude;
        payload.longitude = normalizedPair.longitude;
      }
      ['latitude', 'longitude'].forEach((key) => {
        if (
          payload[key] === '' ||
          payload[key] === null ||
          payload[key] === undefined
        ) {
          delete payload[key];
        } else {
          payload[key] = Number(payload[key]);
        }
      });

      if (currentAdmin) {
        // UserUpdate doesn't have password_confirm
        if (!payload.password) delete payload.password;

        await AdminApi.users.update(currentAdmin.id, payload);
        if (isEditingCurrentUser) {
          await refreshUser();
        }
        toast.success(pt('updated'));
      } else {
        // UserCreate needs password_confirm
        payload.password_confirm = confirmPassword;
        await AdminApi.users.create(payload);
        toast.success(pt('newAdmin'));
      }
      setAdminDialogOpen(false);
      fetchAdmins();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const handleDeleteAdmin = async (id) => {
    const msg =
      CONFIRM_MESSAGES[lang]?.adminDeleteConfirm ||
      CONFIRM_MESSAGES['en'].adminDeleteConfirm;
    showConfirm(
      msg,
      async () => {
        try {
          const deleteUser = AdminApi.users.delete || AdminApi.users.remove;
          await deleteUser(id);
          fetchAdmins();
          fetchDeletedAdmins();
          toast.success(pt('adminDeleted'));
        } catch (err) {
          toast.error('Xatolik: ' + err.message);
        }
      },
      true
    );
  };

  const handleRestoreAnalysis = async (rowOrId) => {
    const row =
      typeof rowOrId === 'object'
        ? rowOrId
        : deletedData.find(
            (item) => item.id === rowOrId || getDeletedRowKey(item) === rowOrId
          );
    if (!row) return;

    try {
      if (row.__deletedSource === 'research') {
        await ResearchApi.restore(row.id);
      } else {
        await AdminApi.analyses.restore([row.id]);
      }
      toast.success(pt('dataRestored'));
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const handleRestoreAdmin = async (id) => {
    try {
      await AdminApi.users.restore(id);
      toast.success(pt('adminRestored'));
      fetchDeletedAdmins();
      fetchAdmins();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const handleHardDeleteAnalysis = async (rowOrId) => {
    const row =
      typeof rowOrId === 'object'
        ? rowOrId
        : deletedData.find(
            (item) => item.id === rowOrId || getDeletedRowKey(item) === rowOrId
          );
    if (!row) return;

    const msg =
      CONFIRM_MESSAGES[lang]?.hardDeleteDataConfirm ||
      CONFIRM_MESSAGES['en'].hardDeleteDataConfirm;
    showConfirm(
      msg,
      async () => {
        try {
          if (row.__deletedSource === 'research') {
            await ResearchApi.hardDelete(row.id);
          } else {
            await AdminApi.analyses.hardDelete([row.id]);
          }
          toast.success(pt('hardDeleted'));
          fetchDeletedAnalyses();
        } catch (err) {
          toast.error('Xatolik: ' + err.message);
        }
      },
      true
    );
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      await AdminApi.backup.create();
      toast.success(pt('createBackup'));
      fetchBackups();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    const msg = (
      CONFIRM_MESSAGES[lang]?.backupRestoreConfirm ||
      CONFIRM_MESSAGES['en'].backupRestoreConfirm
    ).replace('{filename}', filename);
    showConfirm(
      msg,
      async () => {
        setBackupLoading(true);
        try {
          await AdminApi.backup.restore(filename);
          toast.success(pt('restoredSuccessfully'));
        } catch (err) {
          toast.error('Xatolik: ' + err.message);
        } finally {
          setBackupLoading(false);
        }
      },
      false
    );
  };

  const handleDeleteBackup = async (filename) => {
    const msg = (
      CONFIRM_MESSAGES[lang]?.deleteBackupConfirm ||
      CONFIRM_MESSAGES['en'].deleteBackupConfirm
    ).replace('{filename}', filename);
    showConfirm(
      msg,
      async () => {
        try {
          await AdminApi.backup.delete(filename);
          toast.success(pt('fileDeleted'));
          fetchBackups();
        } catch (err) {
          toast.error('Xatolik: ' + err.message);
        }
      },
      true
    );
  };

  const handleClearAudit = async () => {
    const msg =
      CONFIRM_MESSAGES[lang]?.clearAuditConfirm ||
      CONFIRM_MESSAGES['en'].clearAuditConfirm;
    showConfirm(
      msg,
      async () => {
        try {
          await AdminApi.auditLogs.clear();
          toast.success(pt('auditCleared'));
          fetchAuditLogs();
        } catch (err) {
          toast.error('Xatolik: ' + err.message);
        }
      },
      true
    );
  };

  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // LOGIN SCREEN
  if (!user || user.role !== 'superadmin') {
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
                Super Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pt('superLoginSubtitle')}
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

  // MAIN CONTENT RENDERER
  const isDark = theme.palette.mode === 'dark';
  const adminReportRows = getAdminReportRows();
  const adminReportSummary = {
    total: admins.length,
    admins: admins.filter((item) => item.role === 'admin').length,
    researchers: admins.filter((item) => item.role === 'researcher').length,
    superadmins: admins.filter((item) => item.role === 'superadmin').length,
  };
  const tabContentProps = {
    activeTab,
    adminReportSummary,
    admins,
    adminsLoading,
    auditActionFilter,
    auditLoading,
    auditLogs,
    auditPage,
    auditPageSize,
    auditSearch,
    auditTargetFilter,
    auditTotal,
    auditUserFilter,
    backupLoading,
    backups,
    checked,
    closeAuditDrawer,
    dashFilters,
    deletedAdmins,
    deletedData,
    deletedLoading,
    getDeletedByName,
    getDeletedDate,
    getDeletedRowCode,
    getDeletedRowKey,
    getDeletedRowPatientName,
    handleBulkHardDelete,
    handleBulkRestore,
    handleClearAudit,
    handleCreateBackup,
    handleDeleteAdmin,
    handleDeleteBackup,
    handleHardDeleteAnalysis,
    handleOpenAdminReport,
    handleRestoreAdmin,
    handleRestoreAnalysis,
    handleRestoreBackup,
    isAuditDrawerOpen,
    isDark,
    lang,
    normalizeAdminForm,
    normalizeCoordinatePair,
    openAuditDrawer,
    pt,
    reportLabels,
    selectedAuditLog,
    setAdminDialogOpen,
    setAdminForm,
    setAuditActionFilter,
    setAuditPage,
    setAuditPageSize,
    setAuditSearch,
    setAuditTargetFilter,
    setAuditUserFilter,
    setCurrentAdmin,
    setDashFilters,
    setShowAdminPassword,
    setShowCurrentAdminPassword,
    setViewRow,
    stats,
    statsLoading,
    toggleAll,
    toggleOne,
    user,
  };

  const tabItems = [
    { icon: <Dashboard />, label: pt('dashboard') },
    { icon: <AutoGraph />, label: pageLabels.scientificAnalysis },
    { icon: <Place />, label: pt('regionalMap') },
    { icon: <People />, label: pt('admins') },
    { icon: <RestoreFromTrash />, label: pt('deleted') },
    { icon: <Security />, label: pt('security') },
    { icon: <History />, label: pt('auditLog') },
    { icon: <Storage />, label: pt('backup') },
    { icon: <AutoGraph />, label: pt('topChart') },
    { icon: <SettingsSuggest />, label: t('chatSettingsTitle') },
    { icon: <Security />, label: pt('privacySettings') },
  ];

  const isMapTab = activeTab === 2;

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        height: isMapTab && !isMobile ? 'calc(100vh - 64px)' : 'auto',
        minHeight: isMapTab && !isMobile ? 'calc(100vh - 64px)' : '100vh',
        pb: isMapTab && !isMobile ? 0 : 10,
        overflow: isMapTab && !isMobile ? 'hidden' : 'auto',
        display: isMapTab && !isMobile ? 'flex' : 'block',
        flexDirection: 'column',
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          py: isMapTab && !isMobile ? 1.5 : { xs: 1, md: 1.5 },
          pr: { xs: 1.5, sm: 2, md: 4 },
          pl: { xs: 1.5, sm: 2, md: '324px' },
          maxWidth: '100%',
          height: isMapTab && !isMobile ? '100%' : 'auto',
          display: isMapTab && !isMobile ? 'flex' : 'block',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Stack
          direction="column"
          spacing={isMapTab ? 1.5 : 3}
          alignItems="stretch"
          sx={{
            height: isMapTab && !isMobile ? '100%' : 'auto',
            minHeight: 0,
            flex: isMapTab && !isMobile ? 1 : 'auto',
          }}
        >
          {/* Sidebar Tabs */}
          <Box
            sx={{
              width: { xs: '100%', md: 276 },
              minWidth: { md: 276 },
              maxWidth: { md: 276 },
              flexShrink: 0,
              position: { md: 'fixed' },
              top: { md: 88 },
              left: { md: 24 },
              zIndex: { md: 10 },
              height: { md: 'calc(100vh - 104px)' },
              isolation: 'isolate',
            }}
          >
            <GlassPaper
              sx={{
                p: { xs: 1, sm: 1.35, md: 1.5 },
                display: { md: 'flex' },
                flexDirection: { md: 'column' },
                height: { md: '100%' },
                overflow: { xs: 'hidden', md: 'hidden' },
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(100,116,139,0.12)',
                boxShadow: isDark
                  ? '0 18px 48px rgba(0,0,0,0.34)'
                  : '0 18px 48px rgba(100,116,139,0.09)',
              }}
            >
              <Box
                sx={{
                  p: { xs: 1, md: 1.2 },
                  mb: { xs: 1, md: 1.5 },
                  textAlign: { xs: 'left', md: 'center' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', md: 'center' },
                  gap: { xs: 1.25, md: 0 },
                  flexDirection: { xs: 'row', md: 'column' },
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 44, md: 54 },
                    height: { xs: 44, md: 54 },
                    margin: { xs: 0, md: '0 auto 12px' },
                    bgcolor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: { xs: '0.9rem', md: '1.08rem' },
                  }}
                >
                  SA
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    noWrap
                    sx={{ fontSize: { xs: '0.98rem', md: '1.08rem' } }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: 'block' }}
                  >
                    {pt('adminManagement')}
                  </Typography>
                </Box>
              </Box>

              {/* Custom Nav Items with framer-motion layoutId sliding active state */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  gap: 0.75,
                  overflowX: isMobile ? 'auto' : 'visible',
                  pb: isMobile ? 1.5 : 0,
                  flex: { md: '1 1 auto' },
                  minHeight: { md: 0 },
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                }}
              >
                {tabItems.map((item, index) => {
                  const isSelected = activeTab === index;
                  return (
                    <Box
                      key={index}
                      component={motion.div}
                      onClick={() => setActiveTab(index)}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: { xs: 'center', md: 'flex-start' },
                        px: { xs: 2, md: 2.25 },
                        py: { xs: 1, md: 1.15 },
                        borderRadius: 3,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        color: isSelected
                          ? '#ffffff'
                          : isDark
                            ? 'rgba(255, 255, 255, 0.7)'
                            : 'rgba(15, 118, 110, 0.8)',
                        transition: 'color 0.25s ease',
                        userSelect: 'none',
                      }}
                    >
                      {/* Sliding Gradient Background for Active Tab */}
                      {isSelected && (
                        <Box
                          component={motion.div}
                          layoutId="activeTabIndicator"
                          transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 30,
                          }}
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 3,
                            background:
                              'linear-gradient(135deg, #14b8a6 0%, #2563eb 50%, #8b5cf6 100%)',
                            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                            zIndex: -1,
                          }}
                        />
                      )}

                      {/* Inactive Hover / Border style */}
                      {!isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(15,118,110,0.08)',
                            bgcolor: isDark
                              ? 'rgba(255,255,255,0.01)'
                              : 'rgba(15,118,110,0.01)',
                            zIndex: -2,
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            '&:hover': {
                              opacity: 1,
                            },
                          }}
                        />
                      )}

                      <Box
                        sx={{
                          mr: 1.25,
                          display: 'flex',
                          alignItems: 'center',
                          opacity: isSelected ? 1 : 0.8,
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        sx={{ fontSize: '0.82rem' }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Box
                mt="auto"
                pt={1.2}
                borderTop={
                  isDark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.05)'
                }
              >
                <Button
                  fullWidth
                  color="error"
                  startIcon={<Logout />}
                  onClick={() => {
                    blurActiveElement();
                    setLogoutDialogOpen(true);
                  }}
                  sx={{
                    minHeight: 42,
                    borderRadius: 999,
                    justifyContent: 'flex-start',
                    px: 1.6,
                    fontSize: '0.8rem',
                  }}
                >
                  {pt('logout')}
                </Button>
              </Box>
            </GlassPaper>
          </Box>

          {/* Main Content Area */}
          <Box
            sx={{
              ...scrollableContentSx,
              width: '100%',
              height: isMapTab && !isMobile ? '100%' : 'auto',
              display: isMapTab && !isMobile ? 'flex' : 'block',
              flexDirection: 'column',
              overflowX: isMapTab && !isMobile ? 'hidden' : 'auto',
              minHeight: 0,
              flex: isMapTab && !isMobile ? 1 : 'auto',
            }}
          >
            {/* Premium Header */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', lg: 'center' },
                gap: 1.5,
                mb: 1.5,
                p: 1.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 253, 250, 0.5) 100%)',
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(15, 118, 110, 0.08)',
                backdropFilter: 'blur(15px)',
                boxShadow: isDark
                  ? '0 10px 30px rgba(0,0,0,0.15)'
                  : '0 10px 30px rgba(100, 116, 139, 0.02)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{
                    background: isDark
                      ? 'linear-gradient(90deg, #38bdf8 0%, #2dd4bf 100%)'
                      : 'linear-gradient(90deg, #0f766e 0%, #2563eb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                  }}
                >
                  {tabItems[activeTab].label}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {formatPanelDate(new Date(), lang)}
                </Typography>
              </Box>

              {/* Quick System Stats */}
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                sx={{
                  width: { xs: '100%', lg: 'auto' },
                  maxWidth: '100%',
                  flexWrap: 'wrap',
                  overflowX: 'hidden',
                  py: 0.2,
                }}
              >
                {[
                  {
                    label: HEADER_LABELS[lang]?.totalAdmins,
                    value:
                      adminReportSummary.admins +
                      adminReportSummary.researchers,
                    icon: <People sx={{ fontSize: 16 }} />,
                    color: 'primary',
                  },
                  {
                    label: HEADER_LABELS[lang]?.systemStatus,
                    value: HEADER_LABELS[lang]?.active,
                    icon: <Security sx={{ fontSize: 16 }} />,
                    color: 'success',
                  },
                  {
                    label: HEADER_LABELS[lang]?.database,
                    value: HEADER_LABELS[lang]?.optimal,
                    icon: <Storage sx={{ fontSize: 16 }} />,
                    color: 'info',
                  },
                ].map((stat, idx) => (
                  <Box
                    key={idx}
                    component={motion.div}
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      maxWidth: '100%',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: isDark
                        ? 'rgba(30, 41, 59, 0.5)'
                        : 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.04)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: `${stat.color}.light`,
                        color: `${stat.color}.main`,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.68rem', fontWeight: 600 }}
                      >
                        {stat.label}:
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        color="text.primary"
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <AnimatePresence>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 28,
                  mass: 0.8,
                }}
                style={{
                  width: '100%',
                  height: isMapTab && !isMobile ? '100%' : 'auto',
                  display: isMapTab && !isMobile ? 'flex' : 'block',
                  flexDirection: 'column',
                  minHeight: 0,
                  flex: isMapTab && !isMobile ? 1 : 'auto',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    minWidth: {
                      xs: activeTab === 0 || activeTab === 1 ? 720 : 0,
                      md: 0,
                    },
                    height: isMapTab && !isMobile ? '100%' : 'auto',
                    display: isMapTab && !isMobile ? 'flex' : 'block',
                    flexDirection: 'column',
                    minHeight: 0,
                    flex: isMapTab && !isMobile ? 1 : 'auto',
                  }}
                >
                  <SuperAdminTabContent {...tabContentProps} />
                </Box>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Stack>

        <Dialog
          open={adminDialogOpen}
          onClose={() => setAdminDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {currentAdmin ? pt('adminEdit') : pt('addAdmin')}
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={adminDialogStep}
              onChange={(_, nextStep) => setAdminDialogStep(nextStep)}
              sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label={apt('profile')} />
              <Tab label={apt('adminRights')} />
            </Tabs>
            {adminDialogStep === 0 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label={pt('fullName')}
                  fullWidth
                  value={adminForm.name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, name: e.target.value })
                  }
                />
                <TextField
                  label="Email"
                  fullWidth
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, email: e.target.value })
                  }
                />

                {currentAdmin && (
                  <TextField
                    label={pt('currentPassword')}
                    type={showCurrentAdminPassword ? 'text' : 'password'}
                    fullWidth
                    disabled
                    value={adminForm.plain_password || pt('unknown')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowCurrentAdminPassword(
                                !showCurrentAdminPassword
                              )
                            }
                            edge="end"
                          >
                            {showCurrentAdminPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <TextField
                  label={
                    currentAdmin
                      ? `${pt('newPassword')} (${pt('optional')})`
                      : pt('password')
                  }
                  type={showAdminPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete="new-password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowAdminPassword(!showAdminPassword)
                          }
                          edge="end"
                        >
                          {showAdminPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label={pt('confirmPassword')}
                  type={showAdminPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete="new-password"
                  value={adminForm.confirmPassword}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={
                    adminForm.password !== adminForm.confirmPassword &&
                    adminForm.confirmPassword !== ''
                  }
                  helperText={
                    adminForm.password !== adminForm.confirmPassword &&
                    adminForm.confirmPassword !== ''
                      ? pt('passwordsNoMatch')
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowAdminPassword(!showAdminPassword)
                          }
                          edge="end"
                        >
                          {showAdminPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel>{pt('role')}</InputLabel>
                  <Select
                    value={adminForm.role}
                    label={pt('role')}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setAdminForm({
                        ...adminForm,
                        role: nextRole,
                        supervisor_id:
                          nextRole === 'field_assistant'
                            ? adminForm.supervisor_id
                            : '',
                      });
                    }}
                  >
                    <MenuItem value="admin">Administrator</MenuItem>
                    <MenuItem value="superadmin">Super Administrator</MenuItem>
                    <MenuItem value="researcher">{pt('researcher')}</MenuItem>
                    <MenuItem value="field_assistant">Field Assistant</MenuItem>
                  </Select>
                </FormControl>
                {adminForm.role === 'field_assistant' && (
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Kurator (Admin / Izlanuvchi)</InputLabel>
                    <Select
                      value={adminForm.supervisor_id || ''}
                      label="Kurator (Admin / Izlanuvchi)"
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          supervisor_id: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">
                        <em>Tanlanmagan</em>
                      </MenuItem>
                      {admins
                        .filter(
                          (item) =>
                            (item.role === 'admin' ||
                              item.role === 'researcher') &&
                            !item.is_deleted
                        )
                        .map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name} (
                            {c.role === 'admin' ? 'Admin' : pt('researcher')})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
                {adminForm.role === 'researcher' && (
                  <Stack spacing={2}>
                    <TextField
                      label={pt('researchTopic')}
                      fullWidth
                      multiline
                      minRows={2}
                      value={adminForm.research_topic || ''}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          research_topic: e.target.value,
                        })
                      }
                    />
                    <TextField
                      label={pt('scientificSupervisor')}
                      fullWidth
                      value={adminForm.scientific_supervisor || ''}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          scientific_supervisor: e.target.value,
                        })
                      }
                    />
                    <FormControl fullWidth>
                      <InputLabel>{pt('researchType')}</InputLabel>
                      <Select
                        value={adminForm.research_type || ''}
                        label={pt('researchType')}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            research_type: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">{pt('notSelected')}</MenuItem>
                        {RESEARCH_TYPE_OPTIONS.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>{pt('researchArea')}</InputLabel>
                      <Select
                        value={adminForm.research_area || ''}
                        label={pt('researchArea')}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            research_area: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">{pt('notSelected')}</MenuItem>
                        {adminForm.research_area &&
                          !Object.keys(UZB_LOCATIONS).includes(
                            adminForm.research_area
                          ) && (
                            <MenuItem value={adminForm.research_area}>
                              {adminForm.research_area}
                            </MenuItem>
                          )}
                        {Object.keys(UZB_LOCATIONS).map((region) => (
                          <MenuItem key={region} value={region}>
                            {region}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                )}
                <TextField
                  label={pt('phone')}
                  fullWidth
                  value={adminForm.phone || ''}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, phone: e.target.value })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>{pt('region')}</InputLabel>
                  <Select
                    value={adminForm.region || ''}
                    label={pt('region')}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        region: e.target.value,
                        district: '',
                        mahalla: '',
                        latitude: '',
                        longitude: '',
                      })
                    }
                  >
                    <MenuItem value="">{pt('allGlobal')}</MenuItem>
                    {Object.keys(UZB_LOCATIONS).map((r) => (
                      <MenuItem key={r} value={r}>
                        {getLocalizedLocationLabel(r, lang, 1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!adminForm.region}>
                  <InputLabel>{pt('districtCity')}</InputLabel>
                  <Select
                    value={adminForm.district || ''}
                    label={pt('districtCity')}
                    onChange={(e) =>
                      setAdminFormWithBoundaryCenter(
                        {
                          district: e.target.value,
                          mahalla: '',
                          latitude: '',
                          longitude: '',
                        },
                        { preferDistrict: true, geocode: true }
                      )
                    }
                  >
                    {!adminForm.region && (
                      <MenuItem value="">{pt('chooseRegionFirst')}</MenuItem>
                    )}
                    {(UZB_LOCATIONS[adminForm.region] || []).map((district) => (
                      <MenuItem key={district} value={district}>
                        {getLocalizedLocationLabel(district, lang, 2)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl
                  fullWidth
                  disabled={!adminForm.district || mahallaLoading}
                >
                  <InputLabel>{pt('mahalla')}</InputLabel>
                  <Select
                    value={adminMahallaValue}
                    label={pt('mahalla')}
                    onChange={(e) =>
                      setAdminFormWithBoundaryCenter(
                        {
                          mahalla: e.target.value,
                          latitude: '',
                          longitude: '',
                        },
                        { preferMahalla: true, geocode: true }
                      )
                    }
                  >
                    {mahallaLoading && (
                      <MenuItem value="">{pt('mahallasLoading')}</MenuItem>
                    )}
                    {!mahallaLoading && mahallaOptions.length === 0 && (
                      <MenuItem value="">{pt('mahallaNotFound')}</MenuItem>
                    )}
                    {!hasSelectedAdminMahallaOption && (
                      <MenuItem value={adminMahallaValue}>
                        {getLocalizedLocationLabel(adminMahallaValue, lang, 3)}
                      </MenuItem>
                    )}
                    {mahallaOptions.map((mahalla) => (
                      <MenuItem
                        key={mahalla.boundary_id || mahalla.id}
                        value={mahalla.label}
                      >
                        {getLocalizedLocationLabel(mahalla.label, lang, 3)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={pt('address')}
                  fullWidth
                  value={adminForm.address || ''}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, address: e.target.value })
                  }
                  onBlur={() => {
                    if (
                      adminForm.address ||
                      adminForm.mahalla ||
                      adminForm.district
                    ) {
                      geocodeAdminLocation(adminForm);
                    }
                  }}
                  helperText={pt('addressCoordinateHelp')}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    label="Latitude"
                    type="number"
                    fullWidth
                    value={adminForm.latitude ?? ''}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, latitude: e.target.value })
                    }
                  />
                  <TextField
                    label="Longitude"
                    type="number"
                    fullWidth
                    value={adminForm.longitude ?? ''}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, longitude: e.target.value })
                    }
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={
                      adminGeocoding ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Search />
                      )
                    }
                    onClick={() => geocodeAdminLocation(adminForm)}
                    disabled={
                      adminGeocoding ||
                      (!adminForm.region && !adminForm.address)
                    }
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {pt('findPreciseLocation')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Place />}
                    onClick={setAdminPinFromBoundary}
                    disabled={!adminForm.region || adminGeocoding}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {pt('pinRegionCenter')}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<MyLocation />}
                    onClick={useCurrentLocationForAdmin}
                    disabled={adminGeocoding}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {pt('getCurrentLocation')}
                  </Button>
                </Stack>
              </Stack>
            )}
            {adminDialogStep === 1 && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {!isEditingCurrentUser && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      borderColor: 'error.main',
                      bgcolor: 'error.50',
                    }}
                  >
                    <FormControlLabel
                      sx={{
                        m: 0,
                        width: '100%',
                        justifyContent: 'space-between',
                      }}
                      label={
                        <Typography fontWeight={800} color="error.main">
                          Faoliyatni cheklash
                        </Typography>
                      }
                      labelPlacement="start"
                      control={
                        <Switch
                          color="error"
                          checked={adminForm.is_restricted === 1}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              is_restricted: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                      }
                    />
                    <Typography
                      variant="caption"
                      color="error.main"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      Agar bu yoqilsa, foydalanuvchi tizimdan foydalana olmaydi.
                    </Typography>
                  </Paper>
                )}
                <Alert severity="info">{apt('inheritanceInfo')}</Alert>
                <Grid container spacing={1.5}>
                  {Object.entries(adminPermissionLabels).map(([key, label]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 1.5 }}
                      >
                        <FormControlLabel
                          sx={{
                            m: 0,
                            width: '100%',
                            justifyContent: 'space-between',
                          }}
                          label={
                            <Typography fontWeight={700}>{label}</Typography>
                          }
                          labelPlacement="start"
                          control={
                            <Switch
                              checked={
                                normalizeAdminPermissions(
                                  adminForm.admin_permissions
                                )[key]
                              }
                              onChange={(e) =>
                                setAdminForm({
                                  ...adminForm,
                                  admin_permissions: {
                                    ...normalizeAdminPermissions(
                                      adminForm.admin_permissions
                                    ),
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAdminDialogOpen(false)}>
              {pt('cancel')}
            </Button>
            <Button variant="contained" onClick={handleAdminAction}>
              {pt('save')}
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

        <Dialog
          open={adminReportOpen}
          onClose={() => setAdminReportOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '88vh',
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  {reportLabels.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reportLabels.subtitle}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setAdminReportOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Grid container spacing={1.5}>
                {[
                  [reportLabels.total, adminReportSummary.total, 'primary'],
                  [reportLabels.admins, adminReportSummary.admins, 'info'],
                  [
                    reportLabels.researchers,
                    adminReportSummary.researchers,
                    'success',
                  ],
                  [
                    reportLabels.superadmins,
                    adminReportSummary.superadmins,
                    'error',
                  ],
                ].map(([label, value, color]) => (
                  <Grid item xs={6} md={3} key={label}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        color={`${color}.main`}
                      >
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Chip
                  variant="outlined"
                  label={`${reportLabels.generatedAt}: ${new Date().toLocaleString()}`}
                />
                <Button
                  variant="contained"
                  startIcon={
                    adminReportDownloading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Download />
                    )
                  }
                  onClick={handleDownloadAdminReport}
                  disabled={adminReportDownloading || adminsLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {adminReportDownloading
                    ? reportLabels.downloading
                    : reportLabels.download}
                </Button>
              </Stack>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxHeight: 520,
                }}
              >
                <Table stickyHeader size="small" sx={{ minWidth: 1180 }}>
                  <TableHead>
                    <TableRow>
                      {ADMIN_REPORT_COLUMN_KEYS.map((key) => (
                        <TableCell key={key} sx={{ fontWeight: 800 }}>
                          {reportLabels.columns[key] || key}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminsLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={ADMIN_REPORT_COLUMN_KEYS.length}
                          align="center"
                          sx={{ py: 6 }}
                        >
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : adminReportRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={ADMIN_REPORT_COLUMN_KEYS.length}
                          align="center"
                          sx={{ py: 6 }}
                        >
                          {reportLabels.noRows}
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminReportRows.map((row) => (
                        <TableRow key={`${row.email}-${row.index}`} hover>
                          {ADMIN_REPORT_COLUMN_KEYS.map((key) => (
                            <TableCell
                              key={key}
                              sx={{
                                whiteSpace:
                                  key === 'researchTopic' ? 'normal' : 'nowrap',
                                maxWidth:
                                  key === 'researchTopic' ? 260 : undefined,
                              }}
                            >
                              {row[key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setAdminReportOpen(false)} color="inherit">
              {pt('close')}
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownloadAdminReport}
              disabled={adminReportDownloading || adminsLoading}
            >
              {reportLabels.download}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>{pt('hardDelete')}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pt('selectedPermanentDelete').replace('{count}', checked.size)}
            </Typography>
            <Box
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(211, 47, 47, 0.15)'
                    : 'rgba(211, 47, 47, 0.05)',
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
                <DeleteForever fontSize="small" /> {pt('irreversibleWarning')}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
              {pt('cancel')}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                setDeleteConfirmLoading(true);
                try {
                  const selectedRows = deletedData.filter((row) =>
                    checked.has(getDeletedRowKey(row))
                  );
                  const analysisIds = selectedRows
                    .filter((row) => row.__deletedSource !== 'research')
                    .map((row) => row.id);
                  const researchIds = selectedRows
                    .filter((row) => row.__deletedSource === 'research')
                    .map((row) => row.id);

                  if (analysisIds.length)
                    await AdminApi.analyses.hardDelete(analysisIds);
                  for (const id of researchIds)
                    await ResearchApi.hardDelete(id);

                  toast.success(pt('selectedDataDeleted'));
                  setChecked(new Set());
                  setDeleteConfirmOpen(false);
                  fetchDeletedAnalyses();
                } catch (e) {
                  toast.error(e.message);
                } finally {
                  setDeleteConfirmLoading(false);
                }
              }}
              disabled={deleteConfirmLoading}
            >
              {deleteConfirmLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                pt('yesHardDelete')
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {viewRow && (
          <Dialog
            open={true}
            onClose={() => setViewRow(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" fontWeight="bold">
                  {pt('deletedDetails')}
                </Typography>
                <IconButton onClick={() => setViewRow(null)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      ID Kod
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {getDeletedRowCode(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {pt('patient')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {getDeletedRowPatientName(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {pt('ageGender')}
                    </Typography>
                    <Typography variant="body1">
                      {viewRow.age ? `${viewRow.age} yosh` : '-'} /{' '}
                      {getGenderLabel(viewRow.gender)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      BMI
                    </Typography>
                    <Typography variant="body1">
                      {getDeletedRowBmiText(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(211, 47, 47, 0.1)'
                          : 'rgba(211, 47, 47, 0.05)',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'error.light',
                    }}
                  >
                    <Typography variant="caption" color="error.dark">
                      {pt('deletedBy')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {getDeletedByName(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(211, 47, 47, 0.1)'
                          : 'rgba(211, 47, 47, 0.05)',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'error.light',
                    }}
                  >
                    <Typography variant="caption" color="error.dark">
                      {pt('deletedAt')}
                    </Typography>
                    <Typography variant="body1">
                      {getDeletedDate(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                {(viewRow.region ||
                  viewRow.settlement ||
                  viewRow.school_name) && (
                  <Grid item xs={12}>
                    <Box
                      sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {pt('locationInstitution')}
                      </Typography>
                      <Typography variant="body1">
                        {[
                          viewRow.region || viewRow.settlement,
                          viewRow.school_name,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Refresh />}
                onClick={() => {
                  handleRestoreAnalysis(viewRow);
                  setViewRow(null);
                }}
              >
                {pt('restore')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => {
                  handleHardDeleteAnalysis(viewRow);
                  setViewRow(null);
                }}
              >
                {pt('hardDelete')}
              </Button>
              <Button onClick={() => setViewRow(null)} color="inherit">
                {pt('close')}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Container>

      {/* Custom Confirmation Dialog */}
      {(() => {
        const CONFIRM_TRANSLATIONS = {
          uz: {
            title: 'Tasdiqlash',
            cancel: 'Bekor qilish',
            confirm: 'Ha, tasdiqlayman',
          },
          ru: {
            title: 'Подтверждение',
            cancel: 'Отмена',
            confirm: 'Да, подтверждаю',
          },
          en: {
            title: 'Confirmation',
            cancel: 'Cancel',
            confirm: 'Yes, confirm',
          },
          tr: { title: 'Onay', cancel: 'İptal', confirm: 'Evet, onayla' },
          tm: {
            title: 'Tassyklamak',
            cancel: 'Bes et',
            confirm: 'Hawa, tassykla',
          },
          tg: {
            title: 'Тасдиқкунӣ',
            cancel: 'Рад кардан',
            confirm: 'Бале, тасдиқ мекунам',
          },
          kz: {
            title: 'Растау',
            cancel: 'Бас тарту',
            confirm: 'Иә, растаймын',
          },
          ky: {
            title: 'Ырастоо',
            cancel: 'Жокко чыгаруу',
            confirm: 'Ооба, ырастайм',
          },
        };
        const getConfirmText = (key) => {
          const trans =
            CONFIRM_TRANSLATIONS[lang] || CONFIRM_TRANSLATIONS['en'];
          return trans[key] || CONFIRM_TRANSLATIONS['en'][key];
        };
        return (
          <Dialog
            open={confirmDialog.open}
            onClose={() =>
              setConfirmDialog((prev) => ({ ...prev, open: false }))
            }
            PaperProps={{
              sx: {
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 40, 0.95)'
                    : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.08)',
                p: 1,
                minWidth: 320,
                maxWidth: 440,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                zIndex: 1600,
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: 800,
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <WarningAmber
                color={confirmDialog.isDestructive ? 'error' : 'primary'}
                sx={{ fontSize: 28 }}
              />
              {confirmDialog.title || getConfirmText('title')}
            </DialogTitle>
            <DialogContent>
              <DialogContentText
                sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                }}
              >
                {confirmDialog.message}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() =>
                  setConfirmDialog((prev) => ({ ...prev, open: false }))
                }
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {getConfirmText('cancel')}
              </Button>
              <Button
                variant="contained"
                color={confirmDialog.isDestructive ? 'error' : 'primary'}
                onClick={async () => {
                  if (confirmDialog.onConfirm) {
                    await confirmDialog.onConfirm();
                  }
                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: confirmDialog.isDestructive
                    ? '0 4px 12px rgba(244, 67, 54, 0.2)'
                    : '0 4px 12px rgba(33, 150, 243, 0.2)',
                }}
                autoFocus
              >
                {getConfirmText('confirm')}
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}
    </Box>
  );
};

export default SuperAdminPage;
