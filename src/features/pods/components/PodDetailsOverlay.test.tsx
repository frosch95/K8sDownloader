import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PodDetailsOverlay } from "./PodDetailsOverlay";
import type { PodDetails } from "../../../shared/types/kubernetes";

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
    { name: "sidecar", image: "envoy:1.28", ready: false, restartCount: 3, state: "Waiting: CrashLoopBackOff" },
  ],
};

describe("PodDetailsOverlay", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <PodDetailsOverlay
        isOpen={false}
        podName="nginx-abc"
        details={null}
        loading={false}
        error={null}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading state while fetching", () => {
    render(
      <PodDetailsOverlay
        isOpen={true}
        podName="nginx-abc"
        details={null}
        loading={true}
        error={null}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Loading pod details…")).toBeInTheDocument();
  });

  it("shows an error message when the fetch fails", () => {
    render(
      <PodDetailsOverlay
        isOpen={true}
        podName="nginx-abc"
        details={null}
        loading={false}
        error="kubectl failed: boom"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("kubectl failed: boom")).toBeInTheDocument();
  });

  it("renders pod metadata and containers", () => {
    render(
      <PodDetailsOverlay
        isOpen={true}
        podName="nginx-abc"
        details={sampleDetails}
        loading={false}
        error={null}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("worker-1")).toBeInTheDocument();
    expect(screen.getByText("10.0.0.5")).toBeInTheDocument();
    expect(screen.getByText("Deployment/nginx")).toBeInTheDocument();
    expect(screen.getByText("nginx:1.25")).toBeInTheDocument();
    expect(screen.getByText("Waiting: CrashLoopBackOff")).toBeInTheDocument();
    expect(screen.getByText("3 restarts")).toBeInTheDocument();
  });

  it("calls onClose when the Close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <PodDetailsOverlay
        isOpen={true}
        podName="nginx-abc"
        details={sampleDetails}
        loading={false}
        error={null}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <PodDetailsOverlay
        isOpen={true}
        podName="nginx-abc"
        details={sampleDetails}
        loading={false}
        error={null}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
