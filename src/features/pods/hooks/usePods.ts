/**
 * usePods Hook
 * 
 * Provides access to pod-related state and actions from the KubeStore.
 * This hook replaces the original usePods hook and provides a cleaner
 * interface for pod management.
 */

import { useCallback } from 'react';
import { useKubeStore } from '../../../stores/kubeStore';

export function usePods() {
  const {
    pods,
    selectedPod,
    selectedContext,
    selectedNamespace,
    podsLoading,
    podsError,
    loadPods,
    selectPod,
    clearPodsError,
  } = useKubeStore();

  const reload = useCallback(() => {
    if (selectedContext && selectedNamespace) {
      loadPods(selectedContext, selectedNamespace);
    }
  }, [selectedContext, selectedNamespace, loadPods]);

  return {
    pods,
    selected: selectedPod,
    loading: podsLoading,
    error: podsError,
    load: loadPods,
    reload,
    setSelected: selectPod,
    setError: clearPodsError,
  };
}