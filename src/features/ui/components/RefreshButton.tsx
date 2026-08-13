/**
 * RefreshButton Component
 *
 * Icon-only button that reloads the data behind a list or dropdown.
 * Shared across the context, namespace, and pod selectors and the file
 * explorer so refresh controls look and behave consistently everywhere.
 */

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RefreshButton({
  onClick,
  loading = false,
  disabled = false,
  className = "",
}: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={loading ? "Refreshing…" : "Refresh"}
      aria-label={loading ? "Refreshing…" : "Refresh"}
      aria-busy={loading}
      className={`shrink-0 p-1 rounded hover:bg-k8s-surface/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <svg
        className={`w-4 h-4 text-k8s-muted ${loading ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}
