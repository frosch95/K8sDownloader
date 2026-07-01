import type { ContextInfo } from "../../../shared/types/kubernetes";
import { memo, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  
  const contextOptions = [
    { value: "", label: "Select a context…", disabled: true },
    ...contexts.map((ctx) => ({
      value: ctx.name,
      label: `${ctx.name} (${ctx.cluster})`,
    })),
  ];

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
