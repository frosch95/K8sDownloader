/**
 * UI Store - Zustand Store for UI State Management
 * 
 * Manages UI-related state such as theme preferences and other visual settings.
 */

import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initialize from localStorage or default to system
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme')) as 'light' | 'dark' | 'system' || 'system',
  
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
      }
      return { theme: newTheme };
    });
  },
  
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      if (theme !== 'system') {
        document.documentElement.classList.add(theme);
      }
    }
  },
}));

// Initialize theme on store creation
export const initializeUIStore = () => {
  const { theme, setTheme } = useUIStore.getState();
  
  if (typeof window !== 'undefined') {
    // Apply the stored theme
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.classList.add(theme);
    }
    
    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Initial system theme application
    if (theme === 'system') {
      document.documentElement.classList.add(mediaQuery.matches ? 'dark' : 'light');
    }
  }
};