import { useState, memo, useEffect } from "react";
import type { PodInfo } from "../../../shared/types/kubernetes";
import { filterPods } from "../../../utils/kubeconfig";

interface PodSelectorProps {
  pods: PodInfo[];
  selected: PodInfo | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (pod: PodInfo) => void;
}

export const PodSelector = memo(function PodSelector({
  pods,
  selected,
  loading,
  disabled,
  onSelect,
}: PodSelectorProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search]);
  
  const filtered = filterPods(pods, debouncedSearch);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-k8s-muted uppercase tracking-wider">
        Pod
      </label>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-k8s-muted py-2">
          <span className="animate-spin">⏳</span>
          Loading pods…
        </div>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pods…"
            disabled={disabled}
            className="w-full bg-k8s-darker border border-k8s-border rounded-lg px-4 py-2 text-sm text-k8s-text
                       placeholder:text-k8s-muted/50 focus:outline-none focus:ring-2 focus:ring-k8s-blue/40
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />

          <div className="max-h-48 overflow-y-auto border border-k8s-border rounded-lg divide-y divide-k8s-border/50">
            {filtered.length === 0 ? (
              <p className="text-sm text-k8s-muted px-4 py-3 text-center">
                {disabled ? "Select a namespace first" : "No pods found"}
              </p>
            ) : (
              filtered.map((pod) => (
                <button
                  key={pod.name}
                  onClick={() => onSelect(pod)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3
                    ${
                      selected?.name === pod.name
                        ? "bg-k8s-blue/10 text-k8s-link border-l-2 border-l-k8s-blue"
                        : "hover:bg-k8s-surface/50 text-k8s-text border-l-2 border-l-transparent"
                    }`}
                >
                  <span className="truncate font-medium">{pod.name}</span>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      pod.status === "Running"
                        ? "bg-green-500/10 text-green-400"
                        : pod.status === "Pending"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {pod.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
});
