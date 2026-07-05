import { useState, memo, useEffect } from "react";
import type { PodInfo } from "../../../shared/types/kubernetes";
import { filterPods } from "../../../utils/kubeconfig";

interface PodSelectorProps {
  pods: PodInfo[];
  selected: PodInfo | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (pod: PodInfo) => void;
  className?: string;
}

export const PodSelector = memo(function PodSelector({
  pods,
  selected,
  loading,
  disabled,
  onSelect,
  className = "",
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
    <div className={`space-y-3 ${className}`}>
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
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter pods…"
              disabled={disabled}
              className="w-full bg-gradient-subtle border border-k8s-border rounded-lg pl-9 pr-4 py-2 text-sm text-k8s-text
                         placeholder:text-k8s-muted/50 focus:outline-none focus:ring-2 focus:ring-k8s-blue/40
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-k8s-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="overflow-y-auto border border-k8s-border/60 rounded-lg divide-y divide-k8s-border/30 bg-k8s-darker/50 backdrop-blur-sm" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '150px' }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                <svg className="w-8 h-8 text-k8s-border/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm text-k8s-muted">
                  {disabled ? "Select a namespace first" : "No pods found"}
                </p>
              </div>
            ) : (
              filtered.map((pod) => (
                <button
                  key={pod.name}
                  onClick={() => onSelect(pod)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between gap-3
                    ${
                      selected?.name === pod.name
                        ? "bg-gradient-accent/10 text-k8s-link font-medium border-l-[3px] border-l-k8s-link"
                        : "hover:bg-gradient-to-r hover:from-k8s-link/5 hover:to-transparent text-k8s-text border-l-[3px] border-l-transparent"
                    }`}
                >
                  <span className="truncate font-medium">{pod.name}</span>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      pod.status === "Running"
                        ? "bg-green-500/15 text-green-400"
                        : pod.status === "Pending"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400"
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
