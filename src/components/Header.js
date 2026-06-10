import React, { useState } from 'react';
import {
  Link as RouterLink,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Drawer,
  List,
  Divider,
  DialogContent,
  MenuItem,
  Popover,
  Select,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SyncIcon from '@mui/icons-material/Sync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Badge from '@mui/material/Badge';

import { useThemeMode } from '../providers/ThemeProviderMUI';
import { THEME_VARIANTS } from '../theme/muiTheme';
import logo from '../assets/morphocheck-logo.png';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useOfflineSync } from '../providers/OfflineSyncProvider';
import WeatherClock from './WeatherClock';
import SyncManager from './SyncManager';
import LogoutConfirmDialog from './LogoutConfirmDialog';

const blurActiveElement = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const getThemeVariantLabel = (value) =>
  value === 'neo'
    ? 'Neo (Aurora)'
    : value === 'ocean'
      ? 'Ocean'
      : value === 'sunset'
        ? 'Sunset'
        : 'Minimal';

const languageOptions = [...LANGUAGES].sort((a, b) =>
  a.code === 'en' ? -1 : b.code === 'en' ? 1 : 0
);

const guidelinesLabels = {
  uz: { label: 'Yordam', tooltip: "Vizual yo'riqnomalar" },
  ru: { label: 'Помощь', tooltip: 'Визуальные инструкции' },
  en: { label: 'Help', tooltip: 'Visual guidelines' },
  tg: { label: 'Ёрӣ', tooltip: 'Дастурҳои визуалӣ' },
  kz: { label: 'Көмек', tooltip: 'Көрнекі нұсқаулықтар' },
  ky: { label: 'Жардам', tooltip: 'Визуалдык колдонмолор' },
};

