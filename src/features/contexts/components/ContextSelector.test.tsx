import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextSelector } from "./ContextSelector";
import type { ContextInfo } from "../../../shared/types/kubernetes";

const sampleContexts: ContextInfo[] = [
  { name: "prod-cluster", cluster: "prod-eu", user: "admin" },
  { name: "dev-cluster", cluster: "dev-us", user: "developer" },
  { name: "staging", cluster: "staging-eu", user: "ci" },
];

describe("ContextSelector", () => {
  it("renders the label", () => {
    render(
      <ContextSelector
        contexts={[]}
        selected=""
        loading={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText("Context")).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    render(
      <ContextSelector
        contexts={[]}
        selected=""
        loading={true}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText("Loading contexts…")).toBeInTheDocument();
  });

  it("renders all context options", () => {
    render(
      <ContextSelector
        contexts={sampleContexts}
        selected=""
        loading={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    const button = screen.getByRole("button", { name: "Select a context…" });
    expect(button).toBeInTheDocument();
    
    // Open dropdown to check options
    fireEvent.click(button);
    
    expect(screen.getByText("prod-cluster (prod-eu)")).toBeInTheDocument();
    expect(screen.getByText("dev-cluster (dev-us)")).toBeInTheDocument();
    expect(screen.getByText("staging (staging-eu)")).toBeInTheDocument();
  });

  it("calls onSelect when a context is chosen", () => {
    const onSelect = vi.fn();
    render(
      <ContextSelector
        contexts={sampleContexts}
        selected=""
        loading={false}
        onSelect={onSelect}
        onRefresh={vi.fn()}
      />
    );
    
    // Open dropdown
    const button = screen.getByRole("button", { name: "Select a context…" });
    fireEvent.click(button);
    
    // Click on an option
    fireEvent.click(screen.getByText("prod-cluster (prod-eu)"));
    expect(onSelect).toHaveBeenCalledWith("prod-cluster");
  });

  it("calls onRefresh when refresh button clicked", () => {
    const onRefresh = vi.fn();
    render(
      <ContextSelector
        contexts={sampleContexts}
        selected=""
        loading={false}
        onSelect={vi.fn()}
        onRefresh={onRefresh}
      />
    );
    fireEvent.click(screen.getByText("🔄 Refresh"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("disables refresh button while loading", () => {
    const onRefresh = vi.fn();
    render(
      <ContextSelector
        contexts={sampleContexts}
        selected=""
        loading={true}
        onSelect={vi.fn()}
        onRefresh={onRefresh}
      />
    );
    const btn = screen.getByText("Loading…");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
