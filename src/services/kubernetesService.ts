/**
 * Kubernetes Service Layer
 * 
 * Provides a centralized interface for all Kubernetes-related operations.
 * This service abstracts the direct Electron API calls and provides a clean
 * interface for the application to interact with Kubernetes resources.
 */

import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from '../shared/types/kubernetes';
import type { ElectronApiBridge } from '../shared/types/api';
import { AppError } from '../shared/types/errors';
import { sanitizeContainerPath, validateKubernetesIdentifier } from '../utils/kubeconfig';

// Define the Electron API interface for better type safety
declare global {
  interface Window {
    electronAPI?: ElectronApiBridge;
  }
}

export function getElectronApi(): ElectronApiBridge {
  if (typeof window === "undefined" || !window.electronAPI) {
    console.warn("[K8s] electronAPI not available in renderer – using empty fallback");
    return {
      getContexts: async () => [],
      getNamespaces: async () => [],
      getPods: async () => [],
      listFiles: async () => [],
      showSaveDialog: async () => null,
      downloadFile: async () => undefined,
      getThirdPartyLicenses: async () => ({ success: false as const, error: "Not available outside Electron." }),
      openThirdPartyLicenses: async () => ({ success: false as const, error: "Not available outside Electron." }),
    };
  }

  return window.electronAPI;
}

/**
 * Kubernetes Service Class
 * 
 * Centralized service for all Kubernetes operations
 */
export class KubernetesService {
  
  /**
   * Returns the electronAPI, throwing if not available (e.g. running in browser).
   */
  private static get api() {
    return getElectronApi();
  }
  
  /**
   * Fetches all available Kubernetes contexts from the user's kubeconfig
   * 
   * @returns {Promise<ContextInfo[]>} Array of context information
   * @throws {AppError} If kubeconfig is not found or kubectl is not installed
   */
  static async getContexts(): Promise<ContextInfo[]> {
    try {
      return await this.api.getContexts();
    } catch (error) {
      throw AppError.fromError(error);
    }
  }

  /**
   * Fetches all namespaces for a given Kubernetes context
   * 
   * @param {string} contextName - The name of the Kubernetes context
   * @returns {Promise<NamespaceInfo[]>} Array of namespace information
   * @throws {AppError} If the context is not found or kubectl execution fails
   */
  static async getNamespaces(contextName: string): Promise<NamespaceInfo[]> {
    try {
      const safeContextName = validateKubernetesIdentifier(contextName, 'Context name', {
        allowUppercase: true,
      });
      return await this.api.getNamespaces(safeContextName);
    } catch (error) {
      throw AppError.fromError(error);
    }
  }

  /**
   * Fetches all pods for a given context and namespace
   * 
   * @param {string} contextName - The name of the Kubernetes context
   * @param {string} namespace - The namespace to query
   * @returns {Promise<PodInfo[]>} Array of pod information
   * @throws {AppError} If the context or namespace is not found, or kubectl execution fails
   */
  static async getPods(
    contextName: string,
    namespace: string
  ): Promise<PodInfo[]> {
    try {
      const safeContextName = validateKubernetesIdentifier(contextName, 'Context name', {
        allowUppercase: true,
      });
      const safeNamespace = validateKubernetesIdentifier(namespace, 'Namespace');
      return await this.api.getPods(safeContextName, safeNamespace);
    } catch (error) {
      throw AppError.fromError(error);
    }
  }

  /**
   * Lists files in a pod's container
   * 
   * @param {string} contextName - The name of the Kubernetes context
   * @param {string} namespace - The namespace containing the pod
   * @param {string} podName - The name of the pod
   * @param {string | null} containerName - The name of the container (null for first container)
   * @param {string} dirPath - The directory path to list
   * @returns {Promise<FileEntry[]>} Array of file entries
   * @throws {AppError} If any required parameter is missing or kubectl execution fails
   */
  static async listFiles(
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    dirPath: string
  ): Promise<FileEntry[]> {
    try {
      const safeContextName = validateKubernetesIdentifier(contextName, 'Context name', {
        allowUppercase: true,
      });
      const safeNamespace = validateKubernetesIdentifier(namespace, 'Namespace');
      const safePodName = validateKubernetesIdentifier(podName, 'Pod name');
      const safeContainerName = containerName
        ? validateKubernetesIdentifier(containerName, 'Container name')
        : null;
      const safeDirPath = sanitizeContainerPath(dirPath);
      return await this.api.listFiles(
        safeContextName,
        safeNamespace,
        safePodName,
        safeContainerName,
        safeDirPath
      );
    } catch (error) {
      throw AppError.fromError(error);
    }
  }

  /**
   * Downloads a file from a pod's container
   * 
   * @param {string} contextName - The name of the Kubernetes context
   * @param {string} namespace - The namespace containing the pod
   * @param {string} podName - The name of the pod
   * @param {string | null} containerName - The name of the container (null for first container)
   * @param {string} sourcePath - The source file path in the container
   * @param {string} defaultFileName - The default filename for the save dialog
   * @returns {Promise<void>}
   * @throws {AppError} If any required parameter is missing or the download fails
   */
  static async downloadFile(
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    sourcePath: string,
    defaultFileName: string
  ): Promise<void> {
    try {
      const safeContextName = validateKubernetesIdentifier(contextName, 'Context name', {
        allowUppercase: true,
      });
      const safeNamespace = validateKubernetesIdentifier(namespace, 'Namespace');
      const safePodName = validateKubernetesIdentifier(podName, 'Pod name');
      const safeSourcePath = sanitizeContainerPath(sourcePath);

      const destPath = await this.api.showSaveDialog(defaultFileName);
      if (!destPath) {
        // User cancelled the save dialog
        return;
      }

      await this.api.downloadFile(
        safeContextName,
        safeNamespace,
        safePodName,
        containerName ? validateKubernetesIdentifier(containerName, 'Container name') : null,
        safeSourcePath,
        destPath
      );
    } catch (error) {
      throw AppError.fromError(error);
    }
  }
}