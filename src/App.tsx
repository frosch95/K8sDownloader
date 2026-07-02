import { useCallback, useEffect, useRef, useState } from "react";
import { ContextSelector } from "./features/contexts/components/ContextSelector";
import { NamespaceSelector } from "./features/namespaces/components/NamespaceSelector";
import { PodSelector } from "./features/pods/components/PodSelector";
import { FileExplorer } from "./features/filesystem/components/FileExplorer";
import { ErrorBoundary } from "./features/ui/components/ErrorBoundary";
import { ErrorDialog } from "./features/ui/components/ErrorDialog";
import { ThemeSelector } from "./features/ui/components/ThemeSelector";
import { useContexts } from "./features/contexts/hooks/useContexts";
import { useNamespaces } from "./features/namespaces/hooks/useNamespaces";
import { usePods } from "./features/pods/hooks/usePods";
import { useFileSystem } from "./features/filesystem/hooks/useFileSystem";
import { useTheme } from "./features/ui/hooks/useTheme";
import { useKubeStore } from "./stores/kubeStore";
import { AppError, ErrorCode } from "./shared/types/errors";
import type { PodInfo } from "./shared/types/kubernetes";

import { UI } from "./shared/constants";
import k8sIcon from "/icon.svg";

const { SIDEBAR_MIN, SIDEBAR_MAX, SIDEBAR_DEFAULT } = UI;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);

  const theme = useTheme();
  const ctx = useContexts();
  const ns = useNamespaces();
  const pods = usePods();
  const fs = useFileSystem();
  const { globalError, clearGlobalError } = useKubeStore();

  // Extract stable callbacks
  const { load: nsLoad, setError: nsSetError } = ns;
  const { load: podsLoad, setSelected: podsSetSelected, setError: podsSetError } = pods;
  const { navigateTo: fsNavigateTo, setError: fsSetError, reset: fsReset } = fs;
  const { setError: ctxSetError } = ctx;

  // ── Resizable sidebar ──────────────────────────────────────────────────

  const handleDragStart = useCallback(() => {
    dragging.current = true;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const clamped = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
      setSidebarWidth(clamped);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Data loading ───────────────────────────────────────────────────────

  useEffect(() => {
    if (ctx.selected) {
      nsLoad(ctx.selected);
    }
  }, [ctx.selected, nsLoad]);

  useEffect(() => {
    if (ctx.selected && ns.selected) {
      podsLoad(ctx.selected, ns.selected);
    }
  }, [ctx.selected, ns.selected, podsLoad]);

  const handlePodSelect = useCallback(
    (pod: PodInfo) => {
      podsSetSelected(pod);
      fsReset();
      if (ctx.selected && ns.selected) {
        const container = pod.containers.length > 0 ? pod.containers[0] : null;
        fsNavigateTo(ctx.selected, ns.selected, pod.name, container, "/");
      }
    },
    [ctx.selected, ns.selected, podsSetSelected, fsReset, fsNavigateTo]
  );

  const handleNavigate = useCallback(
    (dirPath: string) => {
      if (ctx.selected && ns.selected && pods.selected) {
        const container =
          pods.selected.containers.length > 0
            ? pods.selected.containers[0]
            : null;
        fsNavigateTo(ctx.selected, ns.selected, pods.selected.name, container, dirPath);
      }
    },
    [ctx.selected, ns.selected, pods.selected, fsNavigateTo]
  );

  const handleBack = useCallback(
    (dirPath: string) => { handleNavigate(dirPath); },
    [handleNavigate]
  );

  const dismissError = useCallback(() => {
    clearGlobalError();
    ctxSetError();
    nsSetError();
    podsSetError();
    fsSetError();
  }, [clearGlobalError, ctxSetError, nsSetError, podsSetError, fsSetError]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-k8s-darker">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-k8s-dark border-b border-k8s-border">
        <div className="flex items-center gap-3">
          <img src={k8sIcon} alt="Kubernetes" className="w-12 h-12" />
          <h1 className="text-lg font-bold text-k8s-text tracking-tight">
            k8s Downloader
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-k8s-muted hidden sm:inline">
            Theme:
          </span>
          <ThemeSelector theme={theme.theme} onChange={theme.setTheme} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside
          className="shrink-0 border-r border-k8s-border bg-k8s-dark flex flex-col relative"
          style={{ width: sidebarWidth }}
        >
          <div className="p-4 space-y-5 flex-1 min-h-0">
            <ErrorBoundary>
              <ContextSelector
                contexts={ctx.contexts}
                selected={ctx.selected}
                loading={ctx.loading}
                onSelect={ctx.setSelected}
                onRefresh={ctx.reload}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <NamespaceSelector
                namespaces={ns.namespaces}
                selected={ns.selected}
                loading={ns.loading}
                disabled={!ctx.selected}
                onSelect={ns.setSelected}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <PodSelector
                pods={pods.pods}
                selected={pods.selected}
                loading={pods.loading}
                disabled={!ns.selected}
                onSelect={handlePodSelect}
              />
            </ErrorBoundary>
          </div>

          <div className="shrink-0 px-4 py-3 border-t border-k8s-border">
            <p className="text-[11px] text-k8s-muted/60 text-center">
              MIT License | &copy; 2026
            </p>
          </div>

          {/* Drag handle */}
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize
                       hover:bg-k8s-blue/50 active:bg-k8s-blue transition-colors"
            onMouseDown={handleDragStart}
          />
        </aside>

        {/* File explorer area */}
        <main className="flex-1 flex flex-col min-w-0">
          <ErrorBoundary>
            <FileExplorer
              files={fs.files}
              currentPath={fs.currentPath}
              loading={fs.loading}
              disabled={!pods.selected || !ctx.selected || !ns.selected}
              contextName={ctx.selected}
              namespace={ns.selected}
              podName={pods.selected?.name ?? ""}
              containerName={pods.selected?.containers?.[0] ?? null}
              onNavigate={handleNavigate}
              onBack={handleBack}
              onError={(message) => useKubeStore.getState().setGlobalError(new AppError(ErrorCode.UNKNOWN_ERROR, message))}
            />
          </ErrorBoundary>
        </main>
      </div>

      <ErrorDialog message={globalError?.message || ''} onClose={dismissError} />
    </div>
  );
}

export default App;
