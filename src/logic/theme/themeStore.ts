import { resolveThemeMode as resolveWithSystem, type ThemeMode, useThemeStore } from '../../store/themeStore';

export type { ThemeMode };

export const THEME_CHANGED_EVENT = 'robot-qc-theme-changed';

export function getStoredThemeMode(): ThemeMode {
  return useThemeStore.getState().themeMode;
}

export function setStoredThemeMode(mode: ThemeMode) {
  useThemeStore.getState().setThemeMode(mode);
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT));
}

export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  return resolveWithSystem(mode);
}
