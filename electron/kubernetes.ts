import { spawn, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { resolveKubectlCommand } from "../src/utils/kubectl";
import {
  parseLsOutput,
  parseFindOutput,
  parseDirOutput,
  sanitizeContainerPath,
  validateKubernetesIdentifier,
} from "../src/utils/kubeconfig";

// ── Logger ─────────────────────────────────────────────────────────────────

const LOG_PREFIX = "[K8s]";

function log(message: string): void {
  console.log(`${LOG_PREFIX} ${message}`);
}

function logError(message: string): void {
  console.error(`${LOG_PREFIX} ${message}`);
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ContextInfo {
  name: string;
  cluster: string;
  user: string;
}

export interface NamespaceInfo {
  name: string;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  containers: string[];
}

export interface PodContainerDetail {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  state: string;
}

export interface PodDetails {
  name: string;
  namespace: string;
  status: string;
  node: string | null;
  podIP: string | null;
  createdAt: string | null;
  startedAt: string | null;
  managedBy: string | null;
  containers: PodContainerDetail[];
}

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: string;
}

// ── API: Contexts ──────────────────────────────────────────────────────────

export function getContexts(): ContextInfo[] {
  log("getContexts: reading kubeconfig…");

  const configPath = getKubeconfigPath();
  log(`getContexts: config path = ${configPath}`);

  if (!fs.existsSync(configPath)) {
    logError(`getContexts: config not found at ${configPath}`);
    throw new Error(`Kubernetes config not found at ${configPath}`);
  }

  const output = runKubectl(["config", "view", "-o", "json"]);
  const config = JSON.parse(output);

  const contexts = (config.contexts || []).map(
    (ctx: {
      name: string;
      context?: { cluster?: string; user?: string };
    }) => ({
      name: ctx.name,
      cluster: ctx.context?.cluster || "",
      user: ctx.context?.user || "",
    })
  );

  log(`getContexts: found ${contexts.length} context(s)`);
  return contexts;
}

// ── API: Namespaces ────────────────────────────────────────────────────────

export function getNamespaces(contextName: string): NamespaceInfo[] {
  const safeContextName = validateKubernetesIdentifier(contextName, "Context name", {
    allowUppercase: true,
  });
  log(`getNamespaces: context="${safeContextName}"`);

  const output = runKubectl([
    "--context", safeContextName,
    "get", "namespaces",
    "-o", "json",
  ]);
  const result = JSON.parse(output);

  const namespaces = (result.items || []).map(
    (ns: { metadata?: { name?: string } }) => ({
      name: ns.metadata?.name || "",
    })
  ).sort((a: NamespaceInfo, b: NamespaceInfo) =>
    a.name.localeCompare(b.name)
  );

  log(`getNamespaces: found ${namespaces.length} namespace(s)`);
  return namespaces;
}

// ── API: Pods ──────────────────────────────────────────────────────────────

export function getPods(
  contextName: string,
  namespace: string
): PodInfo[] {
  const safeContextName = validateKubernetesIdentifier(contextName, "Context name", {
    allowUppercase: true,
  });
  const safeNamespace = validateKubernetesIdentifier(namespace, "Namespace");
  log(`getPods: context="${safeContextName}" namespace="${safeNamespace}"`);

  const output = runKubectl([
    "--context", safeContextName,
    "-n", safeNamespace,
    "get", "pods",
    "-o", "json",
  ]);
  const result = JSON.parse(output);

  const pods = (result.items || []).map(
    (pod: {
      metadata?: { name?: string; namespace?: string };
      status?: { phase?: string };
      spec?: { containers?: { name: string }[] };
    }) => ({
      name: pod.metadata?.name || "",
      namespace: pod.metadata?.namespace || "",
      status: pod.status?.phase || "Unknown",
      containers: pod.spec?.containers?.map(
        (c: { name: string }) => c.name
      ) || [],
    })
  );

  log(`getPods: found ${pods.length} pod(s)`);
  return pods;
}

/** Human-readable label for a container's current lifecycle state. */
function describeContainerState(
  state?: {
    running?: unknown;
    waiting?: { reason?: string };
    terminated?: { reason?: string };
  }
): string {
  if (!state) return "Unknown";
  if (state.running) return "Running";
  if (state.waiting) return state.waiting.reason ? `Waiting: ${state.waiting.reason}` : "Waiting";
  if (state.terminated) return state.terminated.reason ? `Terminated: ${state.terminated.reason}` : "Terminated";
  return "Unknown";
}

export function getPodDetails(
  contextName: string,
  namespace: string,
  podName: string
): PodDetails {
  const safeContextName = validateKubernetesIdentifier(contextName, "Context name", {
    allowUppercase: true,
  });
  const safeNamespace = validateKubernetesIdentifier(namespace, "Namespace");
  const safePodName = validateKubernetesIdentifier(podName, "Pod name");
  log(`getPodDetails: context="${safeContextName}" ns="${safeNamespace}" pod="${safePodName}"`);

  const output = runKubectl([
    "--context", safeContextName,
    "-n", safeNamespace,
    "get", "pod", safePodName,
    "-o", "json",
  ]);
  const pod = JSON.parse(output) as {
    metadata?: {
      name?: string;
      namespace?: string;
      creationTimestamp?: string;
      ownerReferences?: { kind: string; name: string }[];
    };
    spec?: { nodeName?: string; containers?: { name: string; image?: string }[] };
    status?: {
      phase?: string;
      podIP?: string;
      startTime?: string;
      containerStatuses?: {
        name: string;
        ready?: boolean;
        restartCount?: number;
        state?: { running?: unknown; waiting?: { reason?: string }; terminated?: { reason?: string } };
      }[];
    };
  };

  const statusByContainer = new Map(
    (pod.status?.containerStatuses || []).map((cs) => [cs.name, cs])
  );

  const containers: PodContainerDetail[] = (pod.spec?.containers || []).map((c) => {
    const containerStatus = statusByContainer.get(c.name);
    return {
      name: c.name,
      image: c.image || "",
      ready: containerStatus?.ready ?? false,
      restartCount: containerStatus?.restartCount ?? 0,
      state: describeContainerState(containerStatus?.state),
    };
  });

  const ownerRef = (pod.metadata?.ownerReferences || [])[0];

  const details: PodDetails = {
    name: pod.metadata?.name || safePodName,
    namespace: pod.metadata?.namespace || safeNamespace,
    status: pod.status?.phase || "Unknown",
    node: pod.spec?.nodeName || null,
    podIP: pod.status?.podIP || null,
    createdAt: pod.metadata?.creationTimestamp || null,
    startedAt: pod.status?.startTime || null,
    managedBy: ownerRef ? `${ownerRef.kind}/${ownerRef.name}` : null,
    containers,
  };

  log(`getPodDetails: resolved ${containers.length} container(s) for pod="${safePodName}"`);
  return details;
}

// ── File listing via kubectl exec ──────────────────────────────────────────
//
// Tries Linux tooling first (ls, find, busybox) for Linux containers, then
// falls back to Windows dir for Windows containers. Distroless/scratch images
// (e.g. CoreDNS) contain no shell utilities at all and cannot be listed.

// Format for `find -printf` on Linux containers without `ls`:
//   %y type | %s size | %TY-%Tm-%Td %TH:%TM mtime | %p full path
// The trailing "\n" is a literal escape that find interprets as a newline.
const FIND_LIST_FORMAT = "%y|%s|%TY-%Tm-%Td %TH:%TM|%p\\n";

interface LinuxListAttempt {
  label: string;
  toolName: string;
  command: (dir: string) => string[];
  parser: (output: string, basePath: string) => FileEntry[];
}

// Candidates tried in order for Linux containers. `find` covers minimal images
// without `ls`; `busybox` covers images that ship the busybox binary without
// applet symlinks. Absolute paths are used so commands can never collide with
// Windows binaries (find.exe / cmd.exe) during the Windows fallback.
const LINUX_LIST_ATTEMPTS: LinuxListAttempt[] = [
  {
    label: "Linux ls",
    toolName: "ls",
    command: (dir) => ["ls", "-la", dir],
    parser: parseLsOutput,
  },
  {
    label: "/usr/bin/find",
    toolName: "find",
    command: (dir) => ["/usr/bin/find", dir, "-maxdepth", "1", "-printf", FIND_LIST_FORMAT],
    parser: parseFindOutput,
  },
  {
    label: "/bin/find",
    toolName: "find",
    command: (dir) => ["/bin/find", dir, "-maxdepth", "1", "-printf", FIND_LIST_FORMAT],
    parser: parseFindOutput,
  },
  {
    label: "busybox ls",
    toolName: "ls",
    command: (dir) => ["busybox", "ls", "-la", dir],
    parser: parseLsOutput,
  },
  {
    label: "/bin/busybox ls",
    toolName: "ls",
    command: (dir) => ["/bin/busybox", "ls", "-la", dir],
    parser: parseLsOutput,
  },
];

export function listFiles(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null,
  dirPath: string
): FileEntry[] {
  const safeContextName = validateKubernetesIdentifier(contextName, "Context name", {
    allowUppercase: true,
  });
  const safeNamespace = validateKubernetesIdentifier(namespace, "Namespace");
  const safePodName = validateKubernetesIdentifier(podName, "Pod name");
  const safeContainerName = containerName
    ? validateKubernetesIdentifier(containerName, "Container name")
    : null;
  const safeDirPath = sanitizeContainerPath(dirPath);

  log(
    `listFiles: context="${safeContextName}" ns="${safeNamespace}" ` +
    `pod="${safePodName}" container="${safeContainerName || "(default)"}" ` +
    `path="${safeDirPath}"`
  );

  // ── Attempt 1: Linux tooling (ls, find, busybox) ──
  // Distroless/scratch images (e.g. CoreDNS) have no tools at all, so every
  // candidate fails to start and we fall through to the Windows attempt below,
  // which also fails — leaving a clear "no tool" error for the user.
  for (const attempt of LINUX_LIST_ATTEMPTS) {
    log(`listFiles: trying ${attempt.label}…`);
    const result = runKubectlRaw(
      buildExecArgs(
        safeContextName, safeNamespace, safePodName, safeContainerName,
        attempt.command(safeDirPath)
      )
    );
    if (result.status === 0) {
      const entries = attempt.parser(result.stdout.toString("utf-8"), safeDirPath);
      log(`listFiles: ${entries.length} entr${entries.length === 1 ? "y" : "ies"} (${attempt.label})`);
      return entries;
    }
    const stderr = (result.stderr || "").toString().trim();
    // If the command itself ran on a Linux container but failed (e.g. `ls:
    // Permission denied`), that is the real error — it must not be masked by
    // the remaining fallbacks.
    if (!isExecStartupError(stderr) && isCommandDiagnostic(stderr, attempt.toolName)) {
      throw new Error(`kubectl exec failed: ${stderr || `exit code ${result.status}`}`);
    }
  }

  // ── Attempt 2: Windows dir command ──
  log("listFiles: Linux tooling unavailable, trying Windows dir…");
  const windowsDirPath = normalizeWindowsContainerPath(safeDirPath);
  const dirArgs = buildExecArgs(
    safeContextName, safeNamespace, safePodName, safeContainerName,
    ["cmd", "/c", "dir", windowsDirPath]
  );

  const dirResult = runKubectlRaw(dirArgs);
  if (dirResult.status !== 0) {
    const stderr = (dirResult.stderr || "").toString().trim();
    throw new Error(
      `kubectl exec failed: no supported file listing tool found in the container ` +
      `(tried ls, find, busybox, dir). The container may be a distroless or ` +
      `scratch image with no shell utilities. ${stderr || `exit code ${dirResult.status}`}`
    );
  }

  const entries = parseDirOutput(dirResult.stdout.toString("utf-8"), dirPath);
  log(`listFiles: ${entries.length} entr${entries.length === 1 ? "y" : "ies"} (Windows dir)`);
  return entries;
}

// ── File download via kubectl exec ─────────────────────────────────────────
//
// Tries Linux cat first, falls back to Windows cmd /c type, then Linux tar
// (like kubectl cp) for minimal images without cat or cmd. Distroless/scratch
// images (e.g. CoreDNS) have no tools at all and cannot be downloaded from.
// Streams stdout straight to destPath so download size is never limited by
// an in-memory buffer (spawnSync's maxBuffer caused ENOBUFS on large files).

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export async function downloadFile(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null,
  sourcePath: string,
  destPath: string
): Promise<void> {
  const safeContextName = validateKubernetesIdentifier(contextName, "Context name", {
    allowUppercase: true,
  });
  const safeNamespace = validateKubernetesIdentifier(namespace, "Namespace");
  const safePodName = validateKubernetesIdentifier(podName, "Pod name");
  const safeContainerName = containerName
    ? validateKubernetesIdentifier(containerName, "Container name")
    : null;
  const safeSourcePath = sanitizeContainerPath(sourcePath);

  log(
    `downloadFile: context="${safeContextName}" ns="${safeNamespace}" ` +
    `pod="${safePodName}" container="${safeContainerName || "(default)"}" ` +
    `source="${safeSourcePath}" dest="${destPath}"`
  );

  const baseArgs = buildBaseExecArgs(
    safeContextName,
    safeNamespace,
    safePodName,
    safeContainerName
  );

  // Try Linux cat first
  const catAttempt = await runExecToFile([...baseArgs, "cat", safeSourcePath], destPath);

  if (catAttempt.success) {
    log(`downloadFile: written ${catAttempt.bytesWritten} bytes via cat`);
    return;
  }

  // "cat" only fails to *start* on Windows containers (no such binary on PATH).
  // Any other failure (missing file, permission denied, ...) is the real error
  // for this Linux-style attempt and must not be masked by the Windows fallback.
  if (!isExecStartupError(catAttempt.stderr)) {
    throw new Error(`kubectl exec failed: ${catAttempt.stderr || "cat failed"}`);
  }

  // Fallback 1: Windows cmd /c type
  log("downloadFile: cat not available in container, trying Windows type…");
  const windowsSourcePath = normalizeWindowsContainerPath(safeSourcePath);
  const typeAttempt = await runExecToFile(
    [...baseArgs, "cmd", "/c", "type", windowsSourcePath],
    destPath
  );

  if (typeAttempt.success) {
    log(`downloadFile: written ${typeAttempt.bytesWritten} bytes via type`);
    return;
  }
  // "cmd" only fails to *start* on Linux containers (no such binary on PATH).
  // A real cmd/type failure (missing file, permission denied, ...) is the real
  // error and must not be masked by the tar fallback.
  if (!isExecStartupError(typeAttempt.stderr)) {
    throw new Error(`kubectl exec failed: ${typeAttempt.stderr || "type failed"}`);
  }

  // Fallback 2: Linux tar (the same mechanism `kubectl cp` uses) for minimal
  // Linux images without cat or cmd. The tar stream is parsed client-side and
  // only the requested file's bytes are written to destPath.
  log("downloadFile: cat and type unavailable, trying tar…");
  const tarAttempt = await runExecTarToFile(
    [...baseArgs, "tar", "-cf", "-", safeSourcePath],
    destPath
  );

  if (!tarAttempt.success) {
    if (isExecStartupError(tarAttempt.stderr)) {
      throw new Error(
        "kubectl exec failed: no supported download tool found in the container " +
        "(tried cat, type, tar). The container may be a distroless or scratch " +
        "image with no shell utilities."
      );
    }
    throw new Error(`kubectl exec failed: ${tarAttempt.stderr || "tar failed"}`);
  }

  log(`downloadFile: written ${tarAttempt.bytesWritten} bytes via tar`);
}

// ── Internal helpers ───────────────────────────────────────────────────────

interface ExecToFileResult {
  success: boolean;
  stderr: string;
  bytesWritten: number;
}

/**
 * Runs `kubectl <execArgs>` and streams its stdout straight into destPath,
 * so download size is never bounded by an in-memory buffer. stderr is exec
 * diagnostics only, so it stays small and is collected for error inspection.
 */
function execToFile(
  execArgs: string[],
  destPath: string,
  timeoutMs: number
): Promise<ExecToFileResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveKubectlCommand(), execArgs, { windowsHide: true, shell: false });
    const writeStream = fs.createWriteStream(destPath);
    const stderrChunks: Buffer[] = [];
    let bytesWritten = 0;
    let settled = false;

    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);

    const fail = (err: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      writeStream.destroy();
      reject(err);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      bytesWritten += chunk.length;
    });
    child.stdout.pipe(writeStream);

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", fail);
    writeStream.on("error", fail);

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      writeStream.end(() => {
        resolve({
          success: code === 0,
          stderr: Buffer.concat(stderrChunks).toString("utf-8").trim(),
          bytesWritten,
        });
      });
    });
  });
}

