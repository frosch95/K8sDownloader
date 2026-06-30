/**
 * KubeStore - Zustand Store for Kubernetes State Management
 * 
 * Centralized state management for all Kubernetes-related data including contexts,
 * namespaces, pods, and file system navigation. This store replaces the individual
 * React hooks and provides a single source of truth for the application state.
 */

import { create } from 'zustand';
import { KubernetesService } from '../services/kubernetesService';
import type { ContextInfo, NamespaceInfo, PodInfo, FileEntry } from '../shared/types/kubernetes';
import { AppError, ErrorCode } from '../shared/types/errors';

interface KubeState {
  // Contexts state
  contexts: ContextInfo[];
  selectedContext: string | null;
  contextsLoading: boolean;
  contextsError: AppError | null;
  
  // Namespaces state
  namespaces: NamespaceInfo[];
  selectedNamespace: string | null;
  namespacesLoading: boolean;
  namespacesError: AppError | null;
  
  // Pods state
  pods: PodInfo[];
  selectedPod: PodInfo | null;
  podsLoading: boolean;
  podsError: AppError | null;
  
  // File system state
  files: FileEntry[];
  currentPath: string;
  navigationHistory: string[];
  navigationFuture: string[];
  filesLoading: boolean;
  filesError: AppError | null;
  
  // Actions
  loadContexts: () => Promise<void>;
  selectContext: (contextName: string) => void;
  clearContextsError: () => void;
  
  loadNamespaces: (contextName: string) => Promise<void>;
  selectNamespace: (namespace: string) => void;
  clearNamespacesError: () => void;
  
  loadPods: (contextName: string, namespace: string) => Promise<void>;
  selectPod: (pod: PodInfo) => void;
  clearPodsError: () => void;
  
  navigateTo: (
    contextName: string,
    namespace: string,
    podName: string,
    containerName: string | null,
    dirPath: string
  ) => Promise<void>;
  
  navigateBack: () => void;
  navigateForward: () => void;
  clearFilesError: () => void;
  
  resetFileSystem: () => void;
  
  // Global error handling
  globalError: AppError | null;
  setGlobalError: (error: AppError | null) => void;
  clearGlobalError: () => void;
}

