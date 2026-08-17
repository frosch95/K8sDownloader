import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePodDetails } from "./usePodDetails";
import { KubernetesService } from "../../../services/kubernetesService";
import type { PodDetails } from "../../../shared/types/kubernetes";

vi.mock("../../../services/kubernetesService", () => ({
  KubernetesService: {
    getPodDetails: vi.fn(),
  },
}));

const sampleDetails: PodDetails = {
  name: "nginx-abc",
  namespace: "default",
  status: "Running",
  node: "worker-1",
  podIP: "10.0.0.5",
  createdAt: "2026-08-01T10:00:00Z",
  startedAt: "2026-08-01T10:00:05Z",
  managedBy: "Deployment/nginx",
  containers: [
    { name: "nginx", image: "nginx:1.25", ready: true, restartCount: 0, state: "Running" },
  ],
};

describe("usePodDetails", () => {
  beforeEach(() => {
    vi.mocked(KubernetesService.getPodDetails).mockReset();
  });

  it("starts closed with no details", () => {
    const { result } = renderHook(() => usePodDetails());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.details).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("opens, loads, and stores the fetched pod details", async () => {
    vi.mocked(KubernetesService.getPodDetails).mockResolvedValue(sampleDetails);
    const { result } = renderHook(() => usePodDetails());

    act(() => {
      result.current.open("prod-cluster", "default", "nginx-abc");
    });

    expect(result.current.isOpen).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(KubernetesService.getPodDetails).toHaveBeenCalledWith(
      "prod-cluster",
      "default",
      "nginx-abc"
    );
    expect(result.current.details).toEqual(sampleDetails);
    expect(result.current.error).toBeNull();
  });

  it("stores an error message and clears details when the fetch fails", async () => {
    vi.mocked(KubernetesService.getPodDetails).mockRejectedValue(new Error("kubectl failed: boom"));
    const { result } = renderHook(() => usePodDetails());

    act(() => {
      result.current.open("prod-cluster", "default", "nginx-abc");
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.details).toBeNull();
    expect(result.current.error).toContain("boom");
  });

  it("close hides the overlay", () => {
    const { result } = renderHook(() => usePodDetails());

    act(() => {
      result.current.open("prod-cluster", "default", "nginx-abc");
    });
    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });
});
