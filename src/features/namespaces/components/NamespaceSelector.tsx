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
      <label className="text-sm font-medium text-k8s-muted uppercase tracking-wider">
        Namespace
      </label>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-k8s-muted py-2">
          <span className="animate-spin">⏳</span>
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