export const useKubeStore = create<KubeState>((set, get) => ({
  // Initial state
  contexts: [],
  selectedContext: null,
  contextsLoading: false,
  contextsError: null,
  
  namespaces: [],
  selectedNamespace: null,
  namespacesLoading: false,
  namespacesError: null,
  
  pods: [],
  selectedPod: null,
  podsLoading: false,
  podsError: null,
  
  files: [],
  currentPath: '/',
  navigationHistory: [],
  navigationFuture: [],
  filesLoading: false,
  filesError: null,
  
  globalError: null,
  
  // Context actions
  loadContexts: async () => {
    set({ contextsLoading: true, contextsError: null });
    try {
      const contexts = await KubernetesService.getContexts();
      set({ 
        contexts,
        selectedContext: contexts.length > 0 ? contexts[0].name : null
      });
    } catch (error) {
      const appError = AppError.fromError(error);
      set({ 
        contextsError: appError,
        globalError: appError
      });
    } finally {
      set({ contextsLoading: false });
    }
  },
  
  selectContext: (contextName) => {
    set({ 
      selectedContext: contextName,
      selectedNamespace: null,
      namespaces: [],
      selectedPod: null,
      pods: [],
      files: [],
      currentPath: '/',
      navigationHistory: [],
      navigationFuture: []
    });
    
    // Auto-load namespaces when context is selected
    if (contextName) {
      get().loadNamespaces(contextName);
    }
  },
  
  clearContextsError: () => set({ contextsError: null, globalError: null }),
  
  // Namespace actions
  loadNamespaces: async (contextName) => {
    if (!contextName) {
      set({ namespacesError: new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required') });
      return;
    }
    
    set({ namespacesLoading: true, namespacesError: null });
    try {
      const namespaces = await KubernetesService.getNamespaces(contextName);
      set({ 
        namespaces,
        selectedNamespace: namespaces.length > 0 ? namespaces[0].name : null
      });
    } catch (error) {
      const appError = AppError.fromError(error);
      set({ 
        namespacesError: appError,
        globalError: appError,
        selectedNamespace: null,
        namespaces: []
      });
    } finally {
      set({ namespacesLoading: false });
    }
  },
  
  selectNamespace: (namespace) => {
    const { selectedContext } = get();
    set({ 
      selectedNamespace: namespace,
      selectedPod: null,
      pods: [],
      files: [],
      currentPath: '/',
      navigationHistory: [],
      navigationFuture: []
    });
    
    // Auto-load pods when namespace is selected
    if (selectedContext && namespace) {
      get().loadPods(selectedContext, namespace);
    }
  },
  
  clearNamespacesError: () => set({ namespacesError: null, globalError: null }),
  
  // Pod actions
  loadPods: async (contextName, namespace) => {
    if (!contextName) {
      set({ podsError: new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required') });
      return;
    }
    if (!namespace) {
      set({ podsError: new AppError(ErrorCode.NAMESPACE_NOT_FOUND, 'Namespace is required') });
      return;
    }
    
    set({ podsLoading: true, podsError: null });
    try {
      const pods = await KubernetesService.getPods(contextName, namespace);
      set({ pods });
    } catch (error) {
      const appError = AppError.fromError(error);
      set({ 
        podsError: appError,
        globalError: appError,
        pods: [],
        selectedPod: null
      });
    } finally {
      set({ podsLoading: false });
    }
  },
  
  selectPod: (pod) => {
    const { selectedContext, selectedNamespace } = get();
    set({ selectedPod: pod });
    
    // Auto-navigate to root directory when pod is selected
    if (selectedContext && selectedNamespace && pod) {
      const container = pod.containers.length > 0 ? pod.containers[0] : null;
      get().navigateTo(selectedContext, selectedNamespace, pod.name, container, '/');
    }
  },
  
  clearPodsError: () => set({ podsError: null, globalError: null }),
  
  // File system actions
  navigateTo: async (contextName, namespace, podName, containerName, dirPath) => {
    if (!contextName) {
      set({ filesError: new AppError(ErrorCode.CONTEXT_NOT_FOUND, 'Context name is required') });
      return;
    }
    if (!namespace) {
      set({ filesError: new AppError(ErrorCode.NAMESPACE_NOT_FOUND, 'Namespace is required') });
      return;
    }
    if (!podName) {
      set({ filesError: new AppError(ErrorCode.POD_NOT_FOUND, 'Pod name is required') });
      return;
    }
    
    set({ filesLoading: true, filesError: null });
    try {
      const files = await KubernetesService.listFiles(
        contextName,
        namespace,
        podName,
        containerName,
        dirPath
      );
      
      // Update navigation history
      const { navigationHistory, navigationFuture, currentPath } = get();
      
      set({
        files,
        currentPath: dirPath,
        navigationHistory: [...navigationHistory, currentPath],
        navigationFuture: [] // Clear forward history when navigating to new path
      });
    } catch (error) {
      const appError = AppError.fromError(error);
      set({ 
        filesError: appError,
        globalError: appError,
        files: [],
        currentPath: dirPath
      });
    } finally {
      set({ filesLoading: false });
    }
  },
  
  navigateBack: () => {
    const { navigationHistory, navigationFuture, currentPath } = get();
    
    if (navigationHistory.length === 0) return;
    
    const previousPath = navigationHistory[navigationHistory.length - 1];
    const newHistory = navigationHistory.slice(0, -1);
    
    set({
      navigationHistory: newHistory,
      navigationFuture: [...navigationFuture, currentPath],
      currentPath: previousPath
    });
    
    // Reload files for the previous path
    const { selectedContext, selectedNamespace, selectedPod } = get();
    if (selectedContext && selectedNamespace && selectedPod) {
      const container = selectedPod.containers.length > 0 ? selectedPod.containers[0] : null;
      get().navigateTo(selectedContext, selectedNamespace, selectedPod.name, container, previousPath);
    }
  },
  
  navigateForward: () => {
    const { navigationFuture, navigationHistory, currentPath } = get();
    
    if (navigationFuture.length === 0) return;
    
    const nextPath = navigationFuture[navigationFuture.length - 1];
    const newFuture = navigationFuture.slice(0, -1);
    
    set({
      navigationFuture: newFuture,
      navigationHistory: [...navigationHistory, currentPath],
      currentPath: nextPath
    });
    
    // Reload files for the next path
    const { selectedContext, selectedNamespace, selectedPod } = get();
    if (selectedContext && selectedNamespace && selectedPod) {
      const container = selectedPod.containers.length > 0 ? selectedPod.containers[0] : null;
      get().navigateTo(selectedContext, selectedNamespace, selectedPod.name, container, nextPath);
    }
  },
  
  clearFilesError: () => set({ filesError: null, globalError: null }),
  
  resetFileSystem: () => {
    set({
      files: [],
      currentPath: '/',
      navigationHistory: [],
      navigationFuture: [],
      filesLoading: false,
      filesError: null
    });
  },
  
  // Global error handling
  setGlobalError: (error) => set({ globalError: error }),
  clearGlobalError: () => set({ globalError: null }),
}));

// Initialize the store by loading contexts on creation
export const initializeKubeStore = async () => {
  await useKubeStore.getState().loadContexts();
};