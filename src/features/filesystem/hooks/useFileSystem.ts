/**
 * useFileSystem Hook
 * 
 * Provides access to file system-related state and actions from the KubeStore.
 * This hook replaces the original useFileSystem hook and provides a cleaner
 * interface for file system navigation and operations.
 */

import { useKubeStore } from '../../../stores/kubeStore';

export function useFileSystem() {
  const {
    files,
    currentPath,
    filesLoading,
    filesError,
    navigateTo,
    navigateBack,
    navigateForward,
    refreshFiles,
    resetFileSystem,
    clearFilesError,
  } = useKubeStore();

  return {
    files,
    currentPath,
    loading: filesLoading,
    error: filesError,
    navigateTo,
    navigateBack,
    navigateForward,
    refresh: refreshFiles,
    reset: resetFileSystem,
    setError: clearFilesError,
  };
}