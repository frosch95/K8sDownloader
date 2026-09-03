import type { ContextInfo, NamespaceInfo, PodInfo, PodDetails, FileEntry } from "./kubernetes";

export interface ElectronApiBridge {
  getContexts: () => Promise<ContextInfo[]>;
  getNamespaces: (contextName: string) => Promise<NamespaceInfo[]>;
  getPods: (contextName: string, namespace: string) => Promise<PodInfo[]>;
  getPodDetails: (
    contextName: string,
    namespace: string,
    podName: string
  ) => Promise<PodDetails | null>;
  listFiles: (
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    dirPath: string
  ) => Promise<FileEntry[]>;
  showSaveDialog: (defaultName: string) => Promise<string | null>;
  downloadFile: (
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    sourcePath: string,
    destPath: string
  ) => Promise<void>;
  downloadPodLogs: (
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    destPath: string
  ) => Promise<void>;
  getThirdPartyLicenses: () => Promise<{ success: true; content: string } | { success: false; error: string }>;
  openThirdPartyLicenses: () => Promise<{ success: true } | { success: false; error: string }>;
}