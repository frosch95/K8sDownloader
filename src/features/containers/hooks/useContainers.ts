/**
 * useContainers Hook
 *
 * Provides access to container-related state and actions from the KubeStore.
 * Containers belong to the currently selected pod, so the list is derived
 * from it rather than loaded independently.
 */

import { useKubeStore } from '../../../stores/kubeStore';

export function useContainers() {
  const { selectedPod, selectedContainer, selectContainer } = useKubeStore();

  return {
    containers: selectedPod?.containers ?? [],
    selected: selectedContainer,
    setSelected: selectContainer,
  };
}
