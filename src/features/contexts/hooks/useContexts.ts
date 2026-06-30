/**
 * useContexts Hook
 * 
 * Provides access to context-related state and actions from the KubeStore.
 * This hook replaces the original useKubeConfig hook and provides a cleaner
 * interface for context management.
 */

import { useKubeStore } from '../../../stores/kubeStore';
import type { ContextInfo } from '../../../shared/types/kubernetes';

export function useContexts() {
  const {
    contexts,
    selectedContext,
    contextsLoading,
    contextsError,
    loadContexts,
    selectContext,
    clearContextsError,
  } = useKubeStore();

  return {
    contexts,
    selected: selectedContext,
    loading: contextsLoading,
    error: contextsError,
    reload: loadContexts,
    setSelected: selectContext,
    setError: clearContextsError,
  };
}