/** Like execToFile, but a failure to even start `kubectl` (e.g. not on PATH) is
 *  reported with the same "kubectl exec failed:" prefix used elsewhere. */
async function runExecToFile(execArgs: string[], destPath: string): Promise<ExecToFileResult> {
  try {
    return await execToFile(execArgs, destPath, DOWNLOAD_TIMEOUT_MS);
  } catch (err) {
    throw new Error(`kubectl exec failed: ${(err as Error).message}`, { cause: err });
  }
}

interface TarExtractResult {
  success: boolean;
  stderr: string;
  bytesWritten: number;
}

/**
 * Runs `kubectl <execArgs>` with a `tar -cf - <file>` command and writes only
 * the extracted file bytes to destPath, parsing the ustar archive stream as it
 * arrives so memory use stays bounded. This is the same mechanism `kubectl cp`
 * uses, and is the last-resort download path for minimal Linux images that ship
 * `tar` but no `cat`/`cmd`.
 */
function execTarToFile(
  execArgs: string[],
  destPath: string,
  timeoutMs: number
): Promise<TarExtractResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveKubectlCommand(), execArgs, { windowsHide: true, shell: false });
    const writeStream = fs.createWriteStream(destPath);
    const stderrChunks: Buffer[] = [];
    let settled = false;

    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);

    const fail = (err: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      writeStream.destroy();
      reject(err);
    };

    // Streaming ustar parser state. The first regular-file entry is the file
    // the user requested — extract it and ignore everything else (pax headers,
    // GNU long names, directories, end-of-archive zero blocks).
    const state = {
      buf: Buffer.alloc(0),
      phase: "header" as "header" | "extract" | "skip" | "done",
      fileSize: 0,
      padRemaining: 0,
      skipRemaining: 0,
      fileFound: false,
      bytesWritten: 0,
    };

    /**
     * Consumes whatever it can from the buffered stdout. Returns true when the
     * destination stream can accept more output, false when it signals
     * backpressure (caller should pause stdout until the stream drains).
     */
    const drain = (): boolean => {
      while (state.phase !== "done") {
        if (state.phase === "header") {
          if (state.buf.length < 512) return true;
          const header = state.buf.subarray(0, 512);
          state.buf = state.buf.subarray(512);
          if (header.every((byte) => byte === 0)) {
            state.phase = "done";
            return true;
          }
          const sizeStr = header.toString("utf8", 124, 136).split("\0")[0].trim();
          const size = parseInt(sizeStr, 8) || 0;
          const padded = Math.ceil(size / 512) * 512;
          const typeflag = header[156];
          if (typeflag === 0 || typeflag === 0x30) {
            state.fileFound = true;
            state.fileSize = size;
            state.padRemaining = padded - size;
            state.phase = "extract";
          } else {
            state.skipRemaining = padded;
            state.phase = "skip";
          }
          continue;
        }
        if (state.phase === "extract") {
          if (state.fileSize > 0) {
            if (state.buf.length === 0) return true;
            const take = Math.min(state.fileSize, state.buf.length);
            const data = state.buf.subarray(0, take);
            state.buf = state.buf.subarray(take);
            state.fileSize -= take;
            state.bytesWritten += take;
            if (!writeStream.write(data)) return false; // backpressure
            continue;
          }
          if (state.padRemaining > 0) {
            if (state.buf.length === 0) return true;
            const take = Math.min(state.padRemaining, state.buf.length);
            state.buf = state.buf.subarray(take);
            state.padRemaining -= take;
            continue;
          }
          state.phase = "done";
          state.buf = Buffer.alloc(0);
          return true;
        }
        // skip
        if (state.skipRemaining > 0) {
          if (state.buf.length === 0) return true;
          const take = Math.min(state.skipRemaining, state.buf.length);
          state.buf = state.buf.subarray(take);
          state.skipRemaining -= take;
          continue;
        }
        state.phase = "header";
      }
      return true;
    };

    /** Drains remaining buffered data after a backpressure pause. */
    const resumeOutput = (): void => {
      if (state.phase === "done") return;
      const accepted = drain();
      if (!accepted) {
        writeStream.once("drain", resumeOutput);
      } else {
        child.stdout.resume();
      }
    };

    child.stdout.on("data", (chunk: Buffer) => {
      if (state.phase === "done") return;
      state.buf = Buffer.concat([state.buf, chunk]);
      const accepted = drain();
      if (!accepted) {
        child.stdout.pause();
        writeStream.once("drain", resumeOutput);
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", fail);
    writeStream.on("error", fail);

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const stderr = Buffer.concat(stderrChunks).toString("utf-8").trim();
      const bytesWritten = state.bytesWritten;
      const finish = (): void => {
        resolve({
          success: code === 0 && state.fileFound,
          stderr,
          bytesWritten,
        });
      };
      if (writeStream.writableFinished) {
        finish();
      } else {
        writeStream.end(finish);
      }
    });
  });
}

/** Like execTarToFile, but a failure to even start `kubectl` is reported with
 *  the standard "kubectl exec failed:" prefix. */
async function runExecTarToFile(execArgs: string[], destPath: string): Promise<TarExtractResult> {
  try {
    return await execTarToFile(execArgs, destPath, DOWNLOAD_TIMEOUT_MS);
  } catch (err) {
    throw new Error(`kubectl exec failed: ${(err as Error).message}`, { cause: err });
  }
}

/**
 * True when a kubectl exec stderr indicates the container runtime could not
 * start the requested command at all (the binary is missing from PATH or the
 * filesystem), as opposed to the command starting and failing on its own.
 * OCI runtimes (runc / runhcs) report these as:
 *   exec: "ls": executable file not found in $PATH
 *   exec: "/usr/bin/find": stat /usr/bin/find: no such file or directory
 */
function isExecStartupError(stderr: string): boolean {
  if (!stderr.includes("exec: ")) return false;
  return (
    /executable file not found/i.test(stderr) ||
    /no such file or directory/i.test(stderr)
  );
}

/**
 * True when a stderr indicates the command with the given name actually ran on
 * a Linux container and reported an error of its own. GNU and busybox tooling
 * prefix their diagnostics with "<name>: " (e.g. `ls: cannot access '/x': No
 * such file or directory`, `find: bad -printf '...'`).
 */
