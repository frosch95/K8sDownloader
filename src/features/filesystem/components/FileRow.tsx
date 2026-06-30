/**
 * FileRow Component
 * 
 * A memoized component for rendering individual file rows in the FileExplorer.
 * This component is optimized for performance when rendering large lists of files.
 */

import { memo } from "react";
import type { FileEntry } from "../../../shared/types/kubernetes";
import { formatFileSize, getFileIcon } from "../../../utils/kubeconfig";

interface FileRowProps {
  entry: FileEntry;
  onNavigate: (path: string) => void;
  onDownload: (entry: FileEntry) => void;
  downloading: string | null;
}

export const FileRow = memo(function FileRow({
  entry,
  onNavigate,
  onDownload,
  downloading,
}: FileRowProps) {
  return (
    <tr
      key={entry.path}
      className={`transition-colors ${
        entry.isDir
          ? "hover:bg-k8s-surface/30 cursor-pointer"
          : "hover:bg-k8s-surface/20"
      }`}
      onDoubleClick={() => entry.isDir && onNavigate(entry.path)}
    >
      <td className="px-4 py-2.5">
        <button
          onClick={() => entry.isDir && onNavigate(entry.path)}
          className="flex items-center gap-2 text-left w-full"
          disabled={!entry.isDir}
        >
          <span className="text-lg">{getFileIcon(entry.isDir)}</span>
          <span
            className={`truncate max-w-[250px] sm:max-w-[400px] ${
              entry.isDir ? "text-k8s-blue font-medium" : "text-k8s-text"
            }`}
          >
            {entry.name}
          </span>
        </button>
      </td>
      <td className="px-4 py-2.5 text-k8s-muted hidden sm:table-cell">
        {entry.isDir ? "—" : formatFileSize(entry.size)}
      </td>
      <td className="px-4 py-2.5 text-k8s-muted hidden md:table-cell">
        {entry.modified}
      </td>
      <td className="px-4 py-2.5">
        {!entry.isDir && (
          <button
            onClick={() => onDownload(entry)}
            disabled={downloading === entry.name}
            className="text-k8s-muted hover:text-k8s-text transition-colors"
            title="Download file"
          >
            {downloading === entry.name ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
          </button>
        )}
      </td>
    </tr>
  );
});

// Custom comparison function for memo
const areEqual = (prevProps: FileRowProps, nextProps: FileRowProps) => {
  return (
    prevProps.entry.path === nextProps.entry.path &&
    prevProps.entry.name === nextProps.entry.name &&
    prevProps.entry.isDir === nextProps.entry.isDir &&
    prevProps.entry.size === nextProps.entry.size &&
    prevProps.entry.modified === nextProps.entry.modified &&
    prevProps.downloading === nextProps.downloading
  );
};

export const MemoizedFileRow = memo(FileRow, areEqual);