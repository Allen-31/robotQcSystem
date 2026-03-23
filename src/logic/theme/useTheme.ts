import { useEffect, useMemo, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { THEME_CHANGED_EVENT, resolveThemeMode, setStoredThemeMode, type ThemeMode } from './themeStore';

export function useTheme() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const syncFromStorage = useThemeStore((state) => state.syncFromStorage);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    const onThemeChanged = () => syncFromStorage();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'robot-qc-theme-mode') {
        onThemeChanged();
      }
    };

    media.addEventListener('change', onMediaChange);
    window.addEventListener(THEME_CHANGED_EVENT, onThemeChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener(THEME_CHANGED_EVENT, onThemeChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [syncFromStorage]);

  const actualTheme = useMemo<'light' | 'dark'>(() => (themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode), [themeMode, systemDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-theme', actualTheme);
  }, [actualTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setStoredThemeMode(mode);
  };

  return { themeMode, actualTheme, setThemeMode, resolveThemeMode };
}
