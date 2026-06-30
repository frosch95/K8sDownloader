export interface ContextInfo {
  name: string;
  cluster: string;
  user: string;
  isCurrent?: boolean;  // Add useful metadata
}

export interface NamespaceInfo {
  name: string;
  status?: string;  // Add phase status
  creationTimestamp?: string;
}

export interface PodInfo {
  name: string;
  namespace: string;
  status: PodPhase;
  containers: string[];
  node?: string;
  creationTimestamp?: string;
  restartCount?: number;
}

export type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: string;
  permissions?: string;  // For Linux files
  owner?: string;       // For Linux files
  group?: string;       // For Linux files
}