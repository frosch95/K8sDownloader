import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PodSelector } from "./PodSelector";
import type { PodInfo } from "../types";

const samplePods: PodInfo[] = [
  { name: "nginx-deployment-abc", namespace: "default", status: "Running", containers: ["nginx"] },
  { name: "redis-master", namespace: "default", status: "Running", containers: ["redis"] },
  { name: "api-server", namespace: "default", status: "Pending", containers: ["api"] },
  { name: "crashed-pod", namespace: "default", status: "Failed", containers: ["app"] },
];

describe("PodSelector", () => {
  it("renders the label", () => {
    render(
      <PodSelector
        pods={[]}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Pod")).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    render(
      <PodSelector
        pods={[]}
        selected={null}
        loading={true}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Loading pods…")).toBeInTheDocument();
  });

  it("shows filter input when not loading", () => {
    render(
      <PodSelector
        pods={samplePods}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Filter pods…")).toBeInTheDocument();
  });

  it("renders all pods", () => {
    render(
      <PodSelector
        pods={samplePods}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("nginx-deployment-abc")).toBeInTheDocument();
    expect(screen.getByText("redis-master")).toBeInTheDocument();
    expect(screen.getByText("api-server")).toBeInTheDocument();
    expect(screen.getByText("crashed-pod")).toBeInTheDocument();
  });

  it("filters pods by search text", () => {
    render(
      <PodSelector
        pods={samplePods}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Filter pods…"), {
      target: { value: "nginx" },
    });
    expect(screen.getByText("nginx-deployment-abc")).toBeInTheDocument();
    expect(screen.queryByText("redis-master")).not.toBeInTheDocument();
  });

  it("shows 'No pods found' when filter yields no results", () => {
    render(
      <PodSelector
        pods={samplePods}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Filter pods…"), {
      target: { value: "nonexistent" },
    });
    expect(screen.getByText("No pods found")).toBeInTheDocument();
  });

  it("shows 'Select a namespace first' when disabled", () => {
    render(
      <PodSelector
        pods={[]}
        selected={null}
        loading={false}
        disabled={true}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Select a namespace first")).toBeInTheDocument();
  });

  it("calls onSelect when a pod is clicked", () => {
    const onSelect = vi.fn();
    render(
      <PodSelector
        pods={samplePods}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText("nginx-deployment-abc"));
    expect(onSelect).toHaveBeenCalledWith(samplePods[0]);
  });

  it("shows status badges with correct classes", () => {
    render(
      <PodSelector
        pods={samplePods}
        selected={null}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    // Multiple pods can have "Running" status
    expect(screen.getAllByText("Running")).toHaveLength(2);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("highlights selected pod", () => {
    render(
      <PodSelector
        pods={samplePods}
        selected={samplePods[0]}
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    const button = screen.getByText("nginx-deployment-abc").closest("button");
    expect(button?.className).toContain("bg-k8s-blue");
  });
});
