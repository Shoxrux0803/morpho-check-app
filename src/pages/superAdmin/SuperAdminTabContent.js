import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  AutoGraph,
  ChevronRight,
  Clear,
  Close,
  CloudUpload,
  ContentCopy,
  Delete,
  DeleteForever,
  Edit,
  FilterList,
  GetApp,
  History,
  Info,
  People,
  Public,
  Refresh,
  Search,
  Security,
  Visibility,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import SuperAdminDashboard from '../../components/Dashboard/SuperAdminDashboard';
import SuperAdminRegionalMap from '../../components/Dashboard/SuperAdminRegionalMap';
import ScientificAnalysis from '../../components/Dashboard/ScientificAnalysis';
import AdminActivity from '../../components/Admin/AdminActivity';
import SecuritySettings from '../../components/Admin/SecuritySettings';
import RoleSettingsCMS from '../../components/Admin/RoleSettingsCMS';
import PrivacySettings from '../../components/Admin/PrivacySettings';
import DashboardFilters from '../../components/Dashboard/DashboardFilters';
import {
  formatAuditAction,
  formatAuditDetails,
  formatAuditTarget,
} from './i18n';
import { blurActiveElement, GlassPaper } from './ui';

const SuperAdminTabContent = ({
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
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            <DashboardFilters
              filters={dashFilters}
              onFilterChange={setDashFilters}
              onReset={() =>
                setDashFilters({
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
            <SuperAdminDashboard
              stats={stats}
              statsLoading={statsLoading}
              admins={admins}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <DashboardFilters
              filters={dashFilters}
              onFilterChange={setDashFilters}
              onReset={() =>
                setDashFilters({
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
            <ScientificAnalysis stats={stats} loading={statsLoading} />
          </Box>
        );

      case 2:
        return (
          <SuperAdminRegionalMap
            stats={stats}
            statsLoading={statsLoading}
            admins={admins}
          />
        );

      case 3:
        return (
          <Stack spacing={2.5}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                p: { xs: 2, md: 2.5 },
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(20,184,166,0.16)',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(17,94,89,0.45))'
                  : 'linear-gradient(135deg, rgba(240,253,250,0.96), rgba(255,255,255,0.9) 52%, rgba(239,246,255,0.95))',
                boxShadow: isDark
                  ? '0 22px 52px rgba(0,0,0,0.26)'
                  : '0 22px 52px rgba(15,118,110,0.10)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', lg: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', lg: 'flex-start' },
                  gap: 2,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Stack spacing={1.25} sx={{ maxWidth: 680 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor: isDark
                          ? 'rgba(45,212,191,0.18)'
                          : 'rgba(13,148,136,0.12)',
                        color: isDark ? '#5eead4' : '#0f766e',
                      }}
                    >
                      <Security />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight={900}
                        sx={{
                          fontSize: { xs: '1.45rem', md: '2rem' },
                          lineHeight: 1.1,
                        }}
                      >
                        {pt('adminManagement')}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.35 }}
                      >
                        {admins.length} {pt('admins')} - {reportLabels.admins}{' '}
                        va {reportLabels.researchers}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ pt: 0.5 }}
                  >
                    {[
                      [reportLabels.total, adminReportSummary.total, 'primary'],
                      [
                        reportLabels.superadmins,
                        adminReportSummary.superadmins,
                        'error',
                      ],
                      [reportLabels.admins, adminReportSummary.admins, 'info'],
                      [
                        reportLabels.researchers,
                        adminReportSummary.researchers,
                        'success',
                      ],
                    ].map(([label, value, color]) => (
                      <Chip
                        key={label}
                        label={`${label}: ${value}`}
                        color={color}
                        variant={isDark ? 'filled' : 'outlined'}
                        sx={{
                          height: 32,
                          borderRadius: 2,
                          fontWeight: 800,
                          bgcolor:
                            isDark && color !== 'error'
                              ? 'rgba(255,255,255,0.08)'
                              : undefined,
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={handleOpenAdminReport}
                    disabled={adminsLoading}
                    sx={{
                      minHeight: 44,
                      borderRadius: 2,
                      px: 2,
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.72)',
                    }}
                  >
                    {reportLabels.preview}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      blurActiveElement();
                      setCurrentAdmin(null);
                      setAdminForm(normalizeAdminForm());
                      setShowAdminPassword(false);
                      setShowCurrentAdminPassword(false);
                      setAdminDialogOpen(true);
                    }}
                    sx={{
                      minHeight: 44,
                      borderRadius: 2,
                      px: 2.25,
                      fontWeight: 800,
                      boxShadow: '0 12px 24px rgba(20,184,166,0.25)',
                    }}
                  >
                    {pt('newAdmin')}
                  </Button>
                </Stack>
              </Box>
            </Box>

            <TableContainer
              component={GlassPaper}
              sx={{
                overflow: 'auto',
                borderRadius: 4,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(15,118,110,0.10)',
                boxShadow: isDark
                  ? '0 18px 42px rgba(0,0,0,0.22)'
                  : '0 18px 42px rgba(15,118,110,0.07)',
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: { xs: 680, md: 900 },
                  '& .MuiTableCell-root': {
                    borderBottomColor: isDark
                      ? 'rgba(255,255,255,0.07)'
                      : 'rgba(15,23,42,0.06)',
                  },
                }}
              >
                <TableHead
                  sx={{
                    bgcolor: isDark
                      ? 'rgba(15,23,42,0.64)'
                      : 'rgba(248,250,252,0.92)',
                    '& th': {
                      py: 1.5,
                      color: 'text.secondary',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      letterSpacing: 0,
                      textTransform: 'uppercase',
                    },
                  }}
                >
                  <TableRow>
                    <TableCell>{pt('name')}</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>{pt('role')}</TableCell>
                    <TableCell>{pt('phone')}</TableCell>
                    <TableCell>{pt('status')}</TableCell>
                    <TableCell align="right">{pt('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Stack spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                            }}
                          >
                            <People />
                          </Avatar>
                          <Typography fontWeight={800}>
                            {pt('noData')}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow
                        key={admin.id}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: isDark
                              ? 'rgba(45,212,191,0.06)'
                              : 'rgba(20,184,166,0.05)',
                          },
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor:
                                  admin.role === 'superadmin'
                                    ? 'error.light'
                                    : admin.role === 'researcher'
                                      ? 'success.light'
                                      : 'primary.light',
                                color:
                                  admin.role === 'superadmin'
                                    ? 'error.dark'
                                    : admin.role === 'researcher'
                                      ? 'success.dark'
                                      : 'primary.dark',
                                fontWeight: 900,
                              }}
                            >
                              {(admin.name || admin.email || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={800}>
                                {admin.name || '-'}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'block', md: 'none' } }}
                              >
                                {admin.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {admin.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={admin.role.toUpperCase()}
                            size="small"
                            color={
                              admin.role === 'superadmin'
                                ? 'error'
                                : admin.role === 'researcher'
                                  ? 'success'
                                  : 'primary'
                            }
                            variant="outlined"
                            sx={{
                              borderRadius: 1.5,
                              fontWeight: 900,
                              minWidth: 96,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {admin.phone || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pt('active')}
                            size="small"
                            color="success"
                            sx={{
                              borderRadius: 1.5,
                              fontWeight: 800,
                              bgcolor: isDark
                                ? 'rgba(34,197,94,0.18)'
                                : 'rgba(220,252,231,0.95)',
                              color: isDark ? '#86efac' : 'success.dark',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            justifyContent="flex-end"
                          >
                            <Tooltip title={pt('edit')}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  blurActiveElement();
                                  setCurrentAdmin(admin);
                                  const normalizedPair =
                                    normalizeCoordinatePair(
                                      admin.latitude,
                                      admin.longitude
                                    );
                                  setAdminForm({
                                    ...normalizeAdminForm(admin),
                                    latitude:
                                      normalizedPair?.latitude ??
                                      admin.latitude ??
                                      '',
                                    longitude:
                                      normalizedPair?.longitude ??
                                      admin.longitude ??
                                      '',
                                  });
                                  setShowAdminPassword(false);
                                  setShowCurrentAdminPassword(false);
                                  setAdminDialogOpen(true);
                                }}
                                sx={{
                                  bgcolor: isDark
                                    ? 'rgba(59,130,246,0.10)'
                                    : 'rgba(219,234,254,0.9)',
                                  '&:hover': {
                                    bgcolor: isDark
                                      ? 'rgba(59,130,246,0.18)'
                                      : 'rgba(191,219,254,1)',
                                  },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('delete')}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                  disabled={admin.id === user.id}
                                  sx={{
                                    bgcolor: isDark
                                      ? 'rgba(239,68,68,0.10)'
                                      : 'rgba(254,226,226,0.85)',
                                    '&:hover': {
                                      bgcolor: isDark
                                        ? 'rgba(239,68,68,0.18)'
                                        : 'rgba(254,202,202,0.95)',
                                    },
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        );
      case 4:
        return (
          <Stack spacing={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h4" fontWeight={800}>
                {pt('deletedData')}
              </Typography>
              {checked.size > 0 && (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Refresh />}
                    onClick={handleBulkRestore}
                  >
                    {pt('restore')} ({checked.size})
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteForever />}
                    onClick={handleBulkHardDelete}
                  >
                    {pt('hardDelete')} ({checked.size})
                  </Button>
                </Stack>
              )}
            </Box>
            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 700, lg: 1000 } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }}>
                      <Checkbox
                        size="small"
                        indeterminate={
                          checked.size > 0 && checked.size < deletedData.length
                        }
                        checked={
                          deletedData.length > 0 &&
                          deletedData.every((r) =>
                            checked.has(getDeletedRowKey(r))
                          )
                        }
                        onChange={() => toggleAll(deletedData)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ID Kod</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('patient')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('deletedBy')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('deletedAt')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deletedLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : deletedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        {pt('empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedData.map((item) => (
                      <TableRow
                        key={getDeletedRowKey(item)}
                        hover
                        onClick={() => toggleOne(getDeletedRowKey(item))}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: checked.has(getDeletedRowKey(item))
                            ? 'rgba(15,118,110,0.08)'
                            : 'inherit',
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={checked.has(getDeletedRowKey(item))}
                            onChange={() => toggleOne(getDeletedRowKey(item))}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {getDeletedRowCode(item)}
                        </TableCell>
                        <TableCell>{getDeletedRowPatientName(item)}</TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: 10,
                                bgcolor: 'error.main',
                              }}
                            >
                              {getDeletedByName(item).charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="caption" fontWeight={600}>
                              {getDeletedByName(item)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{getDeletedDate(item)}</TableCell>
                        <TableCell
                          align="right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title={pt('detailsTitle')}>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  blurActiveElement();
                                  setViewRow(item);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('restore')}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleRestoreAnalysis(item)}
                              >
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('hardDelete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleHardDeleteAnalysis(item)}
                              >
                                <Delete />
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

            <Typography variant="h5" fontWeight={700} sx={{ mt: 4, mb: 2 }}>
              {pt('deletedAdminsResearchers')}
            </Typography>
            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 800 } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('name')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('role')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('deletedAt')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deletedLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : deletedAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        {pt('empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedAdmins.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'warning.light',
                              }}
                            >
                              {item.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {item.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.role.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {item.deleted_at
                            ? new Date(item.deleted_at).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={pt('restore')}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleRestoreAdmin(item.id)}
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        );
      case 5:
        return (
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={800}>
              {pt('security')}
            </Typography>
            <SecuritySettings />
          </Stack>
        );
      case 6: {
        const AUDIT_TRANSLATIONS = {
          uz: {
            description:
              'Tizimdagi barcha amallar va hodisalar xavfsizlik jurnali',
            export: 'Eksport',
            totalEvents: 'Jami hodisalar',
            activeOperators: 'Faol operatorlar',
            securityEvents: 'Xavfsizlik',
            frequentAction: 'Koʻp amal',
            searchPlaceholder: 'IP, obʼyekt yoki matn boʻyicha qidirish...',
            action: 'Harakat',
            operator: 'Operator',
            allOperators: 'Barcha operatorlar',
            object: 'Obʼyekt',
            resetFilters: 'Filtrni tozalash',
            noEvents: 'Hech qanday hodisa topilmadi',
            rowsPerPage: 'Qatarlar soni:',
            eventDetails: 'Hodisa tafsilotlari',
            systemTime: 'Tizim vaqti:',
            performedAction: 'Bajarilgan amal:',
            systemObject: 'Tizim obʼyekti:',
            operatorInfo: 'Operator maʼlumotlari',
            ipAddress: 'IP Manzil:',
            detailsTitle: 'Tafsilotlar',
            formattedData: 'FORMATLANGAN MAʼLUMOT',
            rawJson: 'ASL JSON MAʼLUMOTI',
            noDataExport: 'Eksport qilish uchun maʼlumot yoʻq',
            exportSuccess: 'Eksport muvaffaqiyatli bajarildi',
            copied: 'Nusxalandi',
            detailsCol: 'Batafsil',
          },
          ru: {
            description:
              'Журнал безопасности всех действий и событий в системе',
            export: 'Экспорт',
            totalEvents: 'Всего событий',
            activeOperators: 'Активные операторы',
            securityEvents: 'Безопасность',
            frequentAction: 'Частое действие',
            searchPlaceholder: 'Поиск по IP, объекту или тексту...',
            action: 'Действие',
            operator: 'Оператор',
            allOperators: 'Все операторы',
            object: 'Объект',
            resetFilters: 'Сбросить фильтры',
            noEvents: 'Событий не найдено',
            rowsPerPage: 'Строк на странице:',
            eventDetails: 'Детали события',
            systemTime: 'Системное время:',
            performedAction: 'Выполненное действие:',
            systemObject: 'Объект системы:',
            operatorInfo: 'Информация об операторе',
            ipAddress: 'IP-адрес:',
            detailsTitle: 'Детали',
            formattedData: 'ФОРМАТИРОВАННЫЕ ДАННЫЕ',
            rawJson: 'ИСХОДНЫЕ ДАННЫЕ JSON',
            noDataExport: 'Нет данных для экспорта',
            exportSuccess: 'Экспорт успешно выполнен',
            copied: 'Скопировано',
            detailsCol: 'Подробнее',
          },
          en: {
            description: 'Security log of all actions and events in the system',
            export: 'Export',
            totalEvents: 'Total Events',
            activeOperators: 'Active Operators',
            securityEvents: 'Security',
            frequentAction: 'Frequent Action',
            searchPlaceholder: 'Search by IP, object or text...',
            action: 'Action',
            operator: 'Operator',
            allOperators: 'All Operators',
            object: 'Object',
            resetFilters: 'Reset Filters',
            noEvents: 'No events found',
            rowsPerPage: 'Rows per page:',
            eventDetails: 'Event Details',
            systemTime: 'System Time:',
            performedAction: 'Performed Action:',
            systemObject: 'System Object:',
            operatorInfo: 'Operator Information',
            ipAddress: 'IP Address:',
            detailsTitle: 'Details',
            formattedData: 'FORMATTED DATA',
            rawJson: 'RAW JSON DATA',
            noDataExport: 'No data to export',
            exportSuccess: 'Export completed successfully',
            copied: 'Copied',
            detailsCol: 'Details',
          },
          tr: {
            description:
              'Sistemdeki tüm eylemlerin ve olayların güvenlik günlüğü',
            export: 'Dışa Aktar',
            totalEvents: 'Toplam Olay',
            activeOperators: 'Aktif Operatörler',
            securityEvents: 'Güvenlik',
            frequentAction: 'Sık Yapılan Eylem',
            searchPlaceholder: 'IP, nesne veya metne göre ara...',
            action: 'Eylem',
            operator: 'Operatör',
            allOperators: 'Tüm Operatörler',
            object: 'Nesne',
            resetFilters: 'Filtreleri Temizle',
            noEvents: 'Olay bulunamadı',
            rowsPerPage: 'Sayfa başına satır:',
            eventDetails: 'Olay Detayları',
            systemTime: 'Sistem Zamanı:',
            performedAction: 'Gerçekleştirilen Eylem:',
            systemObject: 'Sistem Nesnesi:',
            operatorInfo: 'Operatör Bilgileri',
            ipAddress: 'IP Adresi:',
            detailsTitle: 'Detaylar',
            formattedData: 'BİÇİMLENDİRİLMİŞ VERİ',
            rawJson: 'HAM JSON VERİSİ',
            noDataExport: 'Dışa aktarılacak veri yok',
            exportSuccess: 'Dışa aktarma başarıyla tamamlandı',
            copied: 'Kopyalandı',
            detailsCol: 'Detaylar',
          },
          tm: {
            description:
              'Ulgamdaky ähli hereketleriň we wakalaryň howpsuzlyk žurnaly',
            export: 'Eksport',
            totalEvents: 'Jami wakalar',
            activeOperators: 'Aktiw operatorlar',
            securityEvents: 'Howpsuzlyk',
            frequentAction: 'Köp ýerine ýetirilýän hereket',
            searchPlaceholder: 'IP, obýekt ýa-da tekst boýunça gözleg...',
            action: 'Hereket',
            operator: 'Operator',
            allOperators: 'Ähli operatorlar',
            object: 'Obýekt',
            resetFilters: 'Süzgüji arassala',
            noEvents: 'Waka tapylmady',
            rowsPerPage: 'Setirleriň sany:',
            eventDetails: 'Waka jikme-jikleri',
            systemTime: 'Ulgam wagty:',
            performedAction: 'Ýerine ýetirilen hereket:',
            systemObject: 'Ulgam obýekti:',
            operatorInfo: 'Operator maglumatlary',
            ipAddress: 'IP salgysy:',
            detailsTitle: 'Jikme-jiklikler',
            formattedData: 'FORMATLANAN MAGLUMAT',
            rawJson: 'ASYL JSON MAGLUMATY',
            noDataExport: 'Eksport etmek üçin maglumat ýok',
            exportSuccess: 'Eksport üstünlikli tamamlandy',
            copied: 'Nusgalandy',
            detailsCol: 'Jikme-jik',
          },
          tg: {
            description:
              'Журнали амниятӣ барои ҳамаи амалҳо ва рӯйдодҳо дар система',
            export: 'Экспорт',
            totalEvents: 'Ҳамаи рӯйдодҳо',
            activeOperators: 'Операторони фаъол',
            securityEvents: 'Амният',
            frequentAction: 'Амали бештар иҷрошуда',
            searchPlaceholder: 'Ҷустуҷӯ аз рӯи IP, объект ё матн...',
            action: 'Амал',
            operator: 'Оператор',
            allOperators: 'Ҳамаи операторон',
            object: 'Объект',
            resetFilters: 'Тоза кардани филтрҳо',
            noEvents: 'Рӯйдодҳо ёфт нашуданд',
            rowsPerPage: 'Шумораи сатрҳо:',
            eventDetails: 'Тафсилоти рӯйдод',
            systemTime: 'Вақти система:',
            performedAction: 'Амали иҷрошуда:',
            systemObject: 'Объекти система:',
            operatorInfo: 'Маълумоти оператор',
            ipAddress: 'Суроғаи IP:',
            detailsTitle: 'Тафсилот',
            formattedData: 'МАЪЛУМОТИ ФОРМАТШУДА',
            rawJson: 'МАЪЛУМОТИ АСЛИИ JSON',
            noDataExport: 'Маълумот барои экспорт мавҷуд нест',
            exportSuccess: 'Экспорт бомуваффақият иҷро шуд',
            copied: 'Нусхабардорӣ шуд',
            detailsCol: 'Тафсилот',
          },
          kz: {
            description:
              'Жүйедегі барлық әрекеттер мен оқиғалардың қауіпсіздік журналы',
            export: 'Экспорт',
            totalEvents: 'Барлық оқиғалар',
            activeOperators: 'Белсенді операторлар',
            securityEvents: 'Қауіпсіздік',
            frequentAction: 'Жиі жасалатын әрекет',
            searchPlaceholder: 'IP, объект немесе мәтін бойынша іздеу...',
            action: 'Әрекет',
            operator: 'Оператор',
            allOperators: 'Барлық операторлар',
            object: 'Объект',
            resetFilters: 'Сүзгіні тазалау',
            noEvents: 'Оқиғалар табылмады',
            rowsPerPage: 'Жолдар саны:',
            eventDetails: 'Оқиға егжей-тегжейі',
            systemTime: 'Жүйе уақыты:',
            performedAction: 'Орындалған әрекет:',
            systemObject: 'Жүйе объектісі:',
            operatorInfo: 'Оператор мәліметтері',
            ipAddress: 'IP мекенжайы:',
            detailsTitle: 'Толық мәліметтер',
            formattedData: 'ПІШІМДЕЛГЕН МӘЛІМЕТТЕР',
            rawJson: 'БАСТАПҚЫ JSON МӘЛІМЕТІ',
            noDataExport: 'Экспорттау үшін мәлімет жоқ',
            exportSuccess: 'Экспорт сәтті аяқталды',
            copied: 'Көшірілді',
            detailsCol: 'Толығырақ',
          },
          ky: {
            description:
              'Системадагы бардык аракеттердин жана окуялардын коопсуздук журналы',
            export: 'Экспорт',
            totalEvents: 'Бардык окуялар',
            activeOperators: 'Активдүү операторлор',
            securityEvents: 'Коопсуздук',
            frequentAction: 'Көп аткарылган аракет',
            searchPlaceholder: 'IP, объект же текст боюнча издөө...',
            action: 'Аракет',
            operator: 'Operator',
            allOperators: 'Бардык операторлор',
            object: 'Объект',
            resetFilters: 'Чыпканы тазалоо',
            noEvents: 'Окуялар табылган жок',
            rowsPerPage: 'Саптардын саны:',
            eventDetails: 'Окуянын чоо-жайы',
            systemTime: 'Система убактысы:',
            performedAction: 'Аткарылган аракет:',
            systemObject: 'Система объектиси:',
            operatorInfo: 'Оператордун маалыматы',
            ipAddress: 'IP дареги:',
            detailsTitle: 'Чоо-жайы',
            formattedData: 'ФОРМАТТАЛГАН МААЛЫМАТ',
            rawJson: 'БАСТАПКЫ JSON МААЛЫМАТЫ',
            noDataExport: 'Экспорттоо үчүн маалымат жок',
            exportSuccess: 'Экспорт ийгиликтүү аяктады',
            copied: 'Көчүрүлдү',
            detailsCol: 'Чоо-жайы',
          },
        };

        const t = (key) => {
          const langKey = AUDIT_TRANSLATIONS[lang] ? lang : 'en';
          return (
            AUDIT_TRANSLATIONS[langKey][key] ||
            AUDIT_TRANSLATIONS['en'][key] ||
            key
          );
        };

        const getAuditStats = () => {
          const total = auditTotal;
          const uniqueUsers = new Set(
            auditLogs.map((log) => log.user_id).filter(Boolean)
          ).size;
          const securityEvents = auditLogs.filter((log) =>
            ['LOGIN', 'DELETE', 'CLEAR'].includes(log.action)
          ).length;

          const actionCounts = {};
          auditLogs.forEach((log) => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
          });
          let mostFrequentAction = '-';
          let maxCount = 0;
          Object.entries(actionCounts).forEach(([action, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostFrequentAction = action;
            }
          });

          return { total, uniqueUsers, securityEvents, mostFrequentAction };
        };

        const auditStats = getAuditStats();

        const getActionChipProps = (action) => {
          switch (action) {
            case 'CREATE':
              return {
                sx: {
                  background:
                    'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.15) 100%)',
                  color: '#2e7d32',
                  border: '1px solid rgba(76, 175, 80, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                },
              };
            case 'UPDATE':
              return {
                sx: {
                  background:
                    'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.15) 100%)',
                  color: '#b26a00',
                  border: '1px solid rgba(255, 152, 0, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                },
              };
            case 'DELETE':
            case 'CLEAR':
              return {
                sx: {
                  background:
                    'linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(244, 67, 54, 0.15) 100%)',
                  color: '#d32f2f',
                  border: '1px solid rgba(244, 67, 54, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                },
              };
            case 'LOGIN':
              return {
                sx: {
                  background:
                    'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.15) 100%)',
                  color: '#1565c0',
                  border: '1px solid rgba(33, 150, 243, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                },
              };
            case 'RESTORE':
              return {
                sx: {
                  background:
                    'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.15) 100%)',
                  color: '#7b1fa2',
                  border: '1px solid rgba(156, 39, 176, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                },
              };
            default:
              return {
                sx: {
                  background:
                    'linear-gradient(135deg, rgba(158, 158, 158, 0.08) 0%, rgba(158, 158, 158, 0.15) 100%)',
                  color: '#616161',
                  border: '1px solid rgba(158, 158, 158, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                },
              };
          }
        };

        const handleExportCSV = () => {
          if (!auditLogs.length) {
            toast.error(t('noDataExport'));
            return;
          }

          const headers = [
            t('time'),
            t('operator'),
            'Email',
            t('action'),
            t('object'),
            'ID',
            t('detailsTitle'),
            'IP',
          ];

          const rows = auditLogs.map((log) => [
            new Date(log.created_at).toLocaleString(),
            log.user_name || 'System',
            log.user_email || '-',
            log.action,
            log.target_type || '-',
            log.target_id || '-',
            log.details || '',
            log.ip_address || '-',
          ]);

          const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            [
              headers.join(','),
              ...rows.map((e) =>
                e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
              ),
            ].join('\n');

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute(
            'download',
            `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(t('exportSuccess'));
        };

        return (
          <Stack spacing={3}>
            {/* Title & Action buttons */}
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={2}
            >
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ letterSpacing: -0.5 }}
                >
                  {pt('auditLog')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {t('description')}
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1.5}
                width={{ xs: '100%', sm: 'auto' }}
              >
                <Button
                  startIcon={<GetApp />}
                  variant="outlined"
                  onClick={handleExportCSV}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  {t('export')}
                </Button>
                <Button
                  startIcon={<Delete />}
                  color="error"
                  variant="contained"
                  onClick={handleClearAudit}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(244, 67, 54, 0.3)',
                    },
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  {pt('clear')}
                </Button>
              </Stack>
            </Box>

            {/* Overview Stats Cards */}
            <Grid container spacing={2}>
              {[
                {
                  title: t('totalEvents'),
                  value: auditTotal,
                  icon: <History sx={{ fontSize: 20 }} />,
                  gradient:
                    'linear-gradient(135deg, rgba(33, 150, 243, 0.03) 0%, rgba(33, 150, 243, 0.07) 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.12)',
                  color: '#2196f3',
                },
                {
                  title: t('activeOperators'),
                  value: auditStats.uniqueUsers,
                  icon: <People sx={{ fontSize: 20 }} />,
                  gradient:
                    'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(76, 175, 80, 0.07) 100%)',
                  border: '1px solid rgba(76, 175, 80, 0.12)',
                  color: '#4caf50',
                },
                {
                  title: t('securityEvents'),
                  value: auditStats.securityEvents,
                  icon: <Security sx={{ fontSize: 20 }} />,
                  gradient:
                    'linear-gradient(135deg, rgba(244, 67, 54, 0.03) 0%, rgba(244, 67, 54, 0.07) 100%)',
                  border: '1px solid rgba(244, 67, 54, 0.12)',
                  color: '#f44336',
                },
                {
                  title: t('frequentAction'),
                  value: formatAuditAction(auditStats.mostFrequentAction, lang),
                  icon: <AutoGraph sx={{ fontSize: 20 }} />,
                  gradient:
                    'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(156, 39, 176, 0.07) 100%)',
                  border: '1px solid rgba(156, 39, 176, 0.12)',
                  color: '#9c27b0',
                },
              ].map((card, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        background: card.gradient,
                        border: card.border,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: '100%',
                        boxSizing: 'border-box',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: '8px',
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(0, 0, 0, 0.2)'
                              : 'rgba(255, 255, 255, 0.8)',
                          display: 'flex',
                          color: card.color,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Box minWidth={0} sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          sx={{
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            display: 'block',
                          }}
                        >
                          {card.title}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                          sx={{
                            color: card.color,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mt: 0.25,
                          }}
                        >
                          {card.value}
                        </Typography>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Advanced Filters Panel - Two Rows for better spacing */}
            {/* Advanced Filters Panel - Structured with Boxes to prevent squeezing */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 40, 0.65)'
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              {/* Row 1: Search */}
              <Box width="100%">
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('searchPlaceholder')}
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search
                          sx={{ color: 'text.secondary', fontSize: 20 }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: auditSearch && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAuditSearch('');
                            setAuditPage(1);
                          }}
                        >
                          <Clear sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 2: Select Filters */}
              <Box
                display="flex"
                flexDirection={{ xs: 'column', md: 'row' }}
                gap={2}
                alignItems="center"
                width="100%"
              >
                <FormControl
                  size="small"
                  sx={{ flex: 1, minWidth: 120, width: '100%' }}
                >
                  <InputLabel>{t('action')}</InputLabel>
                  <Select
                    value={auditActionFilter}
                    label={t('action')}
                    onChange={(e) => {
                      setAuditActionFilter(e.target.value);
                      setAuditPage(1);
                    }}
                  >
                    <MenuItem value="ALL">{pt('all')}</MenuItem>
                    <MenuItem value="LOGIN">LOGIN</MenuItem>
                    <MenuItem value="CREATE">CREATE</MenuItem>
                    <MenuItem value="UPDATE">UPDATE</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                    <MenuItem value="RESTORE">RESTORE</MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{ flex: 1.2, minWidth: 160, width: '100%' }}
                >
                  <InputLabel>{t('operator')}</InputLabel>
                  <Select
                    value={auditUserFilter}
                    label={t('operator')}
                    onChange={(e) => {
                      setAuditUserFilter(e.target.value);
                      setAuditPage(1);
                    }}
                  >
                    <MenuItem value="">{t('allOperators')}</MenuItem>
                    {admins.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  sx={{ flex: 1, minWidth: 120, width: '100%' }}
                >
                  <InputLabel>{t('object')}</InputLabel>
                  <Select
                    value={auditTargetFilter}
                    label={t('object')}
                    onChange={(e) => {
                      setAuditTargetFilter(e.target.value);
                      setAuditPage(1);
                    }}
                  >
                    <MenuItem value="ALL">{pt('all')}</MenuItem>
                    <MenuItem value="User">User</MenuItem>
                    <MenuItem value="PatientAnalysis">PatientAnalysis</MenuItem>
                    <MenuItem value="Payment">Payment</MenuItem>
                    <MenuItem value="Backup">Backup</MenuItem>
                    <MenuItem value="ClinicalData">ClinicalData</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setAuditActionFilter('ALL');
                    setAuditUserFilter('');
                    setAuditTargetFilter('ALL');
                    setAuditSearch('');
                    setAuditPage(1);
                  }}
                  startIcon={<FilterList />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    height: 40,
                    whiteSpace: 'nowrap',
                    px: 3,
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  {t('resetFilters')}
                </Button>
              </Box>
            </Paper>

            {/* Table */}
            <TableContainer
              component={GlassPaper}
              sx={{
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              }}
            >
              <Table
                size="medium"
                sx={{ minWidth: { xs: 300, sm: 500, md: 700, lg: 850 } }}
              >
                <TableHead
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(0,0,0,0.01)',
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '180px' }}>
                      {pt('time')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t('operator')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '120px' }}>
                      {pt('action')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('object')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '150px' }}>
                      {t('ipAddress').replace(':', '')}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, width: '100px' }}
                    >
                      {t('detailsCol')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                        <CircularProgress size={40} thickness={4} />
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 8, color: 'text.secondary' }}
                      >
                        {t('noEvents')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {auditLogs.map((log, index) => (
                        <TableRow
                          key={log.id}
                          hover
                          component={motion.tr}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: Math.min(index * 0.03, 0.3),
                          }}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.03) !important'
                                  : 'rgba(0,0,0,0.01) !important',
                            },
                          }}
                          onClick={() => openAuditDrawer(log)}
                        >
                          <TableCell
                            sx={{
                              fontSize: '0.85rem',
                              color: 'text.secondary',
                            }}
                          >
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Avatar
                                sx={{
                                  bgcolor: 'primary.main',
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.9rem',
                                  fontWeight: 600,
                                }}
                              >
                                {log.user_name
                                  ? log.user_name.charAt(0).toUpperCase()
                                  : 'S'}
                              </Avatar>
                              <Box minWidth={0}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  noWrap
                                >
                                  {log.user_name || 'System'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  display="block"
                                >
                                  {log.user_email || 'system@morphocheck.uz'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatAuditAction(log.action, lang)}
                              size="small"
                              {...getActionChipProps(log.action)}
                            />
                          </TableCell>
                          <TableCell sx={{ wordBreak: 'break-word' }}>
                            <Stack spacing={0.5}>
                              {log.target_type && (
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  fontWeight={600}
                                >
                                  {formatAuditTarget(log.target_type, lang)}
                                  {log.target_id ? ` #${log.target_id}` : ''}
                                </Typography>
                              )}
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                sx={{ maxWidth: 280, textOverflow: 'ellipsis' }}
                              >
                                {formatAuditDetails(log.details, lang)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              color="text.secondary"
                            >
                              <Public sx={{ fontSize: 16 }} />
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: 'monospace' }}
                              >
                                {log.ip_address || '127.0.0.1'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell
                            align="right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openAuditDrawer(log)}
                            >
                              <ChevronRight />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={auditTotal}
                rowsPerPage={auditPageSize}
                page={auditPage - 1}
                onPageChange={(e, newPage) => setAuditPage(newPage + 1)}
                onRowsPerPageChange={(e) => {
                  setAuditPageSize(parseInt(e.target.value, 10));
                  setAuditPage(1);
                }}
                labelRowsPerPage={t('rowsPerPage')}
              />
            </TableContainer>

            {/* Details Drawer */}
            <Drawer
              anchor="right"
              open={isAuditDrawerOpen}
              onClose={closeAuditDrawer}
              sx={{ zIndex: 1500 }}
              PaperProps={{
                sx: {
                  width: { xs: '100%', sm: 460, md: 520 },
                  p: 3,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(30, 30, 40, 0.95)'
                      : 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
                  borderLeft: (theme) =>
                    `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                },
              }}
            >
              {selectedAuditLog && (
                <Stack spacing={3} sx={{ height: '100%' }}>
                  {/* Drawer Header */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Info color="primary" /> {t('eventDetails')}
                    </Typography>
                    <IconButton onClick={closeAuditDrawer}>
                      <Close />
                    </IconButton>
                  </Box>

                  <Divider />

                  {/* Event Meta */}
                  <Stack spacing={1.5}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t('systemTime')}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(selectedAuditLog.created_at).toLocaleString()}
                      </Typography>
                    </Box>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t('performedAction')}
                      </Typography>
                      <Chip
                        label={formatAuditAction(selectedAuditLog.action, lang)}
                        size="small"
                        {...getActionChipProps(selectedAuditLog.action)}
                      />
                    </Box>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t('systemObject')}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="primary"
                      >
                        {formatAuditTarget(selectedAuditLog.target_type, lang)}{' '}
                        {selectedAuditLog.target_id
                          ? `#${selectedAuditLog.target_id}`
                          : ''}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  {/* Operator Info */}
                  <Stack spacing={1.5}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {t('operatorInfo')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
                      >
                        {selectedAuditLog.user_name
                          ? selectedAuditLog.user_name.charAt(0).toUpperCase()
                          : 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedAuditLog.user_name || 'System'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedAuditLog.user_email ||
                            'system@morphocheck.uz'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Public sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('ipAddress')}{' '}
                        <span
                          style={{
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            color: (theme) => theme.palette.text.primary,
                          }}
                        >
                          {selectedAuditLog.ip_address || '127.0.0.1'}
                        </span>
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  {/* Event Details Content */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      overflow: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                      >
                        {t('detailsTitle')}
                      </Typography>
                      <Tooltip title={t('copied')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(selectedAuditLog, null, 2)
                            );
                            toast.success(t('copied'));
                          }}
                        >
                          <ContentCopy sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Formatted View */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                        gutterBottom
                        display="block"
                      >
                        {t('formattedData')}
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.01)'
                              : 'rgba(0,0,0,0.01)',
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                        >
                          {formatAuditDetails(selectedAuditLog.details, lang)}
                        </Typography>
                      </Paper>
                    </Box>

                    {/* Raw JSON - Only show if details is actually a JSON object/array */}
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedAuditLog.details);
                        if (parsed && typeof parsed === 'object') {
                          return (
                            <Box
                              sx={{
                                flexGrow: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 150,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                                gutterBottom
                                display="block"
                              >
                                {t('rawJson')}
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  bgcolor: (theme) =>
                                    theme.palette.mode === 'dark'
                                      ? 'rgba(0,0,0,0.2)'
                                      : 'rgba(0,0,0,0.02)',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                  overflow: 'auto',
                                  borderRadius: 2,
                                  flexGrow: 1,
                                  maxHeight: '240px',
                                }}
                              >
                                {JSON.stringify(parsed, null, 2)}
                              </Paper>
                            </Box>
                          );
                        }
                      } catch (e) {
                        // Not a JSON, do not render raw box
                      }
                      return null;
                    })()}
                  </Box>
                </Stack>
              )}
            </Drawer>
          </Stack>
        );
      }
      case 7:
        return (
          <Stack spacing={3}>
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={2}
            >
              <Typography variant="h4" fontWeight={800}>
                {pt('backupsTitle')}
              </Typography>
              <Button
                startIcon={<CloudUpload />}
                variant="contained"
                onClick={handleCreateBackup}
                disabled={backupLoading}
              >
                {pt('createBackup')}
              </Button>
            </Box>
            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 700 } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('filename')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('size')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('time')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupLoading && backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(backups) &&
                    backups.map((b) => (
                      <TableRow key={b.filename} hover>
                        <TableCell fontWeight="bold">{b.filename}</TableCell>
                        <TableCell>
                          {(
                            (b.size_bytes || b.size || 0) /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </TableCell>
                        <TableCell>
                          {new Date(b.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title={pt('restore')}>
                              <IconButton
                                color="primary"
                                onClick={() => handleRestoreBackup(b.filename)}
                              >
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('delete')}>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteBackup(b.filename)}
                              >
                                <Delete />
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
          </Stack>
        );
      case 8:
        return <AdminActivity />;
      case 9:
        return <RoleSettingsCMS />;
      case 10:
        return <PrivacySettings />;
      default:
        return null;
    }
  };

  return renderTabContent();
};

export default SuperAdminTabContent;
