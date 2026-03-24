// src/theme/muiTheme.js
import { createTheme } from "@mui/material/styles";

export const THEME_VARIANTS = ["neo", "ocean", "sunset", "minimal"];

// Variant ranglari - oldin define qilish
const getVariantColors = (isDark, variant = "neo") => {
  const variants = {
    neo: {
      primary: isDark ? "#8E7CFF" : "#6C5CE7",
      secondary: isDark ? "#1DE9B6" : "#00D1B2",
      bgDefault: isDark ? "#0f1115" : "#f7f7fb",
      bgPaper: isDark ? "#171a21" : "#ffffff",
      success: isDark ? "#00D1B2" : "#00B894",
      warning: isDark ? "#FDCB6E" : "#F39C12",
      error: isDark ? "#E84393" : "#E74C3C",
      info: isDark ? "#74B9FF" : "#3498DB",
      auraLight:
        "radial-gradient(40rem 40rem at 10% -10%, #e9e4ff, transparent), radial-gradient(30rem 30rem at 90% -20%, #d6fff5, transparent)",
      auraDark:
        "radial-gradient(40rem 40rem at 10% -10%, rgba(128,117,255,.08), transparent), radial-gradient(30rem 30rem at 90% -20%, rgba(0,229,198,.08), transparent)",
    },
    ocean: {
      primary: isDark ? "#64ffda" : "#0077b6",
      secondary: isDark ? "#00e5ff" : "#00b4d8",
      bgDefault: isDark ? "#0b132b" : "#e6f7ff",
      bgPaper: isDark ? "#1c2541" : "#ffffff",
      success: isDark ? "#00D1B2" : "#00B894",
      warning: isDark ? "#FDCB6E" : "#F39C12",
      error: isDark ? "#E84393" : "#E74C3C",
      info: isDark ? "#74B9FF" : "#3498DB",
      auraLight:
        "radial-gradient(40rem 40rem at 0% -10%, #c1f0ff, transparent), radial-gradient(30rem 30rem at 100% -20%, #dff9ff, transparent)",
      auraDark:
        "radial-gradient(40rem 40rem at 0% -10%, rgba(0,212,255,.08), transparent), radial-gradient(30rem 30rem at 100% -20%, rgba(100,255,218,.06), transparent)",
    },
    sunset: {
      primary: isDark ? "#ffad60" : "#ff6f61",
      secondary: isDark ? "#ffd166" : "#ffa41b",
      bgDefault: isDark ? "#1a1418" : "#fff7f3",
      bgPaper: isDark ? "#22191f" : "#ffffff",
      success: isDark ? "#00D1B2" : "#00B894",
      warning: isDark ? "#FDCB6E" : "#F39C12",
      error: isDark ? "#E84393" : "#E74C3C",
      info: isDark ? "#74B9FF" : "#3498DB",
      auraLight:
        "radial-gradient(40rem 40rem at 10% -10%, #ffe0d6, transparent), radial-gradient(30rem 30rem at 90% -20%, #fff1c1, transparent)",
      auraDark:
        "radial-gradient(40rem 40rem at 10% -10%, rgba(255,193,7,.08), transparent), radial-gradient(30rem 30rem at 90% -20%, rgba(255,111,97,.08), transparent)",
    },
    minimal: {
      primary: isDark ? "#c5c6c7" : "#111827",
      secondary: isDark ? "#9ca3af" : "#6b7280",
      bgDefault: isDark ? "#0d0d0d" : "#fafafa",
      bgPaper: isDark ? "#121212" : "#ffffff",
      success: isDark ? "#10B981" : "#059669",
      warning: isDark ? "#F59E0B" : "#D97706",
      error: isDark ? "#EF4444" : "#DC2626",
      info: isDark ? "#3B82F6" : "#2563EB",
      auraLight: "linear-gradient(180deg, #fff, #fafafa)",
      auraDark: "linear-gradient(180deg, #0d0d0d, #121212)",
    },
  };

  return variants[variant] || variants.neo;
};

export const makeTheme = (mode = "light", variant = "neo") => {
  const isDark = mode === "dark";
  const colors = getVariantColors(isDark, variant);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: isDark ? `${colors.primary}99` : `${colors.primary}33`,
        dark: isDark ? `${colors.primary}CC` : `${colors.primary}CC`,
      },
      secondary: {
        main: colors.secondary,
        light: isDark ? `${colors.secondary}99` : `${colors.secondary}33`,
        dark: isDark ? `${colors.secondary}CC` : `${colors.secondary}CC`,
      },
      background: {
        default: colors.bgDefault,
        paper: colors.bgPaper,
      },
      success: {
        main: colors.success,
        light: isDark ? `${colors.success}33` : `${colors.success}1A`,
        dark: isDark ? `${colors.success}CC` : `${colors.success}CC`,
      },
      warning: {
        main: colors.warning,
        light: isDark ? `${colors.warning}33` : `${colors.warning}1A`,
        dark: isDark ? `${colors.warning}CC` : `${colors.warning}CC`,
      },
      error: {
        main: colors.error,
        light: isDark ? `${colors.error}33` : `${colors.error}1A`,
        dark: isDark ? `${colors.error}CC` : `${colors.error}CC`,
      },
      info: {
        main: colors.info,
        light: isDark ? `${colors.info}33` : `${colors.info}1A`,
        dark: isDark ? `${colors.info}CC` : `${colors.info}CC`,
      },
      text: {
        primary: isDark ? "#eaeef2" : "#1a1a1a",
        secondary: isDark ? "#aab3c5" : "#555",
        disabled: isDark ? "#6b7280" : "#9ca3af",
      },
      divider: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily:
        '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.02em",
        fontSize: "2.5rem",
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 800,
        letterSpacing: "-0.02em",
        fontSize: "2rem",
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 700,
        letterSpacing: "-0.01em",
        fontSize: "1.75rem",
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 700,
        fontSize: "1.5rem",
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: "1.25rem",
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: "1.125rem",
        lineHeight: 1.4,
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.6,
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.875rem",
      },
      caption: {
        fontSize: "0.75rem",
        lineHeight: 1.4,
      },
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark ? colors.auraDark : colors.auraLight,
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            minHeight: "100vh",
            margin: 0,
            padding: 0,
            fontFamily: '"Inter Variable", "Inter", system-ui, sans-serif',
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
          html: {
            scrollBehavior: "smooth",
          },
          "*": {
            boxSizing: "border-box",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: "saturate(120%) blur(10px)",
            backgroundColor: isDark ? "rgba(23, 26, 33, 0.8)" : "rgba(255, 255, 255, 0.8)",
            boxShadow: isDark
              ? "inset 0 -1px 0 rgba(255,255,255,0.1)"
              : "inset 0 -1px 0 rgba(0,0,0,0.06)",
            border: "none",
            transition: "all 0.3s ease",
          },
          colorDefault: {
            backgroundColor: isDark ? "rgba(23, 26, 33, 0.8)" : "rgba(255, 255, 255, 0.8)",
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 18,
            background: theme.palette.background.paper,
            backdropFilter: "blur(10px)",
            border:
              theme.palette.mode === "light"
                ? "1px solid rgba(0,0,0,0.05)"
                : "1px solid rgba(255,255,255,0.05)",
            boxShadow:
              theme.palette.mode === "light"
                ? "0 4px 20px rgba(100,100,150,.08), 0 1px 3px rgba(0,0,0,0.04)"
                : "0 4px 20px rgba(0,0,0,.3), 0 1px 3px rgba(255,255,255,0.05)",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow:
                theme.palette.mode === "light"
                  ? "0 8px 30px rgba(100,100,150,.12), 0 2px 6px rgba(0,0,0,0.06)"
                  : "0 8px 30px rgba(0,0,0,.4), 0 2px 6px rgba(255,255,255,0.08)",
            },
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 20,
            padding: theme.spacing(0),
            overflow: "hidden",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
            },
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 600,
            fontSize: "0.875rem",
            padding: "10px 24px",
            textTransform: "none",
            transition: "all 0.3s ease",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transform: "translateY(-1px)",
            },
            "&.Mui-disabled": {
              opacity: 0.6,
            },
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
            },
          },
          outlined: {
            borderWidth: "2px",
            "&:hover": {
              borderWidth: "2px",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              transition: "all 0.3s ease",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary,
                borderWidth: "2px",
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 500,
            fontSize: "0.75rem",
            height: "28px",
          },
          filled: {
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: 12,
            margin: "0 4px",
            minHeight: "48px",
            "&.Mui-selected": {
              color: colors.primary,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: colors.primary,
            height: "3px",
            borderRadius: "3px 3px 0 0",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            background: isDark
              ? "linear-gradient(135deg, rgba(35,35,45,0.9), rgba(25,25,35,0.9))"
              : "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(250,250,255,0.95))",
            backdropFilter: "blur(20px)",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.8)",
            boxShadow: isDark ? "0 25px 50px rgba(0,0,0,0.5)" : "0 25px 50px rgba(0,0,0,0.15)",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backdropFilter: "blur(10px)",
            border: "1px solid",
          },
          standardSuccess: {
            backgroundColor: isDark ? "rgba(0, 209, 178, 0.1)" : "rgba(0, 184, 148, 0.1)",
            borderColor: isDark ? "rgba(0, 209, 178, 0.3)" : "rgba(0, 184, 148, 0.3)",
          },
          standardError: {
            backgroundColor: isDark ? "rgba(232, 67, 147, 0.1)" : "rgba(231, 76, 60, 0.1)",
            borderColor: isDark ? "rgba(232, 67, 147, 0.3)" : "rgba(231, 76, 60, 0.3)",
          },
          standardWarning: {
            backgroundColor: isDark ? "rgba(253, 203, 110, 0.1)" : "rgba(243, 156, 18, 0.1)",
            borderColor: isDark ? "rgba(253, 203, 110, 0.3)" : "rgba(243, 156, 18, 0.3)",
          },
          standardInfo: {
            backgroundColor: isDark ? "rgba(116, 185, 255, 0.1)" : "rgba(52, 152, 219, 0.1)",
            borderColor: isDark ? "rgba(116, 185, 255, 0.3)" : "rgba(52, 152, 219, 0.3)",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 6,
          },
          bar: {
            borderRadius: 10,
          },
        },
      },
    },
  });
};

// Default theme export
export default makeTheme("light", "neo");
