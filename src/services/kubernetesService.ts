/**
 * Kubernetes Service Layer
 * 
 * Provides a centralized interface for all Kubernetes-related operations.
 * This service abstracts the direct Electron API calls and provides a clean
 * interface for the application to interact with Kubernetes resources.
 */

import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from '../shared/types/kubernetes';
import { AppError, ErrorCode } from '../shared/types/errors';

// Define the Electron API interface for better type safety
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
 * Kubernetes Service Class
 * 
 * Centralized service for all Kubernetes operations
 */
export class KubernetesService {
  
  /**
   * Fetches all available Kubernetes contexts from the user's kubeconfig
   * 
   * @returns {Promise<ContextInfo[]>} Array of context information
   * @throws {AppError} If kubeconfig is not found or kubectl is not installed
   */
  static async getContexts(): Promise<ContextInfo[]> {
    try {
      return await window.electronAPI.getContexts();
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
      if (!contextName) {
        throw new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required');
      }
      return await window.electronAPI.getNamespaces(contextName);
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
      if (!contextName) {
        throw new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required');
      }
      if (!namespace) {
        throw new AppError(ErrorCode.NAMESPACE_NOT_FOUND, 'Namespace is required');
      }
      return await window.electronAPI.getPods(contextName, namespace);
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
      if (!contextName) {
        throw new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required');
      }
      if (!namespace) {
        throw new AppError(ErrorCode.NAMESPACE_NOT_FOUND, 'Namespace is required');
      }
      if (!podName) {
        throw new AppError(ErrorCode.POD_NOT_FOUND, 'Pod name is required');
      }
      return await window.electronAPI.listFiles(
        contextName,
        namespace,
        podName,
        containerName,
        dirPath
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
      if (!contextName) {
        throw new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required');
      }
      if (!namespace) {
        throw new AppError(ErrorCode.NAMESPACE_NOT_FOUND, 'Namespace is required');
      }
      if (!podName) {
        throw new AppError(ErrorCode.POD_NOT_FOUND, 'Pod name is required');
      }
      if (!sourcePath) {
        throw new AppError(ErrorCode.FILE_NOT_FOUND, 'Source path is required');
      }

      const destPath = await window.electronAPI.showSaveDialog(defaultFileName);
      if (!destPath) {
        // User cancelled the save dialog
        return;
      }

      await window.electronAPI.downloadFile(
        contextName,
        namespace,
        podName,
        containerName,
        sourcePath,
        destPath
      );
    } catch (error) {
      throw AppError.fromError(error);
    }
  }
}