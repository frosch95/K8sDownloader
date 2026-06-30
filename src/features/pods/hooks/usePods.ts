/**
 * usePods Hook
 * 
 * Provides access to pod-related state and actions from the KubeStore.
 * This hook replaces the original usePods hook and provides a cleaner
 * interface for pod management.
 */

import { useKubeStore } from '../../../stores/kubeStore';
import type { PodInfo } from '../../../shared/types/kubernetes';

export function usePods() {
  const {
    pods,
    selectedPod,
    podsLoading,
    podsError,
    loadPods,
    selectPod,
    clearPodsError,
  } = useKubeStore();

  return {
    pods,
    selected: selectedPod,
    loading: podsLoading,
    error: podsError,
    load: loadPods,
    setSelected: selectPod,
    setError: clearPodsError,
  };
}