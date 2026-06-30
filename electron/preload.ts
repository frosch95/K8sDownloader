import { contextBridge, ipcRenderer } from "electron";
import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from "../src/shared/types/kubernetes";

const electronAPI = {
  getContexts: (): Promise<ContextInfo[]> =>
    ipcRenderer.invoke("get-contexts"),

  getNamespaces: (contextName: string): Promise<NamespaceInfo[]> =>
    ipcRenderer.invoke("get-namespaces", contextName),

  getPods: (contextName: string, namespace: string): Promise<PodInfo[]> =>
    ipcRenderer.invoke("get-pods", contextName, namespace),

  listFiles: (
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    dirPath: string
  ): Promise<FileEntry[]> =>
    ipcRenderer.invoke(
      "list-files",
      contextName,
      namespace,
      podName,
      containerName,
      dirPath
    ),

  showSaveDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke("show-save-dialog", defaultName),

  downloadFile: (
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    sourcePath: string,
    destPath: string
  ): Promise<void> =>
    ipcRenderer.invoke(
      "download-file",
      contextName,
      namespace,
      podName,
      containerName,
      sourcePath,
      destPath
    ),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
