import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePods } from "./usePods";
import { useKubeStore } from "../../../stores/kubeStore";
import { KubernetesService } from "../../../services/kubernetesService";

vi.mock("../../../services/kubernetesService", () => ({
  KubernetesService: {
    getPods: vi.fn(),
  },
}));

describe("usePods.reload", () => {
  beforeEach(() => {
    vi.mocked(KubernetesService.getPods).mockReset();
    vi.mocked(KubernetesService.getPods).mockResolvedValue([]);
    useKubeStore.setState({
      selectedContext: null,
      selectedNamespace: null,
      pods: [],
      selectedPod: null,
      podsLoading: false,
      podsError: null,
    });
  });

  it("does nothing when no context or namespace is selected", () => {
    const { result } = renderHook(() => usePods());

    act(() => {
      result.current.reload();
    });

    expect(KubernetesService.getPods).not.toHaveBeenCalled();
  });

  it("does nothing when only the context is selected", () => {
    useKubeStore.setState({ selectedContext: "prod-cluster", selectedNamespace: null });
    const { result } = renderHook(() => usePods());

    act(() => {
      result.current.reload();
    });

    expect(KubernetesService.getPods).not.toHaveBeenCalled();
  });

  it("reloads pods for the currently selected context and namespace", () => {
    useKubeStore.setState({ selectedContext: "prod-cluster", selectedNamespace: "default" });
    const { result } = renderHook(() => usePods());

    act(() => {
      result.current.reload();
    });

    expect(KubernetesService.getPods).toHaveBeenCalledWith("prod-cluster", "default");
  });
});
