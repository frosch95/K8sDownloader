import { memo } from "react";
import { CustomSelect } from "../../ui/components/CustomSelect";

interface ContainerSelectorProps {
  containers: string[];
  selected: string | null;
  onSelect: (name: string) => void;
}

export const ContainerSelector = memo(function ContainerSelector({
  containers,
  selected,
  onSelect,
}: ContainerSelectorProps) {
  // A single-container pod has nothing to choose, so stay out of the way.
  if (containers.length <= 1) {
    return null;
  }

  const containerOptions = containers.map((name) => ({
    value: name,
    label: name,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-k8s-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 7.5l-8.25 4.5L3.75 7.5M20.25 7.5l-8.25-4.5L3.75 7.5M20.25 7.5v9l-8.25 4.5M3.75 7.5v9l8.25 4.5m0-9v9" />
        </svg>
        <label className="text-sm font-medium text-k8s-muted uppercase tracking-wider">
          Container
        </label>
      </div>

      <CustomSelect
        value={selected || ""}
        options={containerOptions}
        onChange={onSelect}
        className="w-full"
        size="md"
      />
    </div>
  );
});
