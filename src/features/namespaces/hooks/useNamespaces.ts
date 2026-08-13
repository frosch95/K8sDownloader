/**
 * useNamespaces Hook
 * 
 * Provides access to namespace-related state and actions from the KubeStore.
 * This hook replaces the original useNamespaces hook and provides a cleaner
 * interface for namespace management.
 */

import { useCallback } from 'react';
import { useKubeStore } from '../../../stores/kubeStore';

export function useNamespaces() {
  const {
    namespaces,
    selectedNamespace,
    selectedContext,
    namespacesLoading,
    namespacesError,
    loadNamespaces,
    selectNamespace,
    clearNamespacesError,
  } = useKubeStore();

  const reload = useCallback(() => {
    if (selectedContext) {
      loadNamespaces(selectedContext);
    }
  }, [selectedContext, loadNamespaces]);

  return {
    namespaces,
    selected: selectedNamespace === "" ? null : selectedNamespace,
    loading: namespacesLoading,
    error: namespacesError,
    load: loadNamespaces,
    reload,
    setSelected: selectNamespace,
    setError: clearNamespacesError,
  };
}