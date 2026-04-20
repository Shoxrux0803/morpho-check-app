import React, { useState } from "react";
import { Link as RouterLink, NavLink, useNavigate } from "react-router-dom";

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
} from "@mui/material";
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


export default function Header() {
  const { mode, toggle, variant, setVariant } = useThemeMode();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const { pendingCount, isOnline, setEditingItem } = useOfflineSync();
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [langChanging, setLangChanging] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);


  const handleLangChange = (code) => {
    if (code === lang) { setLangAnchorEl(null); return; }
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

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <AppBar position="sticky" color="transparent" elevation={0}>
      <Toolbar sx={{ py: 1 }}>
        {/* Brand */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          component={RouterLink}
          to="/"
          sx={{
            textDecoration: "none",
            color: "inherit",
            flexGrow: 1,
            "&:hover": { opacity: 0.8 },
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="MorphoCheck"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              objectFit: "contain",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.05)" },
            }}
          />
          <Box lineHeight={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                    color: (user.role === "superadmin" || user.role === "researcher") ? "#fff" : "text.secondary",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: { xs: "none", lg: "flex" },
                    alignItems: "center",
                    gap: 0.5,
                    border: (user.role === "superadmin" || user.role === "researcher") ? "none" : "1px solid rgba(0,0,0,0.1)",
                    boxShadow: user.role === "superadmin" ? "0 2px 8px rgba(255, 215, 0, 0.3)" : (user.role === "researcher" ? "0 2px 8px rgba(0, 123, 255, 0.3)" : "none"),
                  }}
                >
                  <Box component="span" sx={{ opacity: 0.9 }}>
                    {user.name}
                  </Box>
                  <Box component="span" sx={{ mx: 0.25, opacity: 0.5 }}>
                    |
                  </Box>
                  <Box component="span">
                    {user.role === "superadmin" ? t("roleSuperAdmin") : user.role === "researcher" ? "Izlanuvchi" : t("roleAdmin")}
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

        <WeatherClock />

        {/* Nav + Theme + Variant + Lang */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {/* Navigation Links */}
          <Tooltip title={t("homeTooltip")}>
            <Button
              component={NavLink}
              to="/"
              end
              sx={navButtonSx}
              startIcon={<HomeIcon fontSize="small" />}
            >
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                {t("home")}
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title={t("analyzeTooltip")}>
            <Button
              component={NavLink}
              to={user?.role === "researcher" ? "/researcher" : "/morphocheck-pro"}
              sx={navButtonSx}
              startIcon={<AnalyticsIcon fontSize="small" />}
            >
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                {t("analyze")}
              </Box>
            </Button>
          </Tooltip>

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

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <Tooltip title="Chiqish">
              <IconButton
                onClick={logout}
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
                    to:   { opacity: 1, transform: "translateY(0)" },
                  },
                  "&:hover": {
                    transform: "translateX(4px)",
                    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { backgroundColor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, fontSize: 20 }}>
                  {l.flag}
                </ListItemIcon>
                <ListItemText primary={l.label} />
                {l.code === lang && (
                  <CheckIcon
                    fontSize="small"
                    sx={{
                      animation: "checkPop 0.25s cubic-bezier(0.175,0.885,0.32,1.275) both",
                      "@keyframes checkPop": {
                        from: { opacity: 0, transform: "scale(0)" },
                        to:   { opacity: 1, transform: "scale(1)" },
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
            PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 180 } }}
          >
            {THEME_VARIANTS.map((v) => (
              <MenuItem
                key={v}
                selected={v === variant}
                onClick={() => { setVariant(v); setAnchorEl(null); }}
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
                    <Box sx={{ width: 16, height: 16, borderRadius: 1, backgroundColor: "currentColor", opacity: 0.3 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    v === "neo" ? "Neo (Aurora)" : v === "ocean" ? "Ocean" : v === "sunset" ? "Sunset" : "Minimal"
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
        
        {/* Sync Manager & Toggle */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
          {!isOnline && (
            <Tooltip title="Oflayn rejim">
              <CloudOffIcon color="error" fontSize="small" />
            </Tooltip>
          )}
          
          <Tooltip title={t("syncQueue") || "Oflayn navbat"}>
            <IconButton color="inherit" onClick={() => setSyncOpen(true)}>
              <Badge badgeContent={pendingCount} color="error" sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16 } }}>
                <SyncIcon className={pendingCount > 0 ? "animate-pulse" : ""} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Stack>

        <SyncManager 
          open={syncOpen} 
          onClose={() => setSyncOpen(false)} 
          onEditItem={(item) => {
            setEditingItem(item);
            setSyncOpen(false);
            navigate("/morphocheck-pro");
          }}
        />
      </Toolbar>
    </AppBar>

  );
}
