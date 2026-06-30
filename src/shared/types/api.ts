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

export type ConnectionStep = "context" | "namespace" | "pod" | "browse";