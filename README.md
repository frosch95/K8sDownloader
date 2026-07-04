<img src="public/icon.svg" width="160" alt="Icon">

# k8s Downloader

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.3-blue.svg)](https://github.com/frosch95/k8sdownloader/releases)
[![Electron](https://img.shields.io/badge/electron-39.8.5-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/react-19.0.0-blue.svg)](https://reactjs.org/)

**Desktop app to browse and download files from Kubernetes pods**

## Features

✅ **Kubernetes Context Management** - View and switch between multiple kubeconfig contexts

✅ **Namespace Browsing** - Explore all namespaces in your cluster

✅ **Pod Selection** - View pods and their status with color-coded badges

✅ **File System Navigation** - Browse pod file systems with breadcrumb navigation

✅ **File Download** - Download individual files from pods

✅ **Dark/Light Mode** - Toggle between themes with localStorage persistence

✅ **Responsive Design** - Works on different screen sizes

✅ **Cross-Platform** - Supports Linux and Windows pods

✅ **Error Handling** - Comprehensive error boundaries and user-friendly messages

✅ **Performance Optimized** - Memoized components and debounced inputs

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Context Selection** | Pick any Kubernetes context from your local kubeconfig |
| 2 | **Namespace Browser** | View and select namespaces available in the cluster |
| 3 | **Pod Browser** | List pods with status badges (Running / Pending / Failed) and search filter |
| 4 | **File Explorer** | Browse the filesystem of any pod container with a directory table |
| 5 | **Filesystem Navigation** | Breadcrumb bar, double-click directories, back-button — familiar explorer UX |
| 6 | **File Download** | Download files via native save dialog using `kubectl exec cat` (Linux) / `cmd /c type` (Windows) — binary-safe |
| 7 | **Error Dialog** | Centralized modal error display (press Esc to dismiss) |
| 8 | **Cross-Platform Pods** | File listing and download work on both Linux and Windows containers — automatic fallback |
| 9 | **Resizable Sidebar** | Drag the sidebar edge to resize (200–500px) for better readability |
| 10 | **Dark/Light Mode** | Toggle between dark and light themes — preference persisted in localStorage |
| 11 | **Error Boundaries** | Graceful render-error recovery per component with "Try Again" fallback UI |
| 12 | **Architecture Improvements** | Feature-based organization, Zustand state management, service layer abstraction |

## Architecture Highlights

📦 **Feature-based Organization** - Vertical slices for better maintainability
🧠 **Zustand State Management** - Centralized state with no prop drilling
🔧 **Service Layer** - Clean abstraction over Electron API calls
📝 **Shared Types** - Centralized TypeScript types
🚀 **Performance Optimized** - Memoization, debouncing, code splitting

For detailed architecture information, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Key Technologies

- **Electron** - Cross-platform desktop framework
- **React 19** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Zustand** - Lightweight state management
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Fast unit testing
- **React Testing Library** - Component testing

### IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|-----------|---------|
| `get-contexts` | main → renderer | — | `ContextInfo[]` |
| `get-namespaces` | main → renderer | `contextName` | `NamespaceInfo[]` |
| `get-pods` | main → renderer | `contextName, namespace` | `PodInfo[]` |
| `list-files` | main → renderer | `contextName, namespace, podName, containerName?, path` | `FileEntry[]` ← Linux: `ls -la`, Windows: `cmd /c dir` |
| `show-save-dialog` | main → renderer | `defaultName` | `string \| null` |
| `download-file` | main → renderer | `contextName, namespace, podName, containerName?, sourcePath, destPath` | `void` ← Linux: `cat`, Windows: `cmd /c type` |

## Prerequisites

- **Node.js** ≥ 20
- **PNPM** ≥ 9 (`npm install -g pnpm`)
- **kubectl** — installed and on PATH
- **A valid kubeconfig** — default `~/.kube/config` or set `KUBECONFIG` env var

## Security Hardening

The application validates user-controlled Kubernetes identifiers and container paths before any kubectl command is executed. This blocks traversal-style paths such as `/var/log/../etc/passwd` and rejects malformed context, namespace, pod, or container names.

The Electron main process keeps sandboxing enabled for the browser window, and renderer code never communicates with kubectl directly. In addition, the renderer uses a safe fallback bridge for Electron API access so the app does not crash when the preload API is unavailable outside a native Electron runtime.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in development mode (hot-reload)
pnpm electron:dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## Build & Release

```bash
# Build for current platform
pnpm electron:build
```

Output appears in the `release/` directory.

### Platform-Specific Builds

#### Windows
```bash
pnpm electron:build --win
```
Output: NSIS installer (`.exe`)

#### macOS
```bash
pnpm electron:build --mac
```
Output: DMG disk image (`.dmg`)

#### Linux
```bash
pnpm electron:build --linux
```
Output: AppImage (`.AppImage`) and Debian package (`.deb`)

## New Project Structure (Improved Architecture)

```
src/
├── app/                    # Application shell
│   └── layout/              # Main layout components
├── features/              # Feature-based organization
│   ├── contexts/          # Context selection feature
│   │   ├── components/     # ContextSelector component
│   │   ├── hooks/          # useContexts hook
│   │   └── types/          # Feature-specific types
│   ├── namespaces/        # Namespace selection feature
│   │   ├── components/     # NamespaceSelector component
│   │   ├── hooks/          # useNamespaces hook
│   │   └── types/          # Feature-specific types
│   ├── pods/              # Pod selection feature
│   │   ├── components/     # PodSelector component
│   │   ├── hooks/          # usePods hook
│   │   └── types/          # Feature-specific types
│   ├── filesystem/        # File system browsing feature
│   │   ├── components/     # FileExplorer, FileRow components
│   │   ├── hooks/          # useFileSystem hook
│   │   └── utils/          # File system utilities
│   └── ui/                # Shared UI components
│       ├── components/     # Button, Input, Select, etc.
│       ├── hooks/          # useTheme hook
│       └── types/          # UI-specific types
├── shared/               # Shared code
│   ├── types/             # Centralized TypeScript types
│   │   ├── kubernetes.ts  # Kubernetes-related types
│   │   ├── api.ts          # API-related types
│   │   ├── errors.ts       # Error handling types
│   │   └── index.ts        # Type re-exports
│   ├── constants/         # Shared constants
│   │   └── index.ts        # UI constants, timeouts, etc.
│   └── utils/             # Utility functions
├── services/             # Service layer
│   └── kubernetesService.ts # Kubernetes service abstraction
├── stores/               # State management
│   ├── kubeStore.ts       # Centralized Kubernetes state
│   └── uiStore.ts         # UI state management
└── main.tsx              # Entry point

electron/
├── main.ts               # Electron main process
├── preload.ts            # Preload script with type safety
└── kubernetes.ts         # Kubernetes operations
```

## State Management

The application uses **Zustand** for centralized state management:

### KubeStore

Manages all Kubernetes-related state:
- Contexts (loading, error, selected)
- Namespaces (loading, error, selected)
- Pods (loading, error, selected)
- File system (files, navigation history, loading, error)
- Global error handling

### UIStore

Manages UI-related state:
- Theme (light/dark/system)
- Theme persistence

## Service Layer

The `KubernetesService` provides a clean interface for all Kubernetes operations:

```typescript
// Example usage
const contexts = await KubernetesService.getContexts();
const namespaces = await KubernetesService.getNamespaces(contextName);
const pods = await KubernetesService.getPods(contextName, namespace);
const files = await KubernetesService.listFiles(contextName, namespace, podName, containerName, dirPath);
await KubernetesService.downloadFile(contextName, namespace, podName, containerName, sourcePath, defaultFileName);
```

## Error Handling

Structured error handling with `AppError` class:

```typescript
export enum ErrorCode {
  KUBECONFIG_NOT_FOUND,
  KUBECTL_NOT_INSTALLED,
  KUBECTL_EXEC_FAILED,
  CONTEXT_NOT_FOUND,
  NAMESPACE_NOT_FOUND,
  POD_NOT_FOUND,
  CONTAINER_NOT_FOUND,
  FILE_NOT_FOUND,
  PERMISSION_DENIED,
  NETWORK_ERROR,
  TIMEOUT,
  UNKNOWN_ERROR,
}
```

## UI Components

Reusable UI components available in `@features/ui/components`:

- **Button** - Primary, secondary, ghost, danger variants
- **Input** - Form input with validation
- **Select** - Dropdown select
- **Badge** - Status indicators
- **Tooltip** - Hover tooltips
- **EmptyState** - Empty state placeholders
- **ProgressBar** - Progress indicators
- **LoadingSpinner** - Loading animations
- **ErrorBoundary** - Error boundaries
- **ErrorDialog** - Global error dialog
- **ThemeToggle** - Theme switcher

## Security

- **Context isolation enabled** — renderer has no direct Node.js access
- **Read-only access** — the app only reads files and downloads them; no write operations to the cluster
- **No credential storage** — reads from the user's existing kubeconfig, does not cache or transmit credentials
- **CSP headers** — Content Security Policy restricts script and style sources

## Architecture Improvements

This version includes significant architecture improvements:

### 1. **Feature-based Organization**
- Restructured codebase into vertical slices (features)
- Each feature is self-contained with components, hooks, and types
- Better separation of concerns and maintainability

### 2. **Centralized State Management**
- Replaced individual React hooks with Zustand stores
- Single source of truth for all application state
- No prop drilling, better performance

### 3. **Service Layer Abstraction**
- Created `KubernetesService` for all Kubernetes operations
- Clean interface for API calls
- Easier to mock and test

### 4. **Shared Types Package**
- Centralized all TypeScript types
- Eliminated type duplication
- Better type safety across the application

### 5. **Structured Error Handling**
- Added `AppError` class with error codes
- Consistent error messages and handling
- Better debugging capabilities

### 6. **Performance Optimizations**
- Added memoization to key components
- Implemented debouncing for search inputs
- Added code splitting for large dependencies
- Created memoized `FileRow` component

### 7. **Reusable UI Components**
- Created comprehensive UI component library
- Consistent styling and behavior
- Better accessibility

### 8. **Improved Build Configuration**
- Added path aliases for easier imports
- Configured source maps for better debugging
- Added manual code splitting
- Improved Vite configuration

## Migration Guide

For developers migrating from the original architecture:

1. **Update imports** to use feature-based paths:
   ```typescript
   // Before
   import { ContextSelector } from "../components/ContextSelector";
   
   // After  
   import { ContextSelector } from "@features/contexts/components/ContextSelector";
   ```

2. **Replace hooks** with store-based approach:
   ```typescript
   // Before
   const ctx = useKubeConfig();
   
   // After
   const ctx = useContexts();
   ```

3. **Use service layer** instead of direct API calls:
   ```typescript
   // Before
   const contexts = await fetchContexts();
   
   // After
   const contexts = await KubernetesService.getContexts();
   ```

## License

MIT