function isCommandDiagnostic(stderr: string, commandName: string): boolean {
  return new RegExp(`(^|\\s)${commandName}:\\s`).test(stderr);
}

/** Returns args up to (but not including) the `--` separator for kubectl exec. */
function buildBaseExecArgs(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null
): string[] {
  const args = [
    "--context", contextName,
    "exec", "-n", namespace, podName,
  ];
  if (containerName) {
    args.push("-c", containerName);
  }
  args.push("--");
  return args;
}

function getKubeconfigPath(): string {
  return process.env.KUBECONFIG || path.join(os.homedir(), ".kube", "config");
}

function buildExecArgs(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null,
  command: string[]
): string[] {
  const args = [
    "--context", contextName,
    "exec", "-n", namespace, podName,
  ];
  if (containerName) {
    args.push("-c", containerName);
  }
  args.push("--", ...command);
  return args;
}

function normalizeWindowsContainerPath(inputPath: string): string {
  const trimmed = inputPath.trim();
  if (!trimmed || trimmed === "/") {
    return "\\";
  }

  // Keep explicit drive-letter paths as-is except slash normalization.
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return trimmed.replace(/\//g, "\\");
  }

  // For Unix-style absolute paths (e.g. /app/log), map to Windows root-relative paths.
  if (trimmed.startsWith("/")) {
    return trimmed.replace(/\//g, "\\");
  }

  return trimmed.replace(/\//g, "\\");
}

function runKubectlRaw(args: string[]): ReturnType<typeof spawnSync> {
  log(`runKubectl: executing kubectl ${args.join(" ")}`);

  const result = spawnSync(resolveKubectlCommand(), args, {
    encoding: "utf-8",
    timeout: 30000,
    maxBuffer: 50 * 1024 * 1024,
    windowsHide: true,
    shell: false,
  });

  if (result.error) {
    const msg = result.error.message;
    logError(`runKubectl: ERROR — ${msg}`);
    if (msg.includes("ENOENT")) {
      throw new Error(
        "kubectl is not installed or not on PATH. " +
        "Please install kubectl to use K8sDownloader."
      );
    }
    throw new Error(`kubectl failed: ${msg}`);
  }

  return result;
}

function runKubectl(args: string[]): string {
  const result = runKubectlRaw(args);

  if (result.status !== 0) {
    const stderr = (result.stderr || "").toString().trim();
    logError(`runKubectl: exit code ${result.status} — ${stderr}`);
    throw new Error(`kubectl failed: ${stderr || `exit code ${result.status}`}`);
  }

  const output = (result.stdout || "").toString();
  log(`runKubectl: completed (${output.length} bytes)`);
  return output;
}
