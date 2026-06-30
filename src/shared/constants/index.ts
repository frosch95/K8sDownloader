/**
 * Shared Constants
 * 
 * Centralized constants used throughout the application.
 */

// Timeout constants
export const TIMEOUTS = {
  KUBECTL_EXECUTION: 30000, // 30 seconds
  API_REQUEST: 10000, // 10 seconds
  DEBOUNCE_SEARCH: 300, // 300ms
};

// UI constants
export const UI = {
  SIDEBAR_MIN: 200,
  SIDEBAR_MAX: 500,
  SIDEBAR_DEFAULT: 320,
  NAVIGATION_HISTORY_LIMIT: 50,
};

// File system constants
export const FILE_SYSTEM = {
  MAX_FILE_SIZE_DISPLAY: 1024 * 1024 * 100, // 100MB
  DATE_FORMAT: "YYYY-MM-DD HH:mm:ss",
};

// Kubernetes constants
export const K8S = {
  DEFAULT_NAMESPACE: "default",
  MAX_PODS_DISPLAY: 1000,
  MAX_CONTAINERS_PER_POD: 20,
};

// App metadata
export const APP = {
  NAME: "K8sDownloader",
  DESCRIPTION: "Desktop app to browse and download files from Kubernetes pods",
  VERSION: process.env.npm_package_version || "0.0.0",
  BUILD_DATE: new Date().toISOString(),
};