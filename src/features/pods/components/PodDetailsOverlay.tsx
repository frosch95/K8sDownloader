import { useEffect } from "react";
import type { PodDetails } from "../../../shared/types/kubernetes";

interface PodDetailsOverlayProps {
  isOpen: boolean;
  podName: string | null;
  details: PodDetails | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "Running":
      return "bg-green-500/15 text-green-400";
    case "Pending":
      return "bg-yellow-500/15 text-yellow-400";
    default:
      return "bg-red-500/15 text-red-400";
  }
}

export function PodDetailsOverlay({
  isOpen,
  podName,
  details,
  loading,
  error,
  onClose,
}: PodDetailsOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-k8s-surface/90 backdrop-blur-xl border border-k8s-border rounded-xl shadow-2xl shadow-black/10 w-full max-w-lg mx-4 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-k8s-border/50 bg-gradient-to-r from-k8s-link/5 to-transparent">
          <svg className="w-5 h-5 text-k8s-link shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-k8s-text truncate">
            {details?.name ?? podName ?? "Pod details"}
          </h2>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center gap-2.5 text-sm text-k8s-muted py-4">
              <div className="w-4 h-4 border-2 border-k8s-link border-t-transparent rounded-full animate-spin" />
              Loading pod details…
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : details ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-k8s-muted text-xs uppercase tracking-wider">Status</dt>
                  <dd className="mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClasses(details.status)}`}>
                      {details.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-k8s-muted text-xs uppercase tracking-wider">Namespace</dt>
                  <dd className="mt-0.5 text-k8s-text truncate">{details.namespace}</dd>
                </div>
                <div>
                  <dt className="text-k8s-muted text-xs uppercase tracking-wider">Node</dt>
                  <dd className="mt-0.5 text-k8s-text truncate">{details.node ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-k8s-muted text-xs uppercase tracking-wider">Pod IP</dt>
                  <dd className="mt-0.5 text-k8s-text truncate">{details.podIP ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-k8s-muted text-xs uppercase tracking-wider">Created</dt>
                  <dd className="mt-0.5 text-k8s-text truncate">{formatTimestamp(details.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-k8s-muted text-xs uppercase tracking-wider">Managed by</dt>
                  <dd className="mt-0.5 text-k8s-text truncate">{details.managedBy ?? "None"}</dd>
                </div>
              </dl>

              <div>
                <h3 className="text-xs font-medium text-k8s-muted uppercase tracking-wider mb-2">
                  Containers
                </h3>
                <div className="border border-k8s-border/60 rounded-lg divide-y divide-k8s-border/30 overflow-hidden">
                  {details.containers.map((container) => (
                    <div
                      key={container.name}
                      className="px-3 py-2.5 text-sm flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-k8s-text font-medium truncate">{container.name}</p>
                        <p className="text-k8s-muted text-xs truncate">{container.image}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            container.ready
                              ? "bg-green-500/15 text-green-400"
                              : "bg-yellow-500/15 text-yellow-400"
                          }`}
                        >
                          {container.ready ? "Ready" : container.state}
                        </span>
                        {container.restartCount > 0 && (
                          <p className="text-k8s-muted text-xs">
                            {container.restartCount} restart{container.restartCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-k8s-muted">No details available for this pod.</p>
          )}
        </div>

        <div className="px-6 py-3 border-t border-k8s-border/50 flex justify-end bg-gradient-to-r from-transparent to-k8s-link/5">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-k8s-link/10 hover:bg-k8s-link/20 text-k8s-link rounded-lg text-sm font-medium transition-all hover-lift focus:outline-none focus:ring-2 focus:ring-k8s-link/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
