import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContainers } from "./useContainers";
import { useKubeStore } from "../../../stores/kubeStore";
import type { PodInfo } from "../../../shared/types/kubernetes";

const multiContainerPod: PodInfo = {
  name: "web-abc",
  namespace: "default",
  status: "Running",
  containers: ["app", "sidecar"],
};

describe("useContainers", () => {
  beforeEach(() => {
    useKubeStore.setState({
      selectedPod: null,
      selectedContainer: null,
    });
  });

  it("returns an empty container list when no pod is selected", () => {
    const { result } = renderHook(() => useContainers());

    expect(result.current.containers).toEqual([]);
    expect(result.current.selected).toBeNull();
  });

  it("exposes the selected pod's containers and the currently selected container", () => {
    useKubeStore.setState({
      selectedPod: multiContainerPod,
      selectedContainer: "sidecar",
    });

    const { result } = renderHook(() => useContainers());

    expect(result.current.containers).toEqual(["app", "sidecar"]);
    expect(result.current.selected).toBe("sidecar");
  });

  it("setSelected delegates to the store's selectContainer action", () => {
    useKubeStore.setState({ selectedPod: multiContainerPod });
    const { result } = renderHook(() => useContainers());

    result.current.setSelected("app");

    expect(useKubeStore.getState().selectedContainer).toBe("app");
  });
});
