/**
 * useTheme Hook
 * 
 * Provides access to theme-related state and actions from the UIStore.
 * This hook replaces the original useTheme hook and provides a cleaner
 * interface for theme management.
 */

import { useUIStore } from '../../../stores/uiStore';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useUIStore();

  return {
    theme,
    toggle: toggleTheme,
    setTheme,
  };
}