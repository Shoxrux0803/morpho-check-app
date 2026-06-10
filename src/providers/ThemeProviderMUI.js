import React, {
  useMemo,
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { makeTheme, THEME_VARIANTS } from '../theme/muiTheme';
import { getStoredTheme, applyTheme, THEMES } from '../utils/theme';

const ThemeCtx = createContext({
  mode: 'light',
  toggle: () => {},
  variant: 'neo',
  setVariant: () => {},
});
export const useThemeMode = () => useContext(ThemeCtx);

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
      toggle: () =>
        setMode((m) => (m === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)),
      variant,
      setVariant: (v) => setVariant(THEME_VARIANTS.includes(v) ? v : 'neo'),
    }),
    [mode, variant]
  );

  return (
    <ThemeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
