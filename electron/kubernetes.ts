import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
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
// Uses raw spawnSync with encoding:buffer for binary safety.

export function downloadFile(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null,
  sourcePath: string,
  destPath: string
): void {
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
  const catResult = spawnSync("kubectl", [...baseArgs, "cat", safeSourcePath], {
    encoding: "buffer",
    timeout: 60000,
    maxBuffer: 200 * 1024 * 1024,
    windowsHide: true,
    shell: false,
  });

  if (catResult.status === 0) {
    fs.writeFileSync(destPath, catResult.stdout);
    log(`downloadFile: written ${catResult.stdout.length} bytes via cat`);
    return;
  }

  // Fallback: Windows cmd /c type
  log("downloadFile: cat failed, trying Windows type…");
  const windowsSourcePath = normalizeWindowsContainerPath(safeSourcePath);
  const typeResult = spawnSync("kubectl", [...baseArgs, "cmd", "/c", "type", windowsSourcePath], {
    encoding: "buffer",
    timeout: 60000,
    maxBuffer: 200 * 1024 * 1024,
    windowsHide: true,
    shell: false,
  });

  if (typeResult.error) {
    throw new Error(`kubectl exec failed: ${typeResult.error.message}`);
  }

  if (typeResult.status !== 0) {
    const stderr = (typeResult.stderr || "").toString().trim();
    throw new Error(`kubectl exec failed: ${stderr || `exit code ${typeResult.status}`}`);
  }

  fs.writeFileSync(destPath, typeResult.stdout);
  log(`downloadFile: written ${typeResult.stdout.length} bytes via type`);
}

// ── Internal helpers ───────────────────────────────────────────────────────

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

  const result = spawnSync("kubectl", args, {
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
