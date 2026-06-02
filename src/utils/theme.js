// src/utils/theme.js
export const THEMES = { LIGHT: "light", DARK: "dark" };

export function getStoredTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === THEMES.DARK || saved === THEMES.LIGHT) return saved;
  } catch {}
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return THEMES.DARK;
  }
  return THEMES.LIGHT;
}

export function applyTheme(theme) {
  const t = theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  const root = document.documentElement;

  // 1) silliq o‘tish uchun vaqtinchalik klass
  if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    root.classList.add("theme-transition");
    // reflow (transition’ni ishonchli boshlash uchun)
    // eslint-disable-next-line no-unused-expressions
    root.offsetHeight;
  }

  // 2) Bootstrap 5.3 temani qo‘llash
  root.setAttribute("data-bs-theme", t);
  root.setAttribute("data-theme", t);

  if (document.body) {
    document.body.classList.toggle("bg-dark", t === THEMES.DARK);
    document.body.classList.toggle("bg-light", t === THEMES.LIGHT);
  }

  // 3) klassni qisqa muddatdan keyin olib tashlaymiz
  if (root.classList.contains("theme-transition")) {
    window.setTimeout(() => root.classList.remove("theme-transition"), 250);
  }

  try {
    localStorage.setItem("theme", t);
  } catch {}
}

// Ixtiyoriy init
export function initTheme() {
  applyTheme(getStoredTheme());
}
