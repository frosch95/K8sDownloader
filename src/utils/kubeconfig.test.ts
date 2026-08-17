import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  getFileIcon,
  formatLogFileName,
  extractErrorMessage,
  filterContexts,
  filterNamespaces,
  filterPods,
  sortFileEntries,
  getParentPath,
  parseLsOutput,
  parseFindOutput,
  parseDirOutput,
  sanitizeContainerPath,
  validateKubernetesIdentifier,
} from "../utils/kubeconfig";
import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from "../types";

// ── formatFileSize ─────────────────────────────────────────────────────────

describe("formatFileSize", () => {
  it("returns '0 B' for zero", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1 GB");
  });

  it("handles fractional sizes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});

// ── getFileIcon ────────────────────────────────────────────────────────────

describe("getFileIcon", () => {
  it("returns folder icon for directories", () => {
    expect(getFileIcon(true)).toBe("📁");
  });

  it("returns file icon for files", () => {
    expect(getFileIcon(false)).toBe("📄");
  });
});

// ── formatLogFileName ─────────────────────────────────────────────────────

describe("formatLogFileName", () => {
  it("builds '<podName>-YYYY-MM-DD-HH-mm.log'", () => {
    const date = new Date(2026, 7, 17, 14, 5); // 2026-08-17 14:05 (local)
    expect(formatLogFileName("nginx-abc", date)).toBe("nginx-abc-2026-08-17-14-05.log");
  });

  it("zero-pads single-digit month, day, hour, and minute", () => {
    const date = new Date(2026, 0, 2, 3, 4); // 2026-01-02 03:04 (local)
    expect(formatLogFileName("api-server", date)).toBe("api-server-2026-01-02-03-04.log");
  });

  it("defaults to the current date when none is provided", () => {
    const result = formatLogFileName("nginx-abc");
    expect(result).toMatch(/^nginx-abc-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.log$/);
  });
});

// ── extractErrorMessage ────────────────────────────────────────────────────

describe("extractErrorMessage", () => {
  it("returns string directly", () => {
    expect(extractErrorMessage("test error")).toBe("test error");
  });

  it("extracts message from Error object", () => {
    expect(extractErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns fallback for unknown types", () => {
    expect(extractErrorMessage(null)).toBe("An unknown error occurred");
    expect(extractErrorMessage(undefined)).toBe("An unknown error occurred");
    expect(extractErrorMessage(42)).toBe("An unknown error occurred");
  });
});

// ── filterContexts ─────────────────────────────────────────────────────────

describe("filterContexts", () => {
  const contexts: ContextInfo[] = [
    { name: "prod-cluster", cluster: "prod-eu", user: "admin" },
    { name: "dev-cluster", cluster: "dev-us", user: "dev" },
    { name: "staging", cluster: "staging-eu", user: "ci" },
  ];

  it("filters by name", () => {
    const result = filterContexts(contexts, "prod");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("prod-cluster");
  });

  it("filters by cluster", () => {
    expect(filterContexts(contexts, "eu")).toHaveLength(2);
  });

  it("is case-insensitive", () => {
    expect(filterContexts(contexts, "PROD")).toHaveLength(1);
  });

  it("returns all when query is empty", () => {
    expect(filterContexts(contexts, "")).toHaveLength(3);
  });
});

// ── filterNamespaces ───────────────────────────────────────────────────────

describe("filterNamespaces", () => {
  const namespaces: NamespaceInfo[] = [
    { name: "default" },
    { name: "kube-system" },
    { name: "production" },
  ];

  it("filters by name substring", () => {
    expect(filterNamespaces(namespaces, "kube")).toHaveLength(1);
  });

  it("returns all when empty", () => {
    expect(filterNamespaces(namespaces, "")).toHaveLength(3);
  });
});

// ── filterPods ─────────────────────────────────────────────────────────────

describe("filterPods", () => {
  const pods: PodInfo[] = [
    { name: "nginx-deployment-abc", namespace: "default", status: "Running", containers: ["nginx"] },
    { name: "redis-master", namespace: "default", status: "Running", containers: ["redis"] },
    { name: "api-server", namespace: "default", status: "Pending", containers: ["api"] },
  ];

  it("filters by pod name", () => {
    expect(filterPods(pods, "nginx")).toHaveLength(1);
  });

  it("is case-insensitive", () => {
    expect(filterPods(pods, "NGINX")).toHaveLength(1);
  });
});

// ── sortFileEntries ────────────────────────────────────────────────────────

describe("sortFileEntries", () => {
  const entries: FileEntry[] = [
    { name: "zebra.txt", path: "/zebra.txt", isDir: false, size: 100, modified: "Jan 1" },
    { name: "alpha", path: "/alpha", isDir: true, size: 0, modified: "Jan 1" },
    { name: "beta.txt", path: "/beta.txt", isDir: false, size: 200, modified: "Jan 2" },
    { name: "code", path: "/code", isDir: true, size: 0, modified: "Jan 3" },
  ];

  it("sorts directories before files", () => {
    const sorted = sortFileEntries(entries);
    expect(sorted[0].isDir).toBe(true);
    expect(sorted[1].isDir).toBe(true);
    expect(sorted[2].isDir).toBe(false);
    expect(sorted[3].isDir).toBe(false);
  });

  it("sorts alphabetically within each group", () => {
    const sorted = sortFileEntries(entries);
    expect(sorted[0].name).toBe("alpha");
    expect(sorted[1].name).toBe("code");
    expect(sorted[2].name).toBe("beta.txt");
    expect(sorted[3].name).toBe("zebra.txt");
  });
});

// ── getParentPath ──────────────────────────────────────────────────────────

describe("getParentPath", () => {
  it("returns / for root", () => {
    expect(getParentPath("/")).toBe("/");
  });

  it("returns parent for nested path", () => {
    expect(getParentPath("/var/log")).toBe("/var");
  });

  it("returns root for single-level path", () => {
    expect(getParentPath("/etc")).toBe("/");
  });
});

// ── parseLsOutput ──────────────────────────────────────────────────────────

describe("parseLsOutput", () => {
  const sample = [
    "total 12",
    "drwxr-xr-x  2 root root  4096 Jan 01 12:00 subdir",
    "-rw-r--r--  1 root root  1234 Jan 02 13:00 file.txt",
    "-rwxr-xr-x  1 root root  5678 Jan 03 14:00 script.sh",
  ].join("\n");

  it("parses directories correctly", () => {
    const entries = parseLsOutput(sample, "/app");
    const dir = entries.find((e) => e.name === "subdir");
    expect(dir).toBeDefined();
    expect(dir!.isDir).toBe(true);
    expect(dir!.size).toBe(4096);
    expect(dir!.path).toBe("/app/subdir");
  });

  it("parses files correctly", () => {
    const entries = parseLsOutput(sample, "/app");
    const file = entries.find((e) => e.name === "file.txt");
    expect(file).toBeDefined();
    expect(file!.isDir).toBe(false);
    expect(file!.size).toBe(1234);
    expect(file!.modified).toBe("Jan 02 13:00");
  });

  it("sorts directories before files", () => {
    const entries = parseLsOutput(sample, "/");
    expect(entries[0].isDir).toBe(true);
    expect(entries[1].isDir).toBe(false);
  });

  it("handles root path correctly", () => {
    const entries = parseLsOutput(sample, "/");
    expect(entries[0].path).toBe("/subdir");
    expect(entries[1].path).toBe("/file.txt");
  });

  it("filters . and .. entries", () => {
    const withDots = [
      "drwxr-xr-x  2 root root  4096 Jan 01 12:00 .",
      "drwxr-xr-x  2 root root  4096 Jan 01 12:00 ..",
      "-rw-r--r--  1 root root   100 Jan 01 12:00 real.txt",
    ].join("\n");
    const entries = parseLsOutput(withDots, "/");
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("real.txt");
  });
});

// ── parseFindOutput ────────────────────────────────────────────────────────

describe("parseFindOutput", () => {
  const sample = [
    "d|4096|2026-08-13 12:34|/app/subdir",
    "f|1234|2026-08-13 12:35|/app/file.txt",
    "l|12|2026-08-13 12:36|/app/link",
  ].join("\n");

  it("parses directories correctly", () => {
    const entries = parseFindOutput(sample, "/app");
    const dir = entries.find((e) => e.name === "subdir");
    expect(dir).toBeDefined();
    expect(dir!.isDir).toBe(true);
    expect(dir!.size).toBe(4096);
    expect(dir!.modified).toBe("2026-08-13 12:34");
    expect(dir!.path).toBe("/app/subdir");
  });

  it("parses files correctly", () => {
    const entries = parseFindOutput(sample, "/app");
    const file = entries.find((e) => e.name === "file.txt");
    expect(file).toBeDefined();
    expect(file!.isDir).toBe(false);
    expect(file!.size).toBe(1234);
    expect(file!.modified).toBe("2026-08-13 12:35");
  });

  it("treats symlinks as non-directories", () => {
    const entries = parseFindOutput(sample, "/app");
    const link = entries.find((e) => e.name === "link");
    expect(link).toBeDefined();
    expect(link!.isDir).toBe(false);
  });

  it("skips the start directory itself", () => {
    const withStart = [
      "d|4096|2026-08-13 12:34|/app",
      "f|1234|2026-08-13 12:35|/app/file.txt",
    ].join("\n");
    const entries = parseFindOutput(withStart, "/app");
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("file.txt");
  });

  it("handles names that contain the delimiter", () => {
    const entries = parseFindOutput(
      "f|10|2026-08-13 12:00|/app/a|b.txt",
      "/app"
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("a|b.txt");
    expect(entries[0].path).toBe("/app/a|b.txt");
  });

  it("sorts directories before files", () => {
    const entries = parseFindOutput(
      [
        "f|1|2026-08-13 12:00|/app/z.txt",
        "d|1|2026-08-13 12:00|/app/a-dir",
      ].join("\n"),
      "/app"
    );
    expect(entries[0].isDir).toBe(true);
    expect(entries[1].isDir).toBe(false);
  });
});

// ── parseDirOutput ─────────────────────────────────────────────────────────

describe("validateKubernetesIdentifier", () => {
  it("accepts valid context names", () => {
    expect(validateKubernetesIdentifier("prod-cluster", "Context name", { allowUppercase: true })).toBe("prod-cluster");
  });

  it("rejects unsupported characters", () => {
    expect(() => validateKubernetesIdentifier("bad/name", "Context name", { allowUppercase: true })).toThrow("unsupported characters");
  });

  it("rejects empty values", () => {
    expect(() => validateKubernetesIdentifier("   ", "Namespace")).toThrow("required");
  });
});

describe("sanitizeContainerPath", () => {
  it("accepts absolute Unix paths", () => {
    expect(sanitizeContainerPath("/var/log/nginx.log")).toBe("/var/log/nginx.log");
  });

  it("accepts absolute Windows paths", () => {
    expect(sanitizeContainerPath("C:/temp/file.txt")).toBe("C:/temp/file.txt");
  });

  it("rejects traversal segments", () => {
    expect(() => sanitizeContainerPath("/var/log/../etc/passwd")).toThrow("traversal");
  });

  it("rejects relative paths", () => {
    expect(() => sanitizeContainerPath("var/log")).toThrow("absolute");
  });
});

describe("parseDirOutput", () => {
  const sample = [
    " Volume in drive C has no label.",
    " Volume Serial Number is ABCD-1234",
    "",
    " Directory of C:\\app",
    "",
    "01/01/2024  12:00 PM    <DIR>          subdir",
    "01/02/2024  01:00 PM             1,234 file.txt",
    "01/03/2024  02:00 PM             5,678 script.ps1",
    "               2 File(s)          6,912 bytes",
  ].join("\n");

  it("parses directories correctly", () => {
    const entries = parseDirOutput(sample, "C:\\app");
    const dir = entries.find((e) => e.name === "subdir");
    expect(dir).toBeDefined();
    expect(dir!.isDir).toBe(true);
    expect(dir!.size).toBe(0);
    expect(dir!.path).toBe("C:\\app\\subdir");
  });

  it("parses files correctly", () => {
    const entries = parseDirOutput(sample, "C:\\app");
    const file = entries.find((e) => e.name === "file.txt");
    expect(file).toBeDefined();
    expect(file!.isDir).toBe(false);
    expect(file!.size).toBe(1234);
    expect(file!.modified).toBe("01/02/2024 01:00 PM");
  });

  it("sorts directories before files", () => {
    const entries = parseDirOutput(sample, "C:\\app");
    expect(entries[0].isDir).toBe(true);
    expect(entries[1].isDir).toBe(false);
  });

  it("skips header and footer lines", () => {
    const entries = parseDirOutput(sample, "C:\\app");
    // Should have 3 entries: 1 dir + 2 files
    expect(entries).toHaveLength(3);
  });
});
