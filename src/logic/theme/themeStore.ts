export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_STORAGE_KEY = 'robot-qc-theme-mode';
export const THEME_CHANGED_EVENT = 'robot-qc-theme-changed';

export function getStoredThemeMode(): ThemeMode {
  const raw = localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'light';
}

export function setStoredThemeMode(mode: ThemeMode) {
  localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT));
}

export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') {
    return mode;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

