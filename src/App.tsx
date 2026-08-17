import { useCallback, useEffect, useRef, useState } from "react";
import { ContextSelector } from "./features/contexts/components/ContextSelector";
import { NamespaceSelector } from "./features/namespaces/components/NamespaceSelector";
import { PodSelector } from "./features/pods/components/PodSelector";
import { ContainerSelector } from "./features/containers/components/ContainerSelector";
import { FileExplorer } from "./features/filesystem/components/FileExplorer";
import { ErrorBoundary } from "./features/ui/components/ErrorBoundary";
import { ErrorDialog } from "./features/ui/components/ErrorDialog";
import { ThemeSelector } from "./features/ui/components/ThemeSelector";
import { PodDetailsOverlay } from "./features/pods/components/PodDetailsOverlay";
import { useContexts } from "./features/contexts/hooks/useContexts";
import { useNamespaces } from "./features/namespaces/hooks/useNamespaces";
import { usePods } from "./features/pods/hooks/usePods";
import { usePodDetails } from "./features/pods/hooks/usePodDetails";
import { useContainers } from "./features/containers/hooks/useContainers";
import { useFileSystem } from "./features/filesystem/hooks/useFileSystem";
import { useTheme } from "./features/ui/hooks/useTheme";
import { useKubeStore } from "./stores/kubeStore";
import { AppError, ErrorCode } from "./shared/types/errors";
import type { PodInfo } from "./shared/types/kubernetes";

import { UI, APP } from "./shared/constants";
import k8sIcon from "/icon.svg";

const { SIDEBAR_MIN, SIDEBAR_MAX, SIDEBAR_DEFAULT } = UI;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);

  const theme = useTheme();
  const ctx = useContexts();
  const ns = useNamespaces();
  const pods = usePods();
  const containers = useContainers();
  const podDetails = usePodDetails();
  const fs = useFileSystem();
  const { globalError, clearGlobalError } = useKubeStore();

  // Extract stable callbacks
  const { setError: nsSetError } = ns;
  const { setSelected: podsSetSelected, setError: podsSetError } = pods;
  const { navigateTo: fsNavigateTo, refresh: fsRefresh, setError: fsSetError, reset: fsReset } = fs;
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
  // Namespace/pod loading is triggered by the store itself (selectContext →
  // loadNamespaces, selectNamespace → loadPods, and the startup restoration
  // chain in loadContexts/loadNamespaces), so no effects are needed here —
  // adding them would just cause duplicate loads.

  const handlePodSelect = useCallback(
    (pod: PodInfo) => {
      podsSetSelected(pod);
      fsReset();
      if (ctx.selected && ns.selected) {
        const container = useKubeStore.getState().selectedContainer;
        fsNavigateTo(ctx.selected, ns.selected, pod.name, container, "/");
      }
    },
    [ctx.selected, ns.selected, podsSetSelected, fsReset, fsNavigateTo]
  );

  const handleNavigate = useCallback(
    (dirPath: string) => {
      if (ctx.selected && ns.selected && pods.selected) {
        fsNavigateTo(ctx.selected, ns.selected, pods.selected.name, containers.selected, dirPath);
      }
    },
    [ctx.selected, ns.selected, pods.selected, containers.selected, fsNavigateTo]
  );

  const handleBack = useCallback(
    (dirPath: string) => { handleNavigate(dirPath); },
    [handleNavigate]
  );

  const handleShowPodInfo = useCallback(() => {
    if (ctx.selected && ns.selected && pods.selected) {
      podDetails.open(ctx.selected, ns.selected, pods.selected.name);
    }
  }, [ctx.selected, ns.selected, pods.selected, podDetails.open]);

  const dismissError = useCallback(() => {
    clearGlobalError();
    ctxSetError();
    nsSetError();
    podsSetError();
    fsSetError();
  }, [clearGlobalError, ctxSetError, nsSetError, podsSetError, fsSetError]);

  const handleOpenLicenses = useCallback(async () => {
    const result = await window.electronAPI?.openThirdPartyLicenses();
    if (result && !result.success) {
      useKubeStore.getState().setGlobalError(
        new AppError(ErrorCode.UNKNOWN_ERROR, result.error)
      );
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-k8s-darker">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-gradient-header border-b border-k8s-border shadow-soft">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={k8sIcon} alt="Kubernetes" className="w-12 h-12 relative z-10" />
            <div className="absolute inset-0 bg-gradient-accent opacity-10 blur-xl rounded-full" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-k8s-text tracking-tight">
              K8sDownloader
            </h1>
            <p className="text-[11px] text-k8s-muted/60 -mt-0.5">
              File Browser for Kubernetes
            </p>
          </div>
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
          className="shrink-0 border-r border-k8s-border bg-gradient-sidebar flex flex-col relative"
          style={{ width: sidebarWidth }}
        >
          <div className="p-4 space-y-5 flex-1 min-h-0 overflow-y-auto">
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
                onRefresh={ns.reload}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <PodSelector
                pods={pods.pods}
                selected={pods.selected}
                loading={pods.loading}
                disabled={!ns.selected}
                onSelect={handlePodSelect}
                onRefresh={pods.reload}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <ContainerSelector
                containers={containers.containers}
                selected={containers.selected}
                onSelect={containers.setSelected}
              />
            </ErrorBoundary>
          </div>

          <div className="shrink-0 px-4 py-3 border-t border-k8s-border bg-k8s-surface/30">
            <p className="text-[11px] text-k8s-muted/60 text-center">
              MIT License | &copy; 2026 | v{APP.VERSION}
              <button
                onClick={handleOpenLicenses}
                className="ml-2 underline hover:text-k8s-accent transition-colors cursor-pointer"
                title="View third-party licenses"
              >
                Licenses
              </button>
            </p>
          </div>

          {/* Drag handle */}
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize
                       hover:bg-gradient-accent/50 active:bg-gradient-accent transition-colors"
            onMouseDown={handleDragStart}
          />
        </aside>

        {/* File explorer area */}
        <main className="flex-1 flex flex-col min-w-0 bg-k8s-darker">
          <ErrorBoundary>
            <FileExplorer
              files={fs.files}
              currentPath={fs.currentPath}
              loading={fs.loading}
              disabled={!pods.selected || !ctx.selected || !ns.selected}
              contextName={ctx.selected}
              namespace={ns.selected}
              podName={pods.selected?.name ?? ""}
              containerName={containers.selected}
              onNavigate={handleNavigate}
              onBack={handleBack}
              onRefresh={fsRefresh}
              onShowPodInfo={handleShowPodInfo}
              onError={(message) => useKubeStore.getState().setGlobalError(new AppError(ErrorCode.UNKNOWN_ERROR, message))}
            />
          </ErrorBoundary>
        </main>
      </div>

      <PodDetailsOverlay
        isOpen={podDetails.isOpen}
        podName={pods.selected?.name ?? null}
        details={podDetails.details}
        loading={podDetails.loading}
        error={podDetails.error}
        onClose={podDetails.close}
      />
      <ErrorDialog message={globalError?.message || ''} onClose={dismissError} />
    </div>
  );
}

export default App;
