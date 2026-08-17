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
    {
      name: "nginx",
      image: "nginx:1.25",
      ready: true,
      restartCount: 0,
      state: "Running",
      mounts: [
        {
          mountPath: "/etc/nginx/conf.d",
          readOnly: true,
          subPath: null,
          volumeName: "config-vol",
          sourceType: "ConfigMap",
          sourceDetail: "nginx-config",
        },
        {
          mountPath: "/var/cache/nginx",
          readOnly: false,
          subPath: null,
          volumeName: "cache",
          sourceType: "EmptyDir",
          sourceDetail: null,
        },
      ],
    },
    {
      name: "sidecar",
      image: "envoy:1.28",
      ready: false,
      restartCount: 3,
      state: "Waiting: CrashLoopBackOff",
      mounts: [],
    },
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

  it("renders each container's volume mounts with their source", () => {
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

    expect(screen.getByText("/etc/nginx/conf.d")).toBeInTheDocument();
    expect(screen.getByText("ConfigMap: nginx-config · RO")).toBeInTheDocument();
    expect(screen.getByText("/var/cache/nginx")).toBeInTheDocument();
    expect(screen.getByText("EmptyDir")).toBeInTheDocument();
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

  it("resizes the dialog when the resize handle is dragged", () => {
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

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveStyle({ width: "512px", height: "480px" });

    const handle = screen.getByRole("separator", { name: "Resize dialog" });
    fireEvent.mouseDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 150, clientY: 130 });

    expect(dialog).toHaveStyle({ width: "562px", height: "510px" });

    fireEvent.mouseUp(window);
    fireEvent.mouseMove(window, { clientX: 900, clientY: 900 });

    // Further movement after mouseup must not keep resizing.
    expect(dialog).toHaveStyle({ width: "562px", height: "510px" });
  });

  it("clamps resizing to the configured min/max bounds", () => {
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

    const dialog = screen.getByRole("dialog");
    const handle = screen.getByRole("separator", { name: "Resize dialog" });

    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(window, { clientX: 5000, clientY: 5000 });
    expect(dialog).toHaveStyle({ width: "800px", height: "700px" });

    fireEvent.mouseMove(window, { clientX: -5000, clientY: -5000 });
    expect(dialog).toHaveStyle({ width: "400px", height: "320px" });
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
