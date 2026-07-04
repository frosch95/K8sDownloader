import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from "../types";

/** Formats a byte count into a human-readable string (e.g., "1.5 MB"). */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${size} ${units[i]}`;
}

/** Returns a Unicode icon for a file or directory. */
export function getFileIcon(isDir: boolean): string {
  return isDir ? "📁" : "📄";
}

/** Safely extracts an error message from any thrown value. */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "An unknown error occurred";
}

/** Filters contexts by a case-insensitive query on name or cluster. */
export function filterContexts(
  contexts: ContextInfo[],
  query: string
): ContextInfo[] {
  const q = query.toLowerCase();
  return contexts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.cluster.toLowerCase().includes(q)
  );
}

/** Filters namespaces by a case-insensitive query. */
export function filterNamespaces(
  namespaces: NamespaceInfo[],
  query: string
): NamespaceInfo[] {
  const q = query.toLowerCase();
  return namespaces.filter((ns) => ns.name.toLowerCase().includes(q));
}

/** Filters pods by a case-insensitive query on name. */
export function filterPods(pods: PodInfo[], query: string): PodInfo[] {
  const q = query.toLowerCase();
  return pods.filter((p) => p.name.toLowerCase().includes(q));
}

/** Sorts file entries: directories first, then alphabetically. */
export function sortFileEntries(entries: FileEntry[]): FileEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isDir !== b.isDir) return b.isDir ? 1 : -1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

/** Computes the parent path. Returns "/" for the root or a single-level path. */
export function getParentPath(dirPath: string): string {
  if (dirPath === "/") return "/";
  const parts = dirPath.split("/").filter(Boolean);
  parts.pop();
  return parts.length === 0 ? "/" : "/" + parts.join("/");
}

const KUBERNETES_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const CONTEXT_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function validateKubernetesIdentifier(
  value: string,
  fieldName: string,
  options?: { allowUppercase?: boolean }
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }

  if (trimmed.length > 253) {
    throw new Error(`${fieldName} is too long`);
  }

  const pattern = options?.allowUppercase
    ? CONTEXT_NAME_PATTERN
    : KUBERNETES_NAME_PATTERN;

  if (!pattern.test(trimmed)) {
    throw new Error(`${fieldName} contains unsupported characters`);
  }

  return trimmed;
}

export function sanitizeContainerPath(inputPath: string): string {
  const trimmed = inputPath.trim();

  if (!trimmed) {
    throw new Error("Container path is required");
  }

  if (trimmed.includes("\0")) {
    throw new Error("Container path contains invalid characters");
  }

  const hasControlCharacters = Array.from(trimmed).some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127;
  });

  if (hasControlCharacters) {
    throw new Error("Container path contains invalid characters");
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);

  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("Container path must not contain traversal segments");
  }

  const isUnixAbsolute = normalized.startsWith("/");
  const isWindowsAbsolute = /^[a-zA-Z]:\//.test(trimmed);

  if (!isUnixAbsolute && !isWindowsAbsolute) {
    throw new Error("Container path must be absolute");
  }

  return trimmed;
}

// ── ls -la output parser (Linux containers) ────────────────────────────────

/**
 * Parses the output of `ls -la` into FileEntry objects.
 * Expected format:
 *   drwxr-xr-x  2 root root  4096 Jan 01 12:00 dirname
 *   -rw-r--r--  1 root root  1234 Jan 01 12:00 filename
 */
export function parseLsOutput(output: string, basePath: string): FileEntry[] {
  const entries: FileEntry[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("total ")) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 9) continue;

    const permissions = parts[0];
    const size = parseInt(parts[4], 10) || 0;
    const modified = `${parts[5]} ${parts[6]} ${parts[7]}`;
    const name = parts.slice(8).join(" ");

    if (name === "." || name === "..") continue;

    const isDir = permissions.startsWith("d");
    const entryPath =
      basePath === "/" ? `/${name}` : `${basePath}/${name}`;

    entries.push({ name, path: entryPath, isDir, size, modified });
  }

  return sortFileEntries(entries);
}

// ── dir output parser (Windows containers) ─────────────────────────────────

/**
 * Parses the output of `cmd /c dir` on Windows containers into FileEntry objects.
 * Expected format:
 *   Directory of C:\some\path
 *   01/01/2024  12:00 PM    <DIR>          subdir
 *   01/01/2024  12:00 PM             1,234 file.txt
 */
export function parseDirOutput(output: string, basePath: string): FileEntry[] {
  const entries: FileEntry[] = [];
  let inFileList = false;

  for (const line of output.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("Directory of ")) {
      inFileList = true;
      continue;
    }

    if (
      !inFileList ||
      !trimmed ||
      trimmed.startsWith("Volume ") ||
      /^\d+\s+(File|Dir)\(s\)/.test(trimmed)
    ) {
      continue;
    }

    const match = trimmed.match(
      /^(\S+)\s+(\S+(?:\s+\S+)?)\s+(<DIR>|\d[\d,]*)\s+(.+)$/
    );
    if (!match) continue;

    const [, date, time, sizeOrDir, name] = match;
    if (name === "." || name === "..") continue;

    const isDir = sizeOrDir === "<DIR>";
    const size = isDir ? 0 : parseInt(sizeOrDir.replace(/,/g, ""), 10) || 0;
    const modified = `${date} ${time}`;
    const entryPath =
      basePath.endsWith("\\") || basePath.endsWith("/")
        ? `${basePath}${name}`
        : `${basePath}\\${name}`;

    entries.push({ name, path: entryPath, isDir, size, modified });
  }

  return sortFileEntries(entries);
}
