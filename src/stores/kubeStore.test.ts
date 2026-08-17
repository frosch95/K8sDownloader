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

const multiContainerPod: PodInfo = {
  name: "web-abc",
  namespace: "default",
  status: "Running",
  containers: ["app", "sidecar"],
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
      selectedContainer: "nginx",
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

describe("kubeStore.selectPod", () => {
  beforeEach(() => {
    vi.mocked(KubernetesService.listFiles).mockReset();
    vi.mocked(KubernetesService.listFiles).mockResolvedValue([]);
    useKubeStore.setState({
      selectedContext: "prod-cluster",
      selectedNamespace: "default",
      selectedPod: null,
      selectedContainer: null,
      pods: [],
    });
  });

  it("defaults the selected container to the pod's first container", () => {
    useKubeStore.getState().selectPod(multiContainerPod);

    const state = useKubeStore.getState();
    expect(state.selectedPod).toEqual(multiContainerPod);
    expect(state.selectedContainer).toBe("app");
    expect(KubernetesService.listFiles).toHaveBeenCalledWith(
      "prod-cluster",
      "default",
      "web-abc",
      "app",
      "/"
    );
  });

  it("sets the selected container to null when the pod has no containers", () => {
    useKubeStore.getState().selectPod({ ...samplePod, containers: [] });

    expect(useKubeStore.getState().selectedContainer).toBeNull();
  });
});

describe("kubeStore.selectContainer", () => {
  beforeEach(() => {
    vi.mocked(KubernetesService.listFiles).mockReset();
    vi.mocked(KubernetesService.listFiles).mockResolvedValue([]);
    useKubeStore.setState({
      selectedContext: "prod-cluster",
      selectedNamespace: "default",
      selectedPod: multiContainerPod,
      selectedContainer: "app",
      currentPath: "/src",
      files: initialFiles,
      navigationHistory: ["/"],
      navigationFuture: ["/tmp"],
    });
  });

  it("switches the selected container and reloads the root directory", () => {
    useKubeStore.getState().selectContainer("sidecar");

    const state = useKubeStore.getState();
    expect(state.selectedContainer).toBe("sidecar");
    expect(state.currentPath).toBe("/");
    expect(state.navigationHistory).toEqual([]);
    expect(state.navigationFuture).toEqual([]);
    expect(KubernetesService.listFiles).toHaveBeenCalledWith(
      "prod-cluster",
      "default",
      "web-abc",
      "sidecar",
      "/"
    );
  });
});
