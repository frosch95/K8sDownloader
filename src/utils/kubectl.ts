import fs from "node:fs";
import path from "node:path";

export function resolveKubectlCommand(): string {
  const explicitPath = process.env.KUBECTL_PATH || process.env.KUBECTL_BIN;
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  const candidates = new Set<string>();
  const pathEntries = (process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);

  for (const entry of pathEntries) {
    candidates.add(path.join(entry, "kubectl"));
    candidates.add(path.join(entry, "kubectl.exe"));
  }

  if (process.platform === "win32") {
    candidates.add("C:/Program Files/Docker/Docker/resources/bin/kubectl.exe");
    candidates.add("C:/Program Files/kubectl.exe");
    candidates.add("C:/Program Files/Kubernetes/kubectl.exe");
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return process.platform === "win32" ? "kubectl.exe" : "kubectl";
}
