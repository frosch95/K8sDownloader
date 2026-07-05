import type { NamespaceInfo } from "../../../shared/types/kubernetes";
import { memo } from "react";
import { CustomSelect } from "../../ui/components/CustomSelect";

interface NamespaceSelectorProps {
  namespaces: NamespaceInfo[];
  selected: string | null;
  loading: boolean;
  disabled: boolean;
  onSelect: (name: string) => void;
}

export const NamespaceSelector = memo(function NamespaceSelector({
  namespaces,
  selected,
  loading,
  disabled,
  onSelect,
}: NamespaceSelectorProps) {
  const namespaceOptions = [
    { value: "", label: "Select a namespace…", disabled: false },
    ...namespaces.map((ns) => ({
      value: ns.name,
      label: ns.name,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-k8s-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <label className="text-sm font-medium text-k8s-muted uppercase tracking-wider">
          Namespace
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2.5 text-sm text-k8s-muted py-2.5 px-3 rounded-lg bg-gradient-subtle">
          <div className="w-4 h-4 border-2 border-k8s-link border-t-transparent rounded-full animate-spin" />
          Loading namespaces…
        </div>
      ) : (
        <CustomSelect
          value={selected || ""}
          options={namespaceOptions}
          onChange={onSelect}
          disabled={disabled || namespaces.length === 0}
          className="w-full"
          size="md"
        />
      )}
    </div>
  );
});
