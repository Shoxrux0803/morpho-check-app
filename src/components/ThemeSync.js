// src/components/ThemeSync.jsx
import { useEffect } from 'react';
import { useThemeMode } from '../providers/ThemeProviderMUI';

export default function ThemeSync() {
  const { mode } = useThemeMode(); // "light" | "dark"

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const on = mode === 'dark';
    html.classList.toggle('dark', on);
    body.classList.toggle('dark', on); // fallback
    body.classList.toggle('bg-dark', on);
    body.classList.toggle('bg-light', !on);
    root?.classList.toggle('dark', on); // fallback
    html.setAttribute('data-theme', mode);
    html.setAttribute('data-bs-theme', mode);

    // ixtiyoriy: mobil status bar
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', on ? '#0a0a0a' : '#ffffff');

    if (process.env.NODE_ENV !== 'production') {
      // Tez diagnostika uchun bir marta log
      console.debug(
        '[ThemeSync] mode:',
        mode,
        'html.dark?',
        html.classList.contains('dark')
      );
    }
  }, [mode]);

  return null;
}
