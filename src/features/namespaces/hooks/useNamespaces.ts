/**
 * useNamespaces Hook
 * 
 * Provides access to namespace-related state and actions from the KubeStore.
 * This hook replaces the original useNamespaces hook and provides a cleaner
 * interface for namespace management.
 */

import { useKubeStore } from '../../../stores/kubeStore';

export function useNamespaces() {
  const {
    namespaces,
    selectedNamespace,
    namespacesLoading,
    namespacesError,
    loadNamespaces,
    selectNamespace,
    clearNamespacesError,
  } = useKubeStore();

  return {
    namespaces,
    selected: selectedNamespace === "" ? null : selectedNamespace,
    loading: namespacesLoading,
    error: namespacesError,
    load: loadNamespaces,
    setSelected: selectNamespace,
    setError: clearNamespacesError,
  };
}