# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

K8sDownloader is an Electron + React + TypeScript desktop app that lets non-Kubernetes-savvy users pick a kubeconfig context, browse namespaces/pods, and download files from a pod's filesystem through a file-explorer-like UI. It uses `kubectl` (must be on `PATH`) under the hood — there is no direct Kubernetes API client for file operations.

## Commands

```bash
pnpm install          # install deps (pnpm required, see packageManager in package.json)
pnpm electron:dev      # run app in dev mode (Vite + Electron, hot reload)
pnpm test              # run all tests once (vitest run)
pnpm test:watch        # run tests in watch mode
pnpm build             # generate THIRD-PARTY-LICENSES.txt, tsc -b, vite build
pnpm electron:build    # full build + electron-builder (outputs to release/)
```

Run a single test file: `pnpm vitest run src/utils/kubeconfig.test.ts` (or `pnpm vitest run -t "test name"` to filter by name).

Platform-specific packaging: `pnpm electron:build --win|--mac|--linux` (win → NSIS `.exe`, mac → `.dmg`, linux → `.AppImage`/`.deb`).

## Architecture

**Two processes, one security boundary.** Electron's main process (`electron/`) is the only place that ever shells out to `kubectl`; the renderer (`src/`) never executes commands directly and talks to main only through the `preload.ts` bridge (context isolation enabled, `nodeIntegration: false`).

- `electron/main.ts` — window creation, all `ipcMain.handle(...)` registrations, logger init.
- `electron/kubernetes.ts` — every Kubernetes/kubectl operation (`getContexts`, `getNamespaces`, `getPods`, `listFiles`, `downloadFile`). Every function here validates its inputs via `validateKubernetesIdentifier`/`sanitizeContainerPath` (from `src/utils/kubeconfig.ts`) *before* building `kubectl` args — this is the app's core security control, since a malformed context/namespace/pod/container name or a traversal-style path (`../etc/passwd`) must never reach `spawnSync`.
- `electron/preload.ts` — exposes the typed IPC surface to the renderer.
- File listing/download tries Linux tooling first (`ls -la`, then `find -printf` and `busybox ls` for minimal Linux images without `ls`; `cat`, then `tar -cf -` for download) and falls back to Windows (`cmd /c dir`, `cmd /c type`) so both container OS families work; `downloadFile` uses `encoding: "buffer"` for binary safety. Distroless/scratch containers (e.g. CoreDNS) have no shell utilities and cannot be browsed or downloaded from.
- IPC channels are documented in README.md ("IPC Channels" table) — keep that table in sync when adding/changing a channel.

**Renderer is feature-sliced** under `src/features/<feature>/{components,hooks,types}` (contexts, namespaces, pods, filesystem, ui). Cross-feature code lives in `src/shared/` (types, constants, utils) and `src/services/kubernetesService.ts` (the only thing components should call — it wraps the raw Electron API and normalizes errors into `AppError`/`ErrorCode`). Do not call `window.electronAPI` directly from components; go through `KubernetesService`.

**State** is centralized in two Zustand stores (`src/stores/kubeStore.ts` for all Kubernetes-derived state — contexts/namespaces/pods/files/navigation/global error; `src/stores/uiStore.ts` for theme). Selecting a context/namespace cascades: it clears downstream state (namespaces→pods→files) before refetching.

**Path aliases** (defined in both `vite.config.ts` and `tsconfig.json`, must stay in sync): `@` → `src`, `@shared` → `src/shared`, `@features` → `src/features`, `@services` → `src/services`, `@stores` → `src/stores`, `@types` → `src/shared/types`.

**Error handling**: `AppError` + `ErrorCode` enum flows from the service layer → Zustand store's global error slice → the app-wide `ErrorDialog`. Top-level feature components are wrapped in `ErrorBoundary` for render-error recovery.

**Tests** live alongside the code they test (`*.test.ts(x)`), using Vitest + jsdom + React Testing Library (`src/test-setup.ts`). `electron/kubernetes.test.ts` and `src/utils/kubeconfig.test.ts`/`kubectl.test.ts` cover the security-critical validation/sanitization logic — extend these when touching identifier validation or path handling rather than adding ad hoc checks elsewhere.

## Notes

- Windows dev cache: `.electron-cache/` is used as Electron's `userData` dir in dev to dodge Windows file-lock issues; Vite's watcher explicitly ignores it.
- The app writes a fresh `output.log` on every start (`electron/logger.ts` patches `console.log`/`console.error`).
- `requirements.md` and `tasks.md` track product requirements and a running task backlog — check them for current priorities before starting new work, and update `tasks.md` as work completes.
- README.md is the canonical, actively maintained architecture/feature doc — update it when architecture or features change, per the project's own development rules.
