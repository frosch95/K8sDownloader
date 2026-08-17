import { useCallback, useState, memo } from "react";
import { saveAndDownload, saveAndDownloadPodLogs } from "../../../utils/api";
import { getParentPath, formatLogFileName } from "../../../utils/kubeconfig";
import type { FileEntry } from "../../../shared/types/kubernetes";
import { MemoizedFileRow } from "./FileRow";
import { RefreshButton } from "../../ui/components/RefreshButton";

interface FileExplorerProps {
  files: FileEntry[];
  currentPath: string;
  loading: boolean;
  disabled: boolean;
  contextName: string | null;
  namespace: string | null;
  podName: string | null;
  containerName: string | null;
  onNavigate: (dirPath: string) => void;
  onBack: (dirPath: string) => void;
  onRefresh: () => void;
  onShowPodInfo: () => void;
  onError: (message: string) => void;
}

export const FileExplorer = memo(function FileExplorer({
  files,
  currentPath,
  loading,
  disabled,
  contextName,
  namespace,
  podName,
  containerName,
  onNavigate,
  onBack,
  onRefresh,
  onShowPodInfo,
  onError,
}: FileExplorerProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingLogs, setDownloadingLogs] = useState(false);

  const handleBack = useCallback(() => {
    if (currentPath === "/") return;
    const parent = getParentPath(currentPath);
    onBack(parent);
    onNavigate(parent);
  }, [currentPath, onBack, onNavigate]);

  const handleDownload = useCallback(
    async (entry: FileEntry) => {
      if (entry.isDir) return;
      setDownloading(entry.name);
      try {
        if (!contextName || !namespace || !podName) {
          throw new Error("Missing required parameters for file download");
        }
        await saveAndDownload(
          contextName,
          namespace,
          podName,
          containerName,
          entry.path,
          entry.name
        );
      } catch (err) {
        onError(
          `Failed to download ${entry.name}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setDownloading(null);
      }
    },
    [contextName, namespace, podName, containerName, onError]
  );

  const handleDownloadLogs = useCallback(async () => {
    if (!contextName || !namespace || !podName) return;
    setDownloadingLogs(true);
    try {
      await saveAndDownloadPodLogs(
        contextName,
        namespace,
        podName,
        containerName,
        formatLogFileName(podName)
      );
    } catch (err) {
      onError(
        `Failed to download pod logs: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setDownloadingLogs(false);
    }
  }, [contextName, namespace, podName, containerName, onError]);

  const breadcrumbs = currentPath
    .split("/")
    .filter(Boolean)
    .reduce<{ label: string; path: string }[]>((acc, part) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].path : "";
      acc.push({ label: part, path: `${prev}/${part}` });
      return acc;
    }, []);

  if (disabled) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-subtle flex items-center justify-center shadow-soft">
            <svg className="w-8 h-8 text-k8s-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-k8s-muted text-sm">
            Select a context, namespace, and pod to browse files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gradient-subtle border-b border-k8s-border shadow-soft">
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0">
          <button
            onClick={handleBack}
            disabled={currentPath === "/"}
            className="shrink-0 p-1 rounded hover:bg-k8s-surface/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Go up"
          >
            <svg className="w-4 h-4 text-k8s-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => onNavigate("/")}
            className="shrink-0 text-sm text-k8s-link hover:text-k8s-link/80 transition-colors"
          >
            /
          </button>

          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5 text-sm">
              <span className="text-k8s-muted/50">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="text-k8s-text font-medium truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(crumb.path)}
                  className="text-k8s-link hover:text-k8s-link/80 transition-colors truncate max-w-[200px]"
                >
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onShowPodInfo}
            className="p-1 rounded hover:bg-k8s-surface/50 transition-colors"
            title="Pod details"
            aria-label="Pod details"
          >
            <svg className="w-4 h-4 text-k8s-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={handleDownloadLogs}
            disabled={downloadingLogs}
            className="p-1 rounded hover:bg-k8s-surface/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Download pod logs"
            aria-label="Download pod logs"
          >
            {downloadingLogs ? (
              <span className="w-4 h-4 border-2 border-k8s-link border-t-transparent rounded-full animate-spin block" />
            ) : (
              <svg className="w-4 h-4 text-k8s-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
          </button>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-k8s-muted">
              <div className="w-5 h-5 border-2 border-k8s-link border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading files…</span>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <svg className="w-10 h-10 mx-auto text-k8s-border/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-k8s-muted text-sm">Empty directory</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-k8s-darker/90 backdrop-blur-sm">
              <tr className="text-left text-xs text-k8s-muted uppercase tracking-wider">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Size</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Modified</th>
                <th className="px-4 py-2.5 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-k8s-border/20">
              {files.map((entry) => (
                <MemoizedFileRow
                  key={entry.path}
                  entry={entry}
                  onNavigate={onNavigate}
                  onDownload={handleDownload}
                  downloading={downloading}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gradient-subtle border-t border-k8s-border text-xs text-k8s-muted shadow-soft">
        <span className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {files.length} item{files.length !== 1 ? "s" : ""}
        </span>
        <span className="truncate ml-4">
          {contextName} / {namespace} / {podName}
        </span>
      </div>
    </div>
  );
});
