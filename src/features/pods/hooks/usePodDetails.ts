/**
 * usePodDetails Hook
 *
 * Fetches detailed information about a single pod on demand (triggered by
 * the pod details overlay) rather than eagerly for every pod in the list.
 */

import { useCallback, useState } from 'react';
import { KubernetesService } from '../../../services/kubernetesService';
import type { PodDetails } from '../../../shared/types/kubernetes';
import { AppError } from '../../../shared/types/errors';

export function usePodDetails() {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<PodDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async (contextName: string, namespace: string, podName: string) => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    try {
      const result = await KubernetesService.getPodDetails(contextName, namespace, podName);
      setDetails(result);
    } catch (err) {
      setError(AppError.fromError(err).message);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, details, loading, error, open, close };
}
