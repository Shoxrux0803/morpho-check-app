// src/components/ThemeSync.jsx
import { useEffect } from 'react';
import { useThemeMode } from '../providers/ThemeProviderMUI';
import { getVariantColors } from '../theme/muiTheme';

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${alpha})`;
  const cleanHex = hex.replace('#', '');
  let targetHex = cleanHex;
  if (cleanHex.length === 3) {
    targetHex =
      cleanHex[0] +
      cleanHex[0] +
      cleanHex[1] +
      cleanHex[1] +
      cleanHex[2] +
      cleanHex[2];
  }
  if (targetHex.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(targetHex.substring(0, 2), 16);
  const g = parseInt(targetHex.substring(2, 4), 16);
  const b = parseInt(targetHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbOnly(hex) {
  if (!hex || typeof hex !== 'string') return '255, 255, 255';
  const cleanHex = hex.replace('#', '');
  let targetHex = cleanHex;
  if (cleanHex.length === 3) {
    targetHex =
      cleanHex[0] +
      cleanHex[0] +
      cleanHex[1] +
      cleanHex[1] +
      cleanHex[2] +
      cleanHex[2];
  }
  if (targetHex.length !== 6) return '255, 255, 255';
  const r = parseInt(targetHex.substring(0, 2), 16);
  const g = parseInt(targetHex.substring(2, 4), 16);
  const b = parseInt(targetHex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default function ThemeSync() {
  const { mode, variant } = useThemeMode(); // "light" | "dark", "neo" | "ocean" | "sunset" | "minimal"

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const on = mode === 'dark';
    html.classList.toggle('dark', on);
    body.classList.toggle('dark', on);
    body.classList.toggle('bg-dark', on);
    body.classList.toggle('bg-light', !on);
    root?.classList.toggle('dark', on);

    html.setAttribute('data-theme', mode);
    html.setAttribute('data-theme-variant', variant);
    body.setAttribute('data-theme-variant', variant);
    html.setAttribute('data-bs-theme', mode === 'light' ? 'light' : 'dark');

    // 1) Получаем цвета для текущего варианта и режима
    const colors = getVariantColors(on, variant);

    // 2) Записываем базовые CSS-переменные темы
    const textPrimary = on ? '#eaeef2' : '#1a1a1a';
    const textSecondary = on ? '#aab3c5' : '#555555';
    const borderColor = on ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    html.style.setProperty('--theme-primary', colors.primary);
    html.style.setProperty('--theme-secondary', colors.secondary);
    html.style.setProperty('--theme-bg-default', colors.bgDefault);
    html.style.setProperty('--theme-bg-paper', colors.bgPaper);
    html.style.setProperty('--theme-success', colors.success);
    html.style.setProperty('--theme-warning', colors.warning);
    html.style.setProperty('--theme-error', colors.error);
    html.style.setProperty('--theme-info', colors.info);
    html.style.setProperty('--theme-text-primary', textPrimary);
    html.style.setProperty('--theme-text-secondary', textSecondary);
    html.style.setProperty('--theme-border-color', borderColor);

    // RGB переменные для поддержки прозрачности в Bootstrap/кастомных стилях
    html.style.setProperty('--theme-primary-rgb', hexToRgbOnly(colors.primary));
    html.style.setProperty(
      '--theme-text-primary-rgb',
      hexToRgbOnly(textPrimary)
    );

    // 3) Записываем переменные для стеклянного эффекта (.glass, .liquid-card и т.д.)
    const glassBg = on
      ? `linear-gradient(135deg, ${hexToRgba(colors.bgPaper, 0.58)}, ${hexToRgba(colors.bgDefault, 0.34)})`
      : `linear-gradient(135deg, ${hexToRgba(colors.bgPaper, 0.48)}, ${hexToRgba(colors.bgDefault, 0.2)})`;

    const glassBgStrong = on
      ? `linear-gradient(135deg, ${hexToRgba(colors.bgPaper, 0.76)}, ${hexToRgba(colors.bgDefault, 0.56)})`
      : `linear-gradient(135deg, ${hexToRgba(colors.bgPaper, 0.66)}, ${hexToRgba(colors.bgDefault, 0.3)})`;

    const glassBorder = on
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(255, 255, 255, 0.64)';
    const glassBorderSoft = on
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(255, 255, 255, 0.46)';
    const glassText = on
      ? 'rgba(235, 242, 255, 0.92)'
      : 'rgba(20, 25, 35, 0.9)';
    const glassMuted = on
      ? 'rgba(205, 215, 232, 0.68)'
      : 'rgba(20, 25, 35, 0.68)';

    html.style.setProperty('--mc-liquid-bg', glassBg);
    html.style.setProperty('--mc-liquid-bg-strong', glassBgStrong);
    html.style.setProperty('--mc-liquid-border', glassBorder);
    html.style.setProperty('--mc-liquid-border-soft', glassBorderSoft);
    html.style.setProperty('--mc-liquid-text', glassText);
    html.style.setProperty('--mc-liquid-muted', glassMuted);

    // 4) Динамически устанавливаем фоновое изображение для body (эффект ауры)
    const auraDark = colors.auraDark || 'none';
    const auraLight = colors.auraLight || 'none';

    const bodyBgImage = on
      ? `${auraDark}, radial-gradient(circle at 84% 16%, rgba(236,72,153,0.13), transparent 30%), radial-gradient(circle at 72% 82%, rgba(251,191,36,0.10), transparent 34%)`
      : `${auraLight}, radial-gradient(circle at 15% 20%, rgba(107,213,255,0.30), transparent 28%), radial-gradient(circle at 85% 15%, rgba(255,179,223,0.28), transparent 30%), radial-gradient(circle at 70% 80%, rgba(255,210,122,0.24), transparent 35%)`;

    body.style.backgroundImage = bodyBgImage;
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundSize = 'cover';

    // 5) Мобильный статус бар
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors.bgDefault);

    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        '[ThemeSync] mode:',
        mode,
        'variant:',
        variant,
        'primary:',
        colors.primary
      );
    }
  }, [mode, variant]);

  return null;
}
