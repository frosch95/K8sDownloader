import { spawn, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { resolveKubectlCommand } from "../src/utils/kubectl";
import {
  parseLsOutput,
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

// ── File listing via kubectl exec ──────────────────────────────────────────
//
// Tries Linux ls first; falls back to Windows dir for Windows containers.

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

  // Try Linux ls first
  const lsArgs = buildExecArgs(
    safeContextName, safeNamespace, safePodName, safeContainerName,
    ["ls", "-la", safeDirPath]
  );

  const lsResult = runKubectlRaw(lsArgs);
  if (lsResult.status === 0) {
    const entries = parseLsOutput(lsResult.stdout.toString("utf-8"), dirPath);
    log(`listFiles: ${entries.length} entr${entries.length === 1 ? "y" : "ies"} (Linux ls)`);
    return entries;
  }

  // Fallback: Windows dir command
  log("listFiles: ls failed, trying Windows dir…");
  const windowsDirPath = normalizeWindowsContainerPath(safeDirPath);
  const dirArgs = buildExecArgs(
    safeContextName, safeNamespace, safePodName, safeContainerName,
    ["cmd", "/c", "dir", windowsDirPath]
  );

  const dirResult = runKubectlRaw(dirArgs);
  if (dirResult.status !== 0) {
    const stderr = (dirResult.stderr || "").toString().trim();
    throw new Error(`kubectl exec failed: ${stderr || `exit code ${dirResult.status}`}`);
  }

  const entries = parseDirOutput(dirResult.stdout.toString("utf-8"), dirPath);
  log(`listFiles: ${entries.length} entr${entries.length === 1 ? "y" : "ies"} (Windows dir)`);
  return entries;
}

// ── File download via kubectl exec ─────────────────────────────────────────
//
// Tries Linux cat first; falls back to Windows cmd /c type.
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
  if (!isExecutableNotFoundError(catAttempt.stderr, "cat")) {
    throw new Error(`kubectl exec failed: ${catAttempt.stderr || "cat failed"}`);
  }

  // Fallback: Windows cmd /c type
  log("downloadFile: cat not available in container, trying Windows type…");
  const windowsSourcePath = normalizeWindowsContainerPath(safeSourcePath);
  const typeAttempt = await runExecToFile(
    [...baseArgs, "cmd", "/c", "type", windowsSourcePath],
    destPath
  );

  if (!typeAttempt.success) {
    throw new Error(`kubectl exec failed: ${typeAttempt.stderr || "type failed"}`);
  }

  log(`downloadFile: written ${typeAttempt.bytesWritten} bytes via type`);
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

/**
 * True when a kubectl exec stderr indicates the container's runtime could not
 * start `executableName` at all (no such binary on PATH), as opposed to the
 * command starting and failing on its own (missing file, permission denied).
 * OCI runtimes report the former as `exec: "<name>": executable file not found`.
 */
function isExecutableNotFoundError(stderr: string, executableName: string): boolean {
  const quoted = `"${executableName}"`;
  return stderr.includes(quoted) && /executable file not found/i.test(stderr);
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
