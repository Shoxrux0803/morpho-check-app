import React, { useState } from "react";
import { Link as RouterLink, NavLink } from "react-router-dom";
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
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckIcon from "@mui/icons-material/Check";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HomeIcon from "@mui/icons-material/Home";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import { THEME_VARIANTS } from "../theme/muiTheme";
import logo from "../assets/morphocheck-logo.png";

export default function Header() {
  const { mode, toggle, variant, setVariant } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);

  // Navlink aktiv holatini tekshirish
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
            "&:hover": {
              opacity: 0.8,
            },
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
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />
          <Box lineHeight={1}>
            <Box component="span" sx={{ fontWeight: 700, fontSize: { xs: 16, sm: 18 } }}>
              MorphoCheck Pro
            </Box>
            <Box
              component="span"
              sx={{ fontSize: 12, color: "text.secondary", display: { xs: "none", sm: "block" } }}
            >
              Antropometrik tahlil
            </Box>
          </Box>
        </Stack>

        {/* Nav + Theme + Variant */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {/* Navigation Links */}
          <Tooltip title="Bosh sahifa">
            <Button
              component={NavLink}
              to="/"
              end
              sx={navButtonSx}
              startIcon={<HomeIcon fontSize="small" />}
            >
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                Bosh sahifa
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="MorphoCheck Pro">
            <Button
              component={NavLink}
              to="/morphocheck-pro"
              sx={navButtonSx}
              startIcon={<AnalyticsIcon fontSize="small" />}
            >
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                Tahlil qilish
              </Box>
            </Button>
          </Tooltip>

          <Tooltip title="Admin panel (Dashboard + Statistika)">
            <Button
              component={NavLink}
              to="/admin"
              sx={navButtonSx}
              startIcon={<AdminPanelSettingsIcon fontSize="small" />}
            >
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                Admin Panel
              </Box>
            </Button>
          </Tooltip>

          {/* Variant tanlash */}
          <Tooltip title="Mavzu stili">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="Stil tanlash"
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
                minWidth: 180,
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
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
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
          <Tooltip title={mode === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}>
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
      </Toolbar>
    </AppBar>
  );
}
