import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from "./kubernetes";

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: number;
}

export interface PageInfo {
  currentPath: string;
  parentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ElectronApiBridge {
  getContexts: () => Promise<ContextInfo[]>;
  getNamespaces: (contextName: string) => Promise<NamespaceInfo[]>;
  getPods: (contextName: string, namespace: string) => Promise<PodInfo[]>;
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
}

export type ConnectionStep = "context" | "namespace" | "pod" | "browse";