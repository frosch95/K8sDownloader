import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKubeStore } from "./kubeStore";
import { KubernetesService } from "../services/kubernetesService";
import type { FileEntry, PodInfo } from "../shared/types/kubernetes";

vi.mock("../services/kubernetesService", () => ({
  KubernetesService: {
    listFiles: vi.fn(),
  },
}));

const samplePod: PodInfo = {
  name: "nginx-abc",
  namespace: "default",
  status: "Running",
  containers: ["nginx"],
};

const initialFiles: FileEntry[] = [
  { name: "app.js", path: "/src/app.js", isDir: false, size: 10, modified: "now" },
];

const refreshedFiles: FileEntry[] = [
  { name: "app.js", path: "/src/app.js", isDir: false, size: 20, modified: "later" },
  { name: "new.txt", path: "/src/new.txt", isDir: false, size: 5, modified: "later" },
];

describe("kubeStore.refreshFiles", () => {
  beforeEach(() => {
    vi.mocked(KubernetesService.listFiles).mockReset();
    useKubeStore.setState({
      selectedContext: "prod-cluster",
      selectedNamespace: "default",
      selectedPod: samplePod,
      currentPath: "/src",
      files: initialFiles,
      navigationHistory: ["/"],
      navigationFuture: ["/tmp"],
      filesLoading: false,
      filesError: null,
    });
  });

  it("reloads files for the current directory without touching navigation state", async () => {
    vi.mocked(KubernetesService.listFiles).mockResolvedValue(refreshedFiles);

    await useKubeStore.getState().refreshFiles();

    expect(KubernetesService.listFiles).toHaveBeenCalledTimes(1);
    expect(KubernetesService.listFiles).toHaveBeenCalledWith(
      "prod-cluster",
      "default",
      "nginx-abc",
      "nginx",
      "/src"
    );

    const state = useKubeStore.getState();
    expect(state.files).toEqual(refreshedFiles);
    expect(state.currentPath).toBe("/src");
    expect(state.navigationHistory).toEqual(["/"]);
    expect(state.navigationFuture).toEqual(["/tmp"]);
    expect(state.filesLoading).toBe(false);
    expect(state.filesError).toBeNull();
  });

  it("does nothing when no pod is selected", async () => {
    useKubeStore.setState({ selectedPod: null });

    await useKubeStore.getState().refreshFiles();

    expect(KubernetesService.listFiles).not.toHaveBeenCalled();
  });

  it("does nothing when no context or namespace is selected", async () => {
    useKubeStore.setState({ selectedContext: null, selectedNamespace: null });

    await useKubeStore.getState().refreshFiles();

    expect(KubernetesService.listFiles).not.toHaveBeenCalled();
  });

  it("sets an error and preserves navigation state when the reload fails", async () => {
    vi.mocked(KubernetesService.listFiles).mockRejectedValue(new Error("boom"));

    await useKubeStore.getState().refreshFiles();

    const state = useKubeStore.getState();
    expect(state.filesError).not.toBeNull();
    expect(state.globalError).not.toBeNull();
    expect(state.currentPath).toBe("/src");
    expect(state.navigationHistory).toEqual(["/"]);
    expect(state.navigationFuture).toEqual(["/tmp"]);
    expect(state.filesLoading).toBe(false);
  });
});
