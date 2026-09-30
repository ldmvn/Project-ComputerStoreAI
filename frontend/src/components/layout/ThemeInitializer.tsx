'use client';

import { useEffect } from 'react';
import { isTheme, THEME_STORAGE_KEY } from '@/lib/theme';
import { useUIStore } from '@/store/ui.store';

export default function ThemeInitializer() {
  useEffect(() => {
    const { initializeTheme, syncTheme } = useUIStore.getState();
    initializeTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      try {
        if (!isTheme(localStorage.getItem(THEME_STORAGE_KEY))) syncTheme();
      } catch {
        // Preserve the current session's selection when storage is blocked.
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === THEME_STORAGE_KEY || event.key === null)) {
        syncTheme();
      }
    };
    media.addEventListener('change', handleSystemChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      media.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return null;
}
