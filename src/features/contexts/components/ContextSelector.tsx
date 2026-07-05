import type { ContextInfo } from "../../../shared/types/kubernetes";
import { memo } from "react";
import { CustomSelect } from "../../ui/components/CustomSelect";

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
  
  const contextOptions = [
    { value: "", label: "Select a context…", disabled: false },
    ...contexts.map((ctx) => ({
      value: ctx.name,
      label: `${ctx.name} (${ctx.cluster})`,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-k8s-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <label className="text-sm font-medium text-k8s-muted uppercase tracking-wider">
            Context
          </label>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-k8s-link hover:text-k8s-link/80 disabled:opacity-50 transition-all hover:underline"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2.5 text-sm text-k8s-muted py-2.5 px-3 rounded-lg bg-gradient-subtle">
          <div className="w-4 h-4 border-2 border-k8s-link border-t-transparent rounded-full animate-spin" />
          Loading contexts…
        </div>
      ) : (
        <CustomSelect
          value={selected || ""}
          options={contextOptions}
          onChange={onSelect}
          className="w-full"
          size="md"
        />
      )}
    </div>
  );
});