export default function Header() {
  const { mode, toggle, variant, setVariant } = useThemeMode();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const { pendingCount, isOnline, setEditingItem } = useOfflineSync();
  const navigate = useNavigate();
  const location = useLocation();

  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [langChanging, setLangChanging] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openLogoutDialog = () => {
    blurActiveElement();
    setDrawerOpen(false);
    setLogoutDialogOpen(true);
  };

  const openSyncManager = () => {
    blurActiveElement();
    setDrawerOpen(false);
    setSyncOpen(true);
  };

  const openDrawer = () => {
    blurActiveElement();
    setDrawerOpen(true);
  };

  const openSettings = (event) => {
    blurActiveElement();
    setSettingsAnchorEl(event.currentTarget);
  };

  const closeSettings = () => {
    setSettingsAnchorEl(null);
  };

  const handleLangChange = (code) => {
    if (code === lang) {
      return;
    }
    setLangChanging(true);
    setTimeout(() => {
      setLang(code);
      setLangChanging(false);
    }, 220);
  };

  const navButtonSx = {
    '&.active': {
      fontWeight: 700,
      color: 'primary.main',
      backgroundColor:
        mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    color: 'text.secondary',
    borderRadius: 2,
    px: 2,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor:
        mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      transform: 'translateY(-1px)',
    },
  };

  const researcherSection =
    new URLSearchParams(location.search).get('section') || 'home';
  const isResearcherHome =
    user?.role === 'researcher' &&
    location.pathname === '/researcher' &&
    researcherSection === 'home';
  const homePath = user?.role === 'researcher' ? '/researcher' : '/';
  const analyzePath = '/morphocheck-pro';
  const guidelinesPath = '/guidelines';
  const researcherNavItems = [
    {
      label: 'Asosiy',
      to: '/researcher?section=home',
      section: 'home',
      icon: <HomeIcon />,
    },
    {
      label: 'Tahlil qilish',
      to: '/researcher?section=analyze',
      section: 'analyze',
      icon: <AnalyticsIcon />,
    },
    {
      label: 'Izlanuvchi panel',
      to: '/researcher?section=panel',
      section: 'panel',
      icon: <AdminPanelSettingsIcon />,
    },
  ];

  const activeNavSx = {
    fontWeight: 700,
    color: 'primary.main',
    backgroundColor:
      mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  };
  const guidelinesCopy = guidelinesLabels[lang] || guidelinesLabels.en;

  return (
    <>
      <AppBar
        className="mc-header-glow"
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 20,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          {/* Brand */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            component={RouterLink}
            to={homePath}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
              minWidth: 0,
              '&:hover img': { transform: 'scale(1.06)' },
            }}
          >
            <Box
              sx={{
                width: { xs: 44, sm: 48 },
                height: { xs: 44, sm: 48 },
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                background:
                  mode === 'dark'
                    ? 'linear-gradient(145deg, rgba(15, 118, 110, 0.22), rgba(37, 99, 235, 0.14))'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(240, 253, 250, 0.94))',
                border: '1px solid',
                borderColor:
                  mode === 'dark'
                    ? 'rgba(125, 211, 252, 0.24)'
                    : 'rgba(14, 116, 144, 0.14)',
                boxShadow:
                  mode === 'dark'
                    ? '0 10px 26px rgba(0, 0, 0, 0.22)'
                    : '0 10px 24px rgba(8, 47, 73, 0.10)',
              }}
            >
              <Box
                className="mc-breathe"
                component="img"
                src={logo}
                alt="MorphoCheck"
                sx={{
                  width: { xs: 38, sm: 42 },
                  height: { xs: 38, sm: 42 },
                  objectFit: 'contain',
                  transition: 'transform 0.24s ease',
                  filter:
                    mode === 'dark'
                      ? 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.22))'
                      : 'none',
                }}
              />
            </Box>
            <Box lineHeight={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  component="span"
                  sx={{ fontWeight: 700, fontSize: { xs: 16, sm: 18 } }}
                >
                  MorphoCheck Pro
                </Box>
                {user && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: 11,
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 1.5,
                      background: (theme) =>
                        user.role === 'superadmin'
                          ? 'linear-gradient(135deg, #0f172a 0%, #0f766e 100%)'
                          : user.role === 'researcher'
                            ? 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)'
                            : theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(0, 0, 0, 0.05)',
                      color:
                        user.role === 'superadmin' || user.role === 'researcher'
                          ? '#fff'
                          : 'text.secondary',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      gap: 0.5,
                      border:
                        user.role === 'superadmin' || user.role === 'researcher'
                          ? 'none'
                          : '1px solid rgba(0,0,0,0.1)',
                      boxShadow:
                        user.role === 'superadmin'
                          ? '0 2px 8px rgba(15, 23, 42, 0.24)'
                          : user.role === 'researcher'
                            ? '0 2px 8px rgba(15, 118, 110, 0.24)'
                            : 'none',
                    }}
                  >
                    <Box component="span" sx={{ opacity: 0.9 }}>
                      {user.name}
                    </Box>
                    <Box component="span" sx={{ mx: 0.25, opacity: 0.5 }}>
                      |
                    </Box>
                    <Box component="span">
                      {user.role === 'superadmin'
                        ? t('roleSuperAdmin')
                        : user.role === 'researcher'
                          ? 'Izlanuvchi'
                          : t('roleAdmin')}
                    </Box>
                  </Box>
                )}
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {t('subtitle')}
              </Box>
            </Box>
          </Stack>

          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <WeatherClock />
          </Box>

          {/* Desktop Controls (lg+) */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {/* Navigation Links */}
            {user?.role === 'researcher' ? (
              researcherNavItems.map((item) => (
                <Tooltip title={item.label} key={item.section}>
                  <Button
                    component={RouterLink}
                    to={item.to}
                    sx={{
                      ...navButtonSx,
                      ...(location.pathname === '/researcher' &&
                      researcherSection === item.section
                        ? activeNavSx
                        : {}),
                    }}
                    startIcon={React.cloneElement(item.icon, {
                      fontSize: 'small',
                    })}
                  >
                    <Box
                      component="span"
                      sx={{ display: { xs: 'none', md: 'inline' } }}
                    >
                      {item.label}
                    </Box>
                  </Button>
                </Tooltip>
              ))
            ) : (
              <>
                <Tooltip title={t('homeTooltip')}>
                  <Button
                    component={NavLink}
                    to={homePath}
                    end
                    sx={{
                      ...navButtonSx,
                      ...(isResearcherHome ? activeNavSx : {}),
                    }}
                    startIcon={<HomeIcon fontSize="small" />}
                  >
                    <Box
                      component="span"
                      sx={{ display: { xs: 'none', md: 'inline' } }}
                    >
                      {t('home')}
                    </Box>
                  </Button>
                </Tooltip>

                <Tooltip title={t('analyzeTooltip')}>
                  <Button
                    component={NavLink}
                    to={analyzePath}
                    sx={navButtonSx}
                    startIcon={<AnalyticsIcon fontSize="small" />}
                  >
                    <Box
                      component="span"
                      sx={{ display: { xs: 'none', md: 'inline' } }}
                    >
                      {t('analyze')}
                    </Box>
                  </Button>
                </Tooltip>
              </>
            )}

            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Tooltip title={t('adminPanelTooltip')}>
                <Button
                  component={NavLink}
                  to="/admin"
                  sx={navButtonSx}
                  startIcon={<AdminPanelSettingsIcon fontSize="small" />}
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: 'none', md: 'inline' } }}
                  >
                    {t('adminPanel')}
                  </Box>
                </Button>
              </Tooltip>
            )}

            <Tooltip title={guidelinesCopy.tooltip}>
              <Button
                component={NavLink}
                to={guidelinesPath}
                sx={navButtonSx}
                startIcon={<HelpOutlineIcon fontSize="small" />}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: 'none', md: 'inline' } }}
                >
                  {guidelinesCopy.label}
                </Box>
              </Button>
            </Tooltip>

            {user?.role === 'superadmin' && (
              <Tooltip title="Super Admin Panel">
                <Button
                  component={NavLink}
                  to="/superadmin"
                  sx={navButtonSx}
                  startIcon={
                    <AdminPanelSettingsIcon fontSize="small" color="primary" />
                  }
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: 'none', md: 'inline' } }}
                  >
                    Super Admin
                  </Box>
                </Button>
              </Tooltip>
            )}

            {user && (
              <Tooltip title="Chiqish">
                <IconButton
                  onClick={openLogoutDialog}
                  sx={{
                    color: 'error.main',
                    ml: 0.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Settings">
              <IconButton
                onClick={openSettings}
                aria-label="Settings"
                sx={{
                  color: 'text.secondary',
                  transition:
                    'transform 0.24s ease, color 0.24s ease, background 0.24s ease',
                  '&:hover': {
                    backgroundColor:
                      mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.04)',
                    color: 'primary.main',
                    transform: 'rotate(35deg) scale(1.08)',
                  },
                  '& svg': {
                    transition: 'transform 0.24s ease',
                    transform: settingsAnchorEl
                      ? 'rotate(90deg)'
                      : 'rotate(0deg)',
                  },
                }}
              >
                <SettingsOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Popover
            open={Boolean(settingsAnchorEl)}
            anchorEl={settingsAnchorEl}
            onClose={closeSettings}
            keepMounted
            transitionDuration={{ enter: 280, exit: 180 }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                width: { xs: 'calc(100vw - 32px)', sm: 380 },
                maxWidth: 380,
                mt: 1.5,
                borderRadius: 3,
                overflow: 'hidden',
                background:
                  mode === 'dark'
                    ? 'linear-gradient(145deg, rgba(15,23,42,0.96), rgba(8,47,73,0.92))'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,253,250,0.96))',
                border: '1px solid',
                borderColor:
                  mode === 'dark'
                    ? 'rgba(125,211,252,0.18)'
                    : 'rgba(14,116,144,0.14)',
                boxShadow:
                  mode === 'dark'
                    ? '0 24px 70px rgba(0,0,0,0.48)'
                    : '0 24px 70px rgba(8,47,73,0.18)',
                backdropFilter: 'blur(20px)',
                transformOrigin: 'top center !important',
              },
            }}
          >
            <DialogContent sx={{ p: 2.25 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={1.5}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 2,
                      color: 'primary.main',
                      bgcolor:
                        mode === 'dark'
                          ? 'rgba(125,211,252,0.12)'
                          : 'rgba(14,116,144,0.08)',
                    }}
                  >
                    <SettingsOutlinedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={900}
                      lineHeight={1.1}
                    >
                      Settings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Theme and language
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={closeSettings}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={900}
                  >
                    Mode
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.75}>
                    {[
                      {
                        value: 'light',
                        label: 'Light',
                        icon: <Brightness7Icon fontSize="small" />,
                      },
                      {
                        value: 'dark',
                        label: 'Dark',
                        icon: <Brightness4Icon fontSize="small" />,
                      },
                    ].map((item) => (
                      <Button
                        key={item.value}
                        fullWidth
                        variant={mode === item.value ? 'contained' : 'outlined'}
                        startIcon={item.icon}
                        onClick={() => {
                          if (mode !== item.value) toggle();
                        }}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          justifyContent: 'center',
                          py: 1,
                          transition:
                            'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': { transform: 'translateY(-2px)' },
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={900}
                  >
                    {t('themeStyle')}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} mt={0.75}>
                    {THEME_VARIANTS.map((v, idx) => (
                      <Button
                        key={v}
                        size="small"
                        variant={variant === v ? 'contained' : 'outlined'}
                        onClick={() => setVariant(v)}
                        startIcon={
                          variant === v ? (
                            <CheckIcon fontSize="small" />
                          ) : (
                            <PaletteOutlinedIcon fontSize="small" />
                          )
                        }
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          minWidth: 104,
                          animation: `settingsItemIn 0.28s ease both`,
                          animationDelay: `${idx * 35}ms`,
                          '@keyframes settingsItemIn': {
                            from: {
                              opacity: 0,
                              transform: 'translateY(8px) scale(0.97)',
                            },
                            to: {
                              opacity: 1,
                              transform: 'translateY(0) scale(1)',
                            },
                          },
                          '&:hover': { transform: 'translateY(-2px)' },
                        }}
                      >
                        {getThemeVariantLabel(v)}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={900}
                  >
                    {t('selectLang')}
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={lang}
                    onChange={(event) => handleLangChange(event.target.value)}
                    renderValue={(selected) => {
                      const selectedLang = languageOptions.find(
                        (l) => l.code === selected
                      );
                      return selectedLang ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              lineHeight: 1,
                              transition: 'transform 0.24s ease',
                              transform: langChanging
                                ? 'rotate(180deg)'
                                : 'none',
                            }}
                          >
                            {selectedLang.flag}
                          </Box>
                          <Typography variant="body2" fontWeight={700}>
                            {selectedLang.label}
                          </Typography>
                        </Stack>
                      ) : null;
                    }}
                    sx={{
                      mt: 0.75,
                      borderRadius: 2,
                      animation: `settingsItemIn 0.28s ease both`,
                      animationDelay: `${THEME_VARIANTS.length * 35}ms`,
                      '& .MuiSelect-select': {
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          boxShadow: '0 14px 36px rgba(0,0,0,0.18)',
                        },
                      },
                    }}
                  >
                    {languageOptions.map((l) => (
                      <MenuItem key={l.code} value={l.code}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          width="100%"
                        >
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              lineHeight: 1,
                            }}
                          >
                            {l.flag}
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={lang === l.code ? 800 : 600}
                          >
                            {l.label}
                          </Typography>
                          {lang === l.code && (
                            <CheckIcon
                              fontSize="small"
                              sx={{ ml: 'auto', color: 'primary.main' }}
                            />
                          )}
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Stack>
            </DialogContent>
          </Popover>

          {/* Sync Manager & Toggle - Hidden on mobile, accessible in Drawer */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ ml: 1, display: { xs: 'none', md: 'flex' } }}
          >
            {!isOnline && (
              <Tooltip title="Oflayn rejim">
                <CloudOffIcon color="error" fontSize="small" />
              </Tooltip>
            )}

            <Tooltip title={t('syncQueue') || 'Oflayn navbat'}>
              <IconButton color="inherit" onClick={openSyncManager}>
                <Badge
                  badgeContent={pendingCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 10,
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                >
                  <SyncIcon
                    className={pendingCount > 0 ? 'animate-pulse' : ''}
                  />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Mobile Menu Button (xs to lg) */}
          <IconButton
            color="inherit"
            onClick={openDrawer}
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
          >
            <Badge badgeContent={pendingCount} color="error" variant="dot">
              <MenuIcon />
            </Badge>
          </IconButton>

          {/* Mobile Drawer */}
          <Drawer
            anchor="right"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{
              sx: {
                width: 280,
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                p: 2,
              },
            }}
          >
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" fontWeight="900">
                Menu
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CheckIcon />
              </IconButton>
            </Box>

            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {user?.role === 'researcher' ? (
                researcherNavItems.map((item) => (
                  <Button
                    key={item.section}
                    component={RouterLink}
                    to={item.to}
                    sx={{
                      ...navButtonSx,
                      justifyContent: 'flex-start',
                      py: 1.5,
                      ...(location.pathname === '/researcher' &&
                      researcherSection === item.section
                        ? activeNavSx
                        : {}),
                    }}
                    startIcon={item.icon}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {item.label}
                  </Button>
                ))
              ) : (
                <>
                  <Button
                    component={NavLink}
                    to={homePath}
                    end
                    sx={{
                      ...navButtonSx,
                      justifyContent: 'flex-start',
                      py: 1.5,
                      ...(isResearcherHome ? activeNavSx : {}),
                    }}
                    startIcon={<HomeIcon />}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {t('home')}
                  </Button>
                  <Button
                    component={NavLink}
                    to={analyzePath}
                    sx={{
                      ...navButtonSx,
                      justifyContent: 'flex-start',
                      py: 1.5,
                    }}
                    startIcon={<AnalyticsIcon />}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {t('analyze')}
                  </Button>
                </>
              )}
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <Button
                  component={NavLink}
                  to="/admin"
                  sx={{ ...navButtonSx, justifyContent: 'flex-start', py: 1.5 }}
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={() => setDrawerOpen(false)}
                >
                  {t('adminPanel')}
                </Button>
              )}
              {user?.role === 'superadmin' && (
                <Button
                  component={NavLink}
                  to="/superadmin"
                  sx={{ ...navButtonSx, justifyContent: 'flex-start', py: 1.5 }}
                  startIcon={<AdminPanelSettingsIcon color="primary" />}
                  onClick={() => setDrawerOpen(false)}
                >
                  Super Admin
                </Button>
              )}

              <Button
                component={NavLink}
                to={guidelinesPath}
                sx={{ ...navButtonSx, justifyContent: 'flex-start', py: 1.5 }}
                startIcon={<HelpOutlineIcon />}
                onClick={() => setDrawerOpen(false)}
              >
                {guidelinesCopy.label}
              </Button>

              <Divider sx={{ my: 1 }} />

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={openSettings}
                startIcon={<SettingsOutlinedIcon />}
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  justifyContent: 'flex-start',
                  py: 1.2,
                  textTransform: 'none',
                }}
              >
                Settings
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={openSyncManager}
                startIcon={
                  <SyncIcon
                    className={pendingCount > 0 ? 'animate-pulse' : ''}
                  />
                }
                sx={{ mt: 1, borderRadius: 2 }}
              >
                Sync ({pendingCount})
              </Button>

              {user && (
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={openLogoutDialog}
                  startIcon={<LogoutIcon />}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  {t('logout') || 'Chiqish'}
                </Button>
              )}
            </List>
          </Drawer>

          <SyncManager
            open={syncOpen}
            onClose={() => setSyncOpen(false)}
            onEditItem={(item) => {
              setEditingItem(item);
              setSyncOpen(false);
              navigate('/morphocheck-pro');
            }}
          />

          <LogoutConfirmDialog
            open={logoutDialogOpen}
            onClose={() => setLogoutDialogOpen(false)}
            onConfirm={() => {
              setLogoutDialogOpen(false);
              logout();
            }}
          />
        </Toolbar>
      </AppBar>
      <Toolbar sx={{ py: 1 }} />
    </>
  );
}
