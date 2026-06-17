import { useCallback, useEffect, useRef, useState } from "react";
import { ContextSelector } from "./components/ContextSelector";
import { NamespaceSelector } from "./components/NamespaceSelector";
import { PodSelector } from "./components/PodSelector";
import { FileExplorer } from "./components/FileExplorer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorDialog } from "./components/ErrorDialog";
import { ThemeToggle } from "./components/ThemeToggle";
import { useKubeConfig } from "./hooks/useKubeConfig";
import { useNamespaces } from "./hooks/useNamespaces";
import { usePods } from "./hooks/usePods";
import { useFileSystem } from "./hooks/useFileSystem";
import { useTheme } from "./hooks/useTheme";
import type { PodInfo } from "./types";

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 500;
const SIDEBAR_DEFAULT = 320;

function App() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);

  const theme = useTheme();
  const ctx = useKubeConfig();
  const ns = useNamespaces();
  const pods = usePods();
  const fs = useFileSystem();

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

  useEffect(() => {
    const err = ctx.error || ns.error || pods.error || fs.error;
    if (err) setGlobalError(err);
  }, [ctx.error, ns.error, pods.error, fs.error]);

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
    setGlobalError(null);
    ctxSetError(null);
    nsSetError(null);
    podsSetError(null);
    fsSetError(null);
  }, [ctxSetError, nsSetError, podsSetError, fsSetError]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-k8s-darker">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-k8s-dark border-b border-k8s-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">☸️</span>
          <h1 className="text-lg font-bold text-k8s-text tracking-tight">
            K8sDownloader
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-k8s-muted hidden sm:inline">
            Kubernetes File Browser
          </span>
          <ThemeToggle theme={theme.theme} onToggle={theme.toggle} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside
          className="shrink-0 border-r border-k8s-border bg-k8s-dark flex flex-col relative"
          style={{ width: sidebarWidth }}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
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
              Powered by Electron + React + Kubernetes API
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
              disabled={!pods.selected}
              contextName={ctx.selected}
              namespace={ns.selected}
              podName={pods.selected?.name ?? ""}
              containerName={pods.selected?.containers?.[0] ?? null}
              onNavigate={handleNavigate}
              onBack={handleBack}
              onError={setGlobalError}
            />
          </ErrorBoundary>
        </main>
      </div>

      <ErrorDialog message={globalError} onClose={dismissError} />
    </div>
  );
}

export default App;
