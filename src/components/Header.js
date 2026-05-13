import React, { useState } from "react";
import { Link as RouterLink, NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Drawer,
  List,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckIcon from "@mui/icons-material/Check";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HomeIcon from "@mui/icons-material/Home";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import TranslateIcon from "@mui/icons-material/Translate";
import LogoutIcon from "@mui/icons-material/Logout";
import SyncIcon from "@mui/icons-material/Sync";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import Badge from "@mui/material/Badge";

import { useThemeMode } from "../providers/ThemeProviderMUI";
import { THEME_VARIANTS } from "../theme/muiTheme";
import logo from "../assets/morphocheck-logo.png";
import { useLanguage, LANGUAGES } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useOfflineSync } from "../providers/OfflineSyncProvider";
import WeatherClock from "./WeatherClock";
import SyncManager from "./SyncManager";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

export default function Header() {
  const { mode, toggle, variant, setVariant } = useThemeMode();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const { pendingCount, isOnline, setEditingItem } = useOfflineSync();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [langChanging, setLangChanging] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLangChange = (code) => {
    if (code === lang) {
      setLangAnchorEl(null);
      return;
    }
    setLangChanging(true);
    setTimeout(() => {
      setLang(code);
      setLangChanging(false);
    }, 220);
    setLangAnchorEl(null);
  };

  const navButtonSx = {
    "&.active": {
      fontWeight: 700,
      color: "primary.main",
      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    },
    color: "text.secondary",
    borderRadius: 2,
    px: 2,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      transform: "translateY(-1px)",
    },
  };

  const isResearcherHome = user?.role === "researcher" && location.pathname === "/researcher";
  const homePath = user?.role === "researcher" ? "/researcher" : "/";

  const activeNavSx = {
    fontWeight: 700,
    color: "primary.main",
    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return [
    <AppBar
      key="header"
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 20,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
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
            textDecoration: "none",
            color: "inherit",
            flexGrow: 1,
            minWidth: 0,
            "&:hover img": { transform: "scale(1.06)" },
          }}
        >
          <Box
            sx={{
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              background:
                mode === "dark"
                  ? "linear-gradient(145deg, rgba(14, 165, 233, 0.20), rgba(34, 197, 94, 0.14))"
                  : "linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(230, 247, 255, 0.94))",
              border: "1px solid",
              borderColor:
                mode === "dark" ? "rgba(125, 211, 252, 0.24)" : "rgba(14, 116, 144, 0.14)",
              boxShadow:
                mode === "dark"
                  ? "0 10px 26px rgba(0, 0, 0, 0.22)"
                  : "0 10px 24px rgba(8, 47, 73, 0.10)",
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="MorphoCheck"
              sx={{
                width: { xs: 38, sm: 42 },
                height: { xs: 38, sm: 42 },
                objectFit: "contain",
                transition: "transform 0.24s ease",
                filter: mode === "dark" ? "drop-shadow(0 4px 10px rgba(0, 0, 0, 0.22))" : "none",
              }}
            />
          </Box>
          <Box lineHeight={1}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 700, fontSize: { xs: 16, sm: 18 } }}>
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
                      user.role === "superadmin"
                        ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                        : user.role === "researcher"
                          ? "linear-gradient(135deg, #007bff 0%, #00d4ff 100%)"
                          : theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                    color:
                      user.role === "superadmin" || user.role === "researcher"
                        ? "#fff"
                        : "text.secondary",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    gap: 0.5,
                    border:
                      user.role === "superadmin" || user.role === "researcher"
                        ? "none"
                        : "1px solid rgba(0,0,0,0.1)",
                    boxShadow:
                      user.role === "superadmin"
                        ? "0 2px 8px rgba(255, 215, 0, 0.3)"
                        : user.role === "researcher"
                          ? "0 2px 8px rgba(0, 123, 255, 0.3)"
                          : "none",
                  }}
                >
                  <Box component="span" sx={{ opacity: 0.9 }}>
                    {user.name}
                  </Box>
                  <Box component="span" sx={{ mx: 0.25, opacity: 0.5 }}>
                    |
                  </Box>
                  <Box component="span">
                    {user.role === "superadmin"
                      ? t("roleSuperAdmin")
                      : user.role === "researcher"
                        ? "Izlanuvchi"
                        : t("roleAdmin")}
                  </Box>
                </Box>
              )}
            </Box>
            <Box
              component="span"
              sx={{ fontSize: 12, color: "text.secondary", display: { xs: "none", sm: "block" } }}
            >
              {t("subtitle")}
            </Box>
          </Box>
        </Stack>

        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <WeatherClock />
        </Box>

        {/* Desktop Controls (lg+) */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          {/* Navigation Links */}
          <Tooltip title={t("homeTooltip")}>
            <Button
              component={NavLink}
              to={homePath}
              end
              sx={{ ...navButtonSx, ...(isResearcherHome ? activeNavSx : {}) }}
              startIcon={<HomeIcon fontSize="small" />}
            >
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                {t("home")}
              </Box>
            </Button>
          </Tooltip>

          {user?.role !== "researcher" && (
            <Tooltip title={t("analyzeTooltip")}>
              <Button
                component={NavLink}
                to="/morphocheck-pro"
                sx={navButtonSx}
                startIcon={<AnalyticsIcon fontSize="small" />}
              >
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  {t("analyze")}
                </Box>
              </Button>
            </Tooltip>
          )}

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Tooltip title={t("adminPanelTooltip")}>
              <Button
                component={NavLink}
                to="/admin"
                sx={navButtonSx}
                startIcon={<AdminPanelSettingsIcon fontSize="small" />}
              >
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  {t("adminPanel")}
                </Box>
              </Button>
            </Tooltip>
          )}

          {user?.role === "superadmin" && (
            <Tooltip title="Super Admin Panel">
              <Button
                component={NavLink}
                to="/superadmin"
                sx={navButtonSx}
                startIcon={<AdminPanelSettingsIcon fontSize="small" color="primary" />}
              >
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  Super Admin
                </Box>
              </Button>
            </Tooltip>
          )}

          {user && (
            <Tooltip title="Chiqish">
              <IconButton
                onClick={() => setLogoutDialogOpen(true)}
                sx={{
                  color: "error.main",
                  ml: 0.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(211, 47, 47, 0.04)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={t("selectLang")}>
            <Button
              onClick={(e) => setLangAnchorEl(e.currentTarget)}
              size="small"
              sx={{
                color: "text.secondary",
                borderRadius: 2,
                px: 1,
                minWidth: "unset",
                gap: 0.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  color: "primary.main",
                  transform: "scale(1.05)",
                },
              }}
            >
              <TranslateIcon
                fontSize="small"
                sx={{
                  transition: "transform 0.3s ease",
                  transform: langChanging ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  display: { xs: "none", sm: "inline" },
                  transition: "opacity 0.22s ease, transform 0.22s ease",
                  opacity: langChanging ? 0 : 1,
                  transform: langChanging ? "translateY(-4px)" : "translateY(0)",
                }}
              >
                {currentLang.flag} {currentLang.label}
              </Typography>
            </Button>
          </Tooltip>

          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={() => setLangAnchorEl(null)}
            TransitionProps={{ timeout: 200 }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 140,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              },
            }}
          >
            {LANGUAGES.map((l, idx) => (
              <MenuItem
                key={l.code}
                selected={l.code === lang}
                onClick={() => handleLangChange(l.code)}
                sx={{
                  borderRadius: 1,
                  mx: 0.5,
                  my: 0.25,
                  gap: 1,
                  transition: "background 0.18s ease, transform 0.18s ease",
                  animation: `fadeSlideIn 0.18s ease both`,
                  animationDelay: `${idx * 40}ms`,
                  "@keyframes fadeSlideIn": {
                    from: { opacity: 0, transform: "translateY(-6px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                  "&:hover": {
                    transform: "translateX(4px)",
                    backgroundColor:
                      mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { backgroundColor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, fontSize: 20 }}>{l.flag}</ListItemIcon>
                <ListItemText primary={l.label} />
                {l.code === lang && (
                  <CheckIcon
                    fontSize="small"
                    sx={{
                      animation: "checkPop 0.25s cubic-bezier(0.175,0.885,0.32,1.275) both",
                      "@keyframes checkPop": {
                        from: { opacity: 0, transform: "scale(0)" },
                        to: { opacity: 1, transform: "scale(1)" },
                      },
                    }}
                  />
                )}
              </MenuItem>
            ))}
          </Menu>

          {/* Variant tanlash */}
          <Tooltip title={t("themeStyle")}>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="Uslubni tanlash"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  color: "primary.main",
                },
              }}
            >
              <PaletteOutlinedIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: { xs: "calc(100vw - 32px)", sm: 180 },
                maxWidth: "90vw",
              },
            }}
          >
            {THEME_VARIANTS.map((v) => (
              <MenuItem
                key={v}
                selected={v === variant}
                onClick={() => {
                  setVariant(v);
                  setAnchorEl(null);
                }}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    color: "primary.contrastText",
                    "&:hover": { backgroundColor: "primary.main" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {v === variant ? (
                    <CheckIcon fontSize="small" sx={{ color: "inherit" }} />
                  ) : (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 1,
                        backgroundColor: "currentColor",
                        opacity: 0.3,
                      }}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    v === "neo"
                      ? "Neo (Aurora)"
                      : v === "ocean"
                        ? "Ocean"
                        : v === "sunset"
                          ? "Sunset"
                          : "Minimal"
                  }
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Dark/Light toggle */}
          <Tooltip title={mode === "dark" ? t("lightTheme") : t("darkTheme")}>
            <IconButton
              onClick={toggle}
              aria-label="Theme toggle"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  color: mode === "dark" ? "warning.light" : "primary.main",
                },
              }}
            >
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Sync Manager & Toggle - Hidden on mobile, accessible in Drawer */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ ml: 1, display: { xs: "none", md: "flex" } }}
        >
          {!isOnline && (
            <Tooltip title="Oflayn rejim">
              <CloudOffIcon color="error" fontSize="small" />
            </Tooltip>
          )}

          <Tooltip title={t("syncQueue") || "Oflayn navbat"}>
            <IconButton color="inherit" onClick={() => setSyncOpen(true)}>
              <Badge
                badgeContent={pendingCount}
                color="error"
                sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}
              >
                <SyncIcon className={pendingCount > 0 ? "animate-pulse" : ""} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Mobile Menu Button (xs to lg) */}
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: "flex", md: "none" }, ml: 1 }}
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
              bgcolor: "background.paper",
              backgroundImage: "none",
              p: 2,
            },
          }}
        >
          <Box
            sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography variant="h6" fontWeight="900">
              Menu
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CheckIcon />
            </IconButton>
          </Box>

          <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              component={NavLink}
              to={homePath}
              end
              sx={{
                ...navButtonSx,
                justifyContent: "flex-start",
                py: 1.5,
                ...(isResearcherHome ? activeNavSx : {}),
              }}
              startIcon={<HomeIcon />}
              onClick={() => setDrawerOpen(false)}
            >
              {t("home")}
            </Button>
            {user?.role !== "researcher" && (
              <Button
                component={NavLink}
                to="/morphocheck-pro"
                sx={{ ...navButtonSx, justifyContent: "flex-start", py: 1.5 }}
                startIcon={<AnalyticsIcon />}
                onClick={() => setDrawerOpen(false)}
              >
                {t("analyze")}
              </Button>
            )}
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <Button
                component={NavLink}
                to="/admin"
                sx={{ ...navButtonSx, justifyContent: "flex-start", py: 1.5 }}
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => setDrawerOpen(false)}
              >
                {t("adminPanel")}
              </Button>
            )}
            {user?.role === "superadmin" && (
              <Button
                component={NavLink}
                to="/superadmin"
                sx={{ ...navButtonSx, justifyContent: "flex-start", py: 1.5 }}
                startIcon={<AdminPanelSettingsIcon color="primary" />}
                onClick={() => setDrawerOpen(false)}
              >
                Super Admin
              </Button>
            )}

            <Divider sx={{ my: 1 }} />

            <Box sx={{ px: 1, py: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight="900">
                {t("selectLang")}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                {LANGUAGES.map((l) => (
                  <Button
                    key={l.code}
                    size="small"
                    variant={lang === l.code ? "contained" : "outlined"}
                    onClick={() => handleLangChange(l.code)}
                    sx={{ borderRadius: 2, textTransform: "none", minWidth: 60 }}
                  >
                    {l.flag} {l.code.toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ px: 1, py: 1 }}>
              <Typography variant="overline" color="text.secondary" fontWeight="900">
                {t("themeStyle")}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                {THEME_VARIANTS.map((v) => (
                  <Button
                    key={v}
                    size="small"
                    variant={variant === v ? "contained" : "outlined"}
                    onClick={() => setVariant(v)}
                    sx={{ borderRadius: 2, textTransform: "none", minWidth: 80 }}
                  >
                    {v}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1, py: 1 }}>
              <Tooltip title={mode === "dark" ? t("lightTheme") : t("darkTheme")}>
                <IconButton onClick={toggle} color="inherit">
                  {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
              <Typography variant="body2">{mode === "dark" ? "Dark" : "Light"}</Typography>
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={() => setSyncOpen(true)}
              startIcon={<SyncIcon className={pendingCount > 0 ? "animate-pulse" : ""} />}
              sx={{ mt: 1, borderRadius: 2 }}
            >
              Sync ({pendingCount})
            </Button>

            {user && (
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={() => setLogoutDialogOpen(true)}
                startIcon={<LogoutIcon />}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                {t("logout") || "Chiqish"}
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
            navigate("/morphocheck-pro");
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
    </AppBar>,
    <Toolbar key="header-spacer" sx={{ py: 1 }} />,
  ];
}
