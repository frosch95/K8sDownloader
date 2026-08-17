import { useCallback, useEffect, useRef, useState } from "react";
import type { PodDetails } from "../../../shared/types/kubernetes";
import { UI } from "../../../shared/constants";

const {
  POD_DETAILS_WIDTH_MIN,
  POD_DETAILS_WIDTH_MAX,
  POD_DETAILS_WIDTH_DEFAULT,
  POD_DETAILS_HEIGHT_MIN,
  POD_DETAILS_HEIGHT_MAX,
  POD_DETAILS_HEIGHT_DEFAULT,
} = UI;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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
      return "bg-k8s-success/15 text-k8s-success";
    case "Pending":
      return "bg-yellow-500/15 text-yellow-400";
    default:
      return "bg-red-500/15 text-red-400";
  }
}

// Volume sources that bring data in from outside the container image
// (as opposed to ephemeral/internal volumes like EmptyDir or Projected).
const EXTERNAL_MOUNT_SOURCE_TYPES = new Set([
  "ConfigMap",
  "Secret",
  "PersistentVolumeClaim",
  "HostPath",
  "NFS",
  "CSI",
]);

function isExternalMount(sourceType: string): boolean {
  return EXTERNAL_MOUNT_SOURCE_TYPES.has(sourceType);
}

export function PodDetailsOverlay({
  isOpen,
  podName,
  details,
  loading,
  error,
  onClose,
}: PodDetailsOverlayProps) {
  const [size, setSize] = useState({
    width: POD_DETAILS_WIDTH_DEFAULT,
    height: POD_DETAILS_HEIGHT_DEFAULT,
  });
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
    },
    [size.width, size.height]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const start = resizeStart.current;
      if (!start) return;
      setSize({
        width: clamp(start.width + (e.clientX - start.x), POD_DETAILS_WIDTH_MIN, POD_DETAILS_WIDTH_MAX),
        height: clamp(start.height + (e.clientY - start.y), POD_DETAILS_HEIGHT_MIN, POD_DETAILS_HEIGHT_MAX),
      });
    };
    const handleUp = () => {
      resizeStart.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div
        role="dialog"
        aria-modal="true"
        style={{ width: size.width, height: size.height }}
        className="relative flex flex-col bg-k8s-surface/90 backdrop-blur-xl border border-k8s-border rounded-xl shadow-2xl shadow-black/10 mx-4 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden"
      >
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-k8s-border/50 bg-gradient-to-r from-k8s-link/5 to-transparent">
          <svg className="w-5 h-5 text-k8s-link shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-k8s-text truncate">
            {details?.name ?? podName ?? "Pod details"}
          </h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-6 py-4">
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
                    <div key={container.name} className="px-3 py-2.5 text-sm space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-k8s-text font-medium truncate">{container.name}</p>
                          <p className="text-k8s-muted text-xs truncate">{container.image}</p>
                        </div>
                        <div className="shrink-0 text-right space-y-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              container.ready
                                ? "bg-k8s-success/15 text-k8s-success"
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

                      {container.mounts.length > 0 && (
                        <details className="group border-t border-k8s-border/30 pt-2">
                          <summary className="flex items-center gap-1 text-xs font-medium text-k8s-muted uppercase tracking-wider cursor-pointer select-none list-none">
                            <svg
                              className="w-3 h-3 shrink-0 transition-transform group-open:rotate-90"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Mounts ({container.mounts.length})
                          </summary>
                          <div className="space-y-1 mt-2">
                            {container.mounts.map((mount) => (
                              <div
                                key={mount.mountPath}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <span
                                  className="text-k8s-text font-mono truncate"
                                  title={mount.mountPath}
                                >
                                  {mount.mountPath}
                                  {mount.subPath && (
                                    <span className="text-k8s-muted"> (subPath: {mount.subPath})</span>
                                  )}
                                </span>
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded font-medium ${
                                    isExternalMount(mount.sourceType)
                                      ? "bg-k8s-link/10 text-k8s-link"
                                      : "bg-k8s-border/20 text-k8s-muted"
                                  }`}
                                >
                                  {mount.sourceType}
                                  {mount.sourceDetail ? `: ${mount.sourceDetail}` : ""}
                                  {mount.readOnly ? " · RO" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-k8s-muted">No details available for this pod.</p>
          )}
        </div>

        <div className="shrink-0 px-6 py-3 border-t border-k8s-border/50 flex justify-end bg-gradient-to-r from-transparent to-k8s-link/5">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-k8s-link/10 hover:bg-k8s-link/20 text-k8s-link rounded-lg text-sm font-medium transition-all hover-lift focus:outline-none focus:ring-2 focus:ring-k8s-link/40"
          >
            Close
          </button>
        </div>

        <div
          onMouseDown={handleResizeStart}
          role="separator"
          aria-label="Resize dialog"
          title="Resize"
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5 text-k8s-muted/40 hover:text-k8s-muted transition-colors"
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M10 2L2 10M10 6L6 10M10 10H10" />
          </svg>
        </div>
      </div>
    </div>
  );
}
