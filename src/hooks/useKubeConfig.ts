import { useState, useCallback, useEffect, useMemo } from "react";
import { fetchContexts } from "../utils/api";
import { extractErrorMessage } from "../utils/kubeconfig";
import type { ContextInfo } from "../types";

export function useKubeConfig() {
  const [contexts, setContexts] = useState<ContextInfo[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchContexts();
      setContexts(result);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount – inline to avoid set-state-in-effect warning
  useEffect(() => {
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchContexts();
        setContexts(result);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, []);

  return useMemo(
    () => ({ contexts, selected, setSelected, loading, error, setError, reload: load }),
    [contexts, selected, loading, error, load]
  );
}
