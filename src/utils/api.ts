/**
 * API Utilities
 * 
 * Legacy API functions that now delegate to the KubernetesService.
 * These are kept for backward compatibility during the transition period.
 */

import { KubernetesService } from "../services/kubernetesService";
import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from "../shared/types/kubernetes";

// Re-export the ElectronAPI type from the preload for type safety
declare global {
  interface Window {
    electronAPI: {
      getContexts: () => Promise<ContextInfo[]>;
      getNamespaces: (contextName: string) => Promise<NamespaceInfo[]>;
      getPods: (
        contextName: string,
        namespace: string
      ) => Promise<PodInfo[]>;
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
    };
  }
}

/**
 * Fetches all available Kubernetes contexts
 * 
 * @deprecated Use KubernetesService.getContexts() instead
 * @returns {Promise<ContextInfo[]>} Array of context information
 */
export async function fetchContexts(): Promise<ContextInfo[]> {
  return KubernetesService.getContexts();
}

/**
 * Fetches all namespaces for a given context
 * 
 * @deprecated Use KubernetesService.getNamespaces() instead
 * @param {string} contextName - The name of the Kubernetes context
 * @returns {Promise<NamespaceInfo[]>} Array of namespace information
 */
export async function fetchNamespaces(
  contextName: string
): Promise<NamespaceInfo[]> {
  return KubernetesService.getNamespaces(contextName);
}

/**
 * Fetches all pods for a given context and namespace
 * 
 * @deprecated Use KubernetesService.getPods() instead
 * @param {string} contextName - The name of the Kubernetes context
 * @param {string} namespace - The namespace to query
 * @returns {Promise<PodInfo[]>} Array of pod information
 */
export async function fetchPods(
  contextName: string,
  namespace: string
): Promise<PodInfo[]> {
  return KubernetesService.getPods(contextName, namespace);
}

/**
 * Lists files in a pod's container
 * 
 * @deprecated Use KubernetesService.listFiles() instead
 * @param {string} contextName - The name of the Kubernetes context
 * @param {string} namespace - The namespace containing the pod
 * @param {string} podName - The name of the pod
 * @param {string | null} containerName - The name of the container
 * @param {string} dirPath - The directory path to list
 * @returns {Promise<FileEntry[]>} Array of file entries
 */
export async function fetchFiles(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null,
  dirPath: string
): Promise<FileEntry[]> {
  return KubernetesService.listFiles(
    contextName,
    namespace,
    podName,
    containerName,
    dirPath
  );
}

/**
 * Downloads a file from a pod's container
 * 
 * @deprecated Use KubernetesService.downloadFile() instead
 * @param {string} contextName - The name of the Kubernetes context
 * @param {string} namespace - The namespace containing the pod
 * @param {string} podName - The name of the pod
 * @param {string | null} containerName - The name of the container
 * @param {string} sourcePath - The source file path in the container
 * @param {string} defaultFileName - The default filename for the save dialog
 * @returns {Promise<void>}
 */
export async function saveAndDownload(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string | null,
  sourcePath: string,
  defaultFileName: string
): Promise<void> {
  return KubernetesService.downloadFile(
    contextName,
    namespace,
    podName,
    containerName,
    sourcePath,
    defaultFileName
  );
}
