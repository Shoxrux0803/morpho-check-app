// src/theme/muiTheme.js
import { createTheme } from '@mui/material/styles';
import Grow from '@mui/material/Grow';

export const THEME_VARIANTS = ['neo', 'ocean', 'sunset', 'minimal'];

// Variant ranglari - oldin define qilish
const getVariantColors = (isDark, variant = 'neo') => {
  const variants = {
    neo: {
      primary: isDark ? '#5eead4' : '#0f766e',
      secondary: isDark ? '#60a5fa' : '#2563eb',
      bgDefault: isDark ? '#08111f' : '#f6faf9',
      bgPaper: isDark ? '#101827' : '#ffffff',
      success: isDark ? '#34d399' : '#10b981',
      warning: isDark ? '#fbbf24' : '#d97706',
      error: isDark ? '#f87171' : '#dc2626',
      info: isDark ? '#60a5fa' : '#2563eb',
      auraLight:
        'radial-gradient(42rem 42rem at 8% -12%, rgba(15,118,110,0.13), transparent 62%), radial-gradient(34rem 34rem at 92% -18%, rgba(37,99,235,0.10), transparent 58%)',
      auraDark:
        'radial-gradient(50rem 50rem at 0% 0%, rgba(15,118,110,0.16), transparent 62%), radial-gradient(40rem 40rem at 100% 100%, rgba(37,99,235,0.10), transparent 58%)',
    },
    ocean: {
      primary: isDark ? '#64ffda' : '#0077b6',
      secondary: isDark ? '#00e5ff' : '#00b4d8',
      bgDefault: isDark ? '#0b132b' : '#e6f7ff',
      bgPaper: isDark ? '#1c2541' : '#ffffff',
      success: isDark ? '#00D1B2' : '#00B894',
      warning: isDark ? '#FDCB6E' : '#F39C12',
      error: isDark ? '#E84393' : '#E74C3C',
      info: isDark ? '#74B9FF' : '#3498DB',
      auraLight:
        'radial-gradient(40rem 40rem at 0% -10%, #c1f0ff, transparent), radial-gradient(30rem 30rem at 100% -20%, #dff9ff, transparent)',
      auraDark:
        'radial-gradient(40rem 40rem at 0% -10%, rgba(0,212,255,.08), transparent), radial-gradient(30rem 30rem at 100% -20%, rgba(100,255,218,.06), transparent)',
    },
    sunset: {
      primary: isDark ? '#ffad60' : '#ff6f61',
      secondary: isDark ? '#ffd166' : '#ffa41b',
      bgDefault: isDark ? '#1a1418' : '#fff7f3',
      bgPaper: isDark ? '#22191f' : '#ffffff',
      success: isDark ? '#00D1B2' : '#00B894',
      warning: isDark ? '#FDCB6E' : '#F39C12',
      error: isDark ? '#E84393' : '#E74C3C',
      info: isDark ? '#74B9FF' : '#3498DB',
      auraLight:
        'radial-gradient(40rem 40rem at 10% -10%, #ffe0d6, transparent), radial-gradient(30rem 30rem at 90% -20%, #fff1c1, transparent)',
      auraDark:
        'radial-gradient(40rem 40rem at 10% -10%, rgba(255,193,7,.08), transparent), radial-gradient(30rem 30rem at 90% -20%, rgba(255,111,97,.08), transparent)',
    },
    minimal: {
      primary: isDark ? '#c5c6c7' : '#111827',
      secondary: isDark ? '#9ca3af' : '#6b7280',
      bgDefault: isDark ? '#0d0d0d' : '#fafafa',
      bgPaper: isDark ? '#121212' : '#ffffff',
      success: isDark ? '#10B981' : '#059669',
      warning: isDark ? '#F59E0B' : '#D97706',
      error: isDark ? '#EF4444' : '#DC2626',
      info: isDark ? '#3B82F6' : '#2563EB',
      auraLight: 'linear-gradient(180deg, #fff, #fafafa)',
      auraDark: 'linear-gradient(180deg, #0d0d0d, #121212)',
    },
  };

  return variants[variant] || variants.neo;
};

export const makeTheme = (mode = 'light', variant = 'neo') => {
  const isDark = mode === 'dark';
  const colors = getVariantColors(isDark, variant);

  const liquidGlass = {
    surface: isDark
      ? 'linear-gradient(135deg, rgba(25, 32, 48, 0.58), rgba(8, 13, 25, 0.34))'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.20))',
    surfaceStrong: isDark
      ? 'linear-gradient(135deg, rgba(25, 34, 52, 0.96), rgba(8, 13, 25, 0.92))'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.90))',
    tint: isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(14, 165, 233, 0.08)',
    border: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.64)',
    borderSoft: isDark
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(255, 255, 255, 0.46)',
    shadow: isDark
      ? 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 1.8px 3px 0 -2px rgba(255,255,255,0.38), inset -2px -2px 0 -2px rgba(255,255,255,0.20), inset -3px -9px 1px -7px rgba(255,255,255,0.12), inset -0.5px -1px 4px rgba(0,0,0,0.34), inset 0 3px 5px -2px rgba(0,0,0,0.34), 0 20px 56px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.20)'
      : 'inset 0 0 0 1px rgba(255,255,255,0.34), inset 1.8px 3px 0 -2px rgba(255,255,255,0.92), inset -2px -2px 0 -2px rgba(255,255,255,0.86), inset -3px -9px 1px -7px rgba(255,255,255,0.66), inset -0.5px -1px 4px rgba(15,23,42,0.10), inset 0 3px 5px -2px rgba(15,23,42,0.12), 0 22px 55px rgba(20,30,60,0.14), 0 2px 8px rgba(255,255,255,0.28)',
    shadowHover: isDark
      ? 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 2px 3px 0 -2px rgba(255,255,255,0.42), inset 0 4px 6px -2px rgba(0,0,0,0.38), 0 28px 72px rgba(0,0,0,0.54)'
      : 'inset 0 0 0 1px rgba(255,255,255,0.42), inset 2px 3px 0 -2px rgba(255,255,255,0.98), inset 0 4px 6px -2px rgba(15,23,42,0.12), 0 30px 74px rgba(20,30,60,0.20)',
    blur: 'blur(26px) saturate(185%) brightness(1.06)',
    blurSoft: 'blur(14px) saturate(165%) brightness(1.04)',
    highlight:
      'linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.18) 24%, rgba(255,255,255,0.05) 52%, rgba(255,255,255,0.30) 100%)',
  };

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: colors.primary,
        light: isDark ? `${colors.primary}99` : `${colors.primary}33`,
        lighter: isDark ? `${colors.primary}1A` : `${colors.primary}1A`,
        dark: isDark ? `${colors.primary}CC` : `${colors.primary}CC`,
      },
      secondary: {
        main: colors.secondary,
        light: isDark ? `${colors.secondary}99` : `${colors.secondary}33`,
        lighter: isDark ? `${colors.secondary}1A` : `${colors.secondary}1A`,
        dark: isDark ? `${colors.secondary}CC` : `${colors.secondary}CC`,
      },
      background: {
        default: colors.bgDefault,
        paper: colors.bgPaper,
      },
      success: {
        main: colors.success,
        light: isDark ? `${colors.success}33` : `${colors.success}1A`,
        lighter: isDark ? `${colors.success}0D` : `${colors.success}0D`,
        dark: isDark ? `${colors.success}CC` : `${colors.success}CC`,
      },
      warning: {
        main: colors.warning,
        light: isDark ? `${colors.warning}33` : `${colors.warning}1A`,
        lighter: isDark ? `${colors.warning}0D` : `${colors.warning}0D`,
        dark: isDark ? `${colors.warning}CC` : `${colors.warning}CC`,
      },
      error: {
        main: colors.error,
        light: isDark ? `${colors.error}33` : `${colors.error}1A`,
        lighter: isDark ? `${colors.error}0D` : `${colors.error}0D`,
        dark: isDark ? `${colors.error}CC` : `${colors.error}CC`,
      },
      info: {
        main: colors.info,
        light: isDark ? `${colors.info}33` : `${colors.info}1A`,
        lighter: isDark ? `${colors.info}0D` : `${colors.info}0D`,
        dark: isDark ? `${colors.info}CC` : `${colors.info}CC`,
      },
      text: {
        primary: isDark ? '#eaeef2' : '#1a1a1a',
        secondary: isDark ? '#aab3c5' : '#555',
        disabled: isDark ? '#6b7280' : '#9ca3af',
      },
      divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily:
        '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: 0,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 800,
        letterSpacing: 0,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 700,
        letterSpacing: 0,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 700,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
      },
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? `${colors.auraDark}, radial-gradient(circle at 84% 16%, rgba(236,72,153,0.13), transparent 30%), radial-gradient(circle at 72% 82%, rgba(251,191,36,0.10), transparent 34%)`
              : `${colors.auraLight}, radial-gradient(circle at 15% 20%, rgba(107,213,255,0.30), transparent 28%), radial-gradient(circle at 85% 15%, rgba(255,179,223,0.28), transparent 30%), radial-gradient(circle at 70% 80%, rgba(255,210,122,0.24), transparent 35%)`,
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            fontFamily: '"Inter Variable", "Inter", system-ui, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          html: {
            scrollBehavior: 'smooth',
          },
          '*': {
            boxSizing: 'border-box',
          },
          '#root': {
            minHeight: '100vh',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            WebkitBackdropFilter: liquidGlass.blur,
            backdropFilter: liquidGlass.blur,
            backgroundColor: isDark
              ? 'rgba(12, 18, 32, 0.58)'
              : 'rgba(255, 255, 255, 0.42)',
            boxShadow: liquidGlass.shadow,
            borderBottom: `1px solid ${liquidGlass.border}`,
            transition: 'all 0.3s ease',
          },
          colorDefault: {
            backgroundColor: isDark
              ? 'rgba(12, 18, 32, 0.58)'
              : 'rgba(255, 255, 255, 0.42)',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            position: 'relative',
            borderRadius: 24,
            background: liquidGlass.surface,
            WebkitBackdropFilter: liquidGlass.blur,
            backdropFilter: liquidGlass.blur,
            border: `1px solid ${liquidGlass.border}`,
            boxShadow: liquidGlass.shadow,
            transition: 'all 0.3s ease',
            backgroundClip: 'padding-box',
            '&:hover': {
              boxShadow: liquidGlass.shadowHover,
              borderColor:
                theme.palette.mode === 'light'
                  ? 'rgba(255,255,255,0.72)'
                  : 'rgba(255,255,255,0.24)',
            },
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 28,
            padding: theme.spacing(0),
            overflow: 'hidden',
            background: liquidGlass.surface,
            WebkitBackdropFilter: liquidGlass.blur,
            backdropFilter: liquidGlass.blur,
            border: `1px solid ${liquidGlass.border}`,
            boxShadow: liquidGlass.shadow,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: liquidGlass.shadowHover,
            },
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '10px 24px',
            textTransform: 'none',
            transition: 'all 0.3s ease',
            WebkitBackdropFilter: liquidGlass.blurSoft,
            backdropFilter: liquidGlass.blurSoft,
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.64), 0 8px 20px rgba(20,30,60,0.12)',
            '&:hover': {
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.78), 0 12px 28px rgba(20,30,60,0.18)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': {
              opacity: 0.6,
            },
          },
          contained: {
            background:
              'linear-gradient(135deg, rgba(14,165,233,0.88), rgba(139,92,246,0.86))',
            color: '#fff',
            '&:hover': {
              background:
                'linear-gradient(135deg, rgba(14,165,233,0.96), rgba(236,72,153,0.90))',
            },
          },
          outlined: {
            borderWidth: '1px',
            borderColor: liquidGlass.border,
            background: isDark
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(255,255,255,0.36)',
            '&:hover': {
              borderWidth: '1px',
              borderColor: isDark
                ? 'rgba(255,255,255,0.26)'
                : 'rgba(255,255,255,0.72)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 18,
              background: isDark
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.40)',
              WebkitBackdropFilter: liquidGlass.blurSoft,
              backdropFilter: liquidGlass.blurSoft,
              transition: 'all 0.3s ease',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: liquidGlass.borderSoft,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary,
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: '28px',
            WebkitBackdropFilter: liquidGlass.blurSoft,
            backdropFilter: liquidGlass.blurSoft,
          },
          filled: {
            background: isDark
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(255,255,255,0.42)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.54), 0 2px 8px rgba(20,30,60,0.10)',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: 12,
            margin: '0 4px',
            minHeight: '48px',
            '&.Mui-selected': {
              color: colors.primary,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: colors.primary,
            height: '3px',
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          // Keep every dialog transition consistent across the application.
          // Grow animates opacity and scale in both directions. The longer
          // exit duration keeps closing as fluid and visible as opening.
          TransitionComponent: Grow,
          transitionDuration: {
            enter: 340,
            exit: 340,
          },
          TransitionProps: {
            easing: {
              enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
              exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
        },
        styleOverrides: {
          root: {
            '& .MuiDialog-container': {
              willChange: 'opacity, transform',
            },
          },
          paper: {
            borderRadius: 34,
            overflow: 'hidden',
            transformOrigin: 'center center',
            willChange: 'opacity, transform',
            background: liquidGlass.surfaceStrong,
            WebkitBackdropFilter: liquidGlass.blur,
            backdropFilter: liquidGlass.blur,
            border: `1px solid ${liquidGlass.border}`,
            boxShadow: liquidGlass.shadow,
            backgroundClip: 'padding-box',
            '@media (max-width:600px)': {
              margin: 12,
              width: 'calc(100% - 24px)',
              maxWidth: 'calc(100% - 24px)',
              maxHeight: 'calc(100% - 24px)',
              borderRadius: 24,
            },
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? 'rgba(2, 6, 23, 0.58)'
              : 'rgba(15, 23, 42, 0.28)',
            WebkitBackdropFilter: 'none',
            backdropFilter: 'none',
          },
          invisible: {
            backgroundColor: 'transparent',
            WebkitBackdropFilter: 'none',
            backdropFilter: 'none',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${liquidGlass.borderSoft}`,
            background: isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.20)',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${liquidGlass.borderSoft}`,
            background: isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.18)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            WebkitBackdropFilter: liquidGlass.blurSoft,
            backdropFilter: liquidGlass.blurSoft,
            border: `1px solid ${liquidGlass.borderSoft}`,
          },
          standardSuccess: {
            backgroundColor: isDark
              ? 'rgba(0, 209, 178, 0.1)'
              : 'rgba(0, 184, 148, 0.1)',
            borderColor: isDark
              ? 'rgba(0, 209, 178, 0.3)'
              : 'rgba(0, 184, 148, 0.3)',
          },
          standardError: {
            backgroundColor: isDark
              ? 'rgba(232, 67, 147, 0.1)'
              : 'rgba(231, 76, 60, 0.1)',
            borderColor: isDark
              ? 'rgba(232, 67, 147, 0.3)'
              : 'rgba(231, 76, 60, 0.3)',
          },
          standardWarning: {
            backgroundColor: isDark
              ? 'rgba(253, 203, 110, 0.1)'
              : 'rgba(243, 156, 18, 0.1)',
            borderColor: isDark
              ? 'rgba(253, 203, 110, 0.3)'
              : 'rgba(243, 156, 18, 0.3)',
          },
          standardInfo: {
            backgroundColor: isDark
              ? 'rgba(116, 185, 255, 0.1)'
              : 'rgba(52, 152, 219, 0.1)',
            borderColor: isDark
              ? 'rgba(116, 185, 255, 0.3)'
              : 'rgba(52, 152, 219, 0.3)',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 6,
            background: isDark
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(255,255,255,0.34)',
          },
          bar: {
            borderRadius: 10,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            background: liquidGlass.surface,
            WebkitBackdropFilter: liquidGlass.blur,
            backdropFilter: liquidGlass.blur,
            border: `1px solid ${liquidGlass.borderSoft}`,
            boxShadow: liquidGlass.shadow,
          },
        },
      },
    },
  });
};

// Default theme export
export default makeTheme('light', 'neo');
