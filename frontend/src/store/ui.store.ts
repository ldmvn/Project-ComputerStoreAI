'use client';

import { create } from 'zustand';
import { applyTheme, isTheme, readTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

type UIState = {
  theme: Theme;
  themeReady: boolean;
  initializeTheme: () => void;
  syncTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'light',
  themeReady: false,
  initializeTheme: () => {
    if (!get().themeReady) get().syncTheme();
  },
  syncTheme: () => {
    const theme = readTheme();
    applyTheme(theme);
    set({ theme, themeReady: true });
  },
  setTheme: (theme) => {
    if (!isTheme(theme)) return;
    applyTheme(theme);
    set({ theme, themeReady: true });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the in-memory choice usable when storage is blocked or full.
    }
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
