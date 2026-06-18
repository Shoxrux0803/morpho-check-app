import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { makeTheme, THEME_VARIANTS } from '../theme/muiTheme';
import { getStoredTheme, applyTheme, THEMES } from '../utils/theme';

const ThemeCtx = createContext({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
  variant: 'neo',
  setVariant: () => {},
});
export const useThemeMode = () => useContext(ThemeCtx);

function ThemeTransitionOverlay({ mode }) {
  const isFirstRender = useRef(true);
  const timeoutRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined;
    }

    setVisible(false);
    window.requestAnimationFrame(() => setVisible(true));
    timeoutRef.current = window.setTimeout(() => setVisible(false), 760);

    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, [mode]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="mc-theme-transition-overlay"
      data-mode={mode}
    />
  );
}

export default function ThemeProviderMUI({ children }) {
  const [mode, setMode] = useState(getStoredTheme());
  const [variant, setVariant] = useState(
    localStorage.getItem('theme_variant') || 'neo'
  );

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem('theme_variant', variant);
  }, [variant]);

  const theme = useMemo(() => makeTheme(mode, variant), [mode, variant]);

  const value = useMemo(
    () => ({
      mode,
      setMode: (m) => setMode(m),
      toggle: () =>
        setMode((m) => (m === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)),
      variant,
      setVariant: (v) => setVariant(THEME_VARIANTS.includes(v) ? v : 'neo'),
    }),
    [mode, variant]
  );

  return (
    <ThemeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeTransitionOverlay mode={mode} />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
