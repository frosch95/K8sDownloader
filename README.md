# ☸️ K8sDownloader

A desktop application to browse and download files from Kubernetes pods — built for users not familiar with `kubectl` who need a simple file-browser experience.

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

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Electron Shell                       │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │   Renderer Process   │  │    Main Process         │ │
│  │   (React 19 + TS)    │  │    (Node.js)            │ │
│  │                      │  │                         │ │
│  │  ContextSelector     │  │  get-contexts           │ │
│  │  NamespaceSelector   │  │  get-namespaces         │ │
│  │  PodSelector         │  │  get-pods               │ │
│  │  FileExplorer        │  │  list-files             │ │
│  │  ErrorDialog         │  │  download-file          │ │
│  └──────────┬───────────┘  └───────────┬─────────────┘ │
│             │  contextBridge            │               │
│             └───────────────────────────┘               │
└───────────────────────────────────────────────────────┘
                        │
              ┌──  kubectl CLI      │
              │  (spawnSync, no     │
              │   shell escaping)   │
              │  + kubectl CLI     │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │  Kubernetes API    │
              └───────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 33 |
| Frontend | React 19, TypeScript 5 |
| Styling | Tailwind CSS 3 (dark mode) |
| Build | Vite 6 + vite-plugin-electron |
| Package Manager | PNPM |
| Testing | Vitest + @testing-library/react (104 tests across 10 files) |
| Linting | ESLint + TypeScript plugin |
| K8s API | kubectl CLI (spawnSync) |

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

## Project Structure

```
k8sdownloader/
├── index.html                    # Vite entry HTML
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config (renderer)
├── tsconfig.node.json            # TypeScript config (main + Vite)
├── vite.config.ts                # Vite + electron plugins
├── tailwind.config.js            # Tailwind theme (dark mode)
├── postcss.config.js             # PostCSS for Tailwind
├── .eslintrc.json                # ESLint configuration
├── .gitignore
├── README.md
├── requirements.md               # Project requirements
├── tasks.md                      # Task backlog
│
├── electron/                     # Electron main process
│   ├── main.ts                   # App entry, window creation, IPC
│   ├── preload.ts                # contextBridge API exposure
│   └── kubernetes.ts             # K8s API calls (all via kubectl CLI)
│
└── src/                          # React renderer
    ├── main.tsx                  # React entry point
    ├── App.tsx                   # Root component
    ├── index.css                 # Global styles + Tailwind
    ├── vite-env.d.ts
    ├── test-setup.ts
    ├── components/
    │   ├── ContextSelector.tsx   # K8s context dropdown
    │   ├── ContextSelector.test.tsx
    │   ├── NamespaceSelector.tsx # Namespace dropdown
    │   ├── NamespaceSelector.test.tsx
    │   ├── PodSelector.tsx       # Pod list + search + status
    │   ├── PodSelector.test.tsx
    │   ├── FileExplorer.tsx      # File table + breadcrumbs + download
    │   ├── FileExplorer.test.tsx
    │   ├── ErrorDialog.tsx       # Modal error overlay
    │   ├── ErrorDialog.test.tsx
    │   ├── ErrorBoundary.tsx     # React error boundary with fallback UI
    │   ├── ErrorBoundary.test.tsx
    │   ├── ThemeToggle.tsx       # Dark/light mode toggle button
    │   └── ThemeToggle.test.tsx
    ├── hooks/
    │   ├── useKubeConfig.ts      # Context loading state
    │   ├── useNamespaces.ts      # Namespace loading state
    │   ├── usePods.ts            # Pod loading state
    │   ├── useFileSystem.ts      # File navigation state
    │   ├── useTheme.ts           # Dark/light theme with localStorage persistence
    │   └── useTheme.test.ts      # Theme hook tests
    ├── types/
    │   └── index.ts              # Shared TypeScript interfaces
    └── utils/
        ├── api.ts                # Electron IPC wrappers
        ├── api.test.ts           # API module tests
        ├── kubeconfig.ts         # Formatting, filtering, sorting, ls/dir parsers
        └── kubeconfig.test.ts    # Utility function tests (33 tests)
```

## Security

- **Context isolation enabled** — renderer has no direct Node.js access
- **Read-only access** — the app only reads files and downloads them; no write operations to the cluster
- **No credential storage** — reads from the user's existing kubeconfig, does not cache or transmit credentials
- **CSP headers** — Content Security Policy restricts script and style sources

## License

MIT
