import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNamespaces } from "./useNamespaces";
import { useKubeStore } from "../../../stores/kubeStore";
import { KubernetesService } from "../../../services/kubernetesService";

vi.mock("../../../services/kubernetesService", () => ({
  KubernetesService: {
    getNamespaces: vi.fn(),
  },
}));

describe("useNamespaces.reload", () => {
  beforeEach(() => {
    vi.mocked(KubernetesService.getNamespaces).mockReset();
    vi.mocked(KubernetesService.getNamespaces).mockResolvedValue([]);
    useKubeStore.setState({
      selectedContext: null,
      namespaces: [],
      selectedNamespace: null,
      namespacesLoading: false,
      namespacesError: null,
    });
  });

  it("does nothing when no context is selected", () => {
    const { result } = renderHook(() => useNamespaces());

    act(() => {
      result.current.reload();
    });

    expect(KubernetesService.getNamespaces).not.toHaveBeenCalled();
  });

  it("reloads namespaces for the currently selected context", () => {
    useKubeStore.setState({ selectedContext: "prod-cluster" });
    const { result } = renderHook(() => useNamespaces());

    act(() => {
      result.current.reload();
    });

    expect(KubernetesService.getNamespaces).toHaveBeenCalledWith("prod-cluster");
  });
});
