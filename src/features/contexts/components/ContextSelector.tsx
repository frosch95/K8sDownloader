import type { ContextInfo } from "../../../shared/types/kubernetes";
import { memo } from "react";

interface ContextSelectorProps {
  contexts: ContextInfo[];
  selected: string | null;
  loading: boolean;
  onSelect: (name: string) => void;
  onRefresh: () => void;
}

export const ContextSelector = memo(function ContextSelector({
  contexts,
  selected,
  loading,
  onSelect,
  onRefresh,
}: ContextSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-k8s-muted uppercase tracking-wider">
          Context
        </label>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-k8s-link hover:text-k8s-link/80 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "🔄 Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-k8s-muted py-2">
          <span className="animate-spin">⏳</span>
          Loading contexts…
        </div>
      ) : (
        <select
          value={selected || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-k8s-darker border border-k8s-border rounded-lg px-4 py-2.5 text-sm text-k8s-text
                     focus:outline-none focus:ring-2 focus:ring-k8s-blue/40 focus:border-k8s-blue/50
                     transition-colors appearance-none cursor-pointer
                     bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                     bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
        >
          <option value="" disabled>
            Select a context…
          </option>
          {contexts.map((ctx) => (
            <option key={ctx.name} value={ctx.name}>
              {ctx.name} ({ctx.cluster})
            </option>
          ))}
        </select>
      )}
    </div>
  );
});
