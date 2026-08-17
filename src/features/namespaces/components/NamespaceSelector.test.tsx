import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NamespaceSelector } from "./NamespaceSelector";
import type { NamespaceInfo } from "../../../shared/types/kubernetes";

const sampleNamespaces: NamespaceInfo[] = [
  { name: "default" },
  { name: "kube-system" },
  { name: "production" },
];

describe("NamespaceSelector", () => {
  it("renders the label", () => {
    render(
      <NamespaceSelector
        namespaces={[]}
        selected=""
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText("Namespace")).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    render(
      <NamespaceSelector
        namespaces={[]}
        selected=""
        loading={true}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText("Loading namespaces…")).toBeInTheDocument();
  });

  it("renders all namespace options", () => {
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    // Open dropdown to check options
    const button = screen.getByRole("button", { name: "Select a namespace…" });
    fireEvent.click(button);

    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("kube-system")).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
  });

  it("filters the namespace list by the typed query", () => {
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select a namespace…" }));
    fireEvent.change(screen.getByPlaceholderText("Filter namespaces…"), {
      target: { value: "prod" },
    });

    expect(screen.getByText("production")).toBeInTheDocument();
    expect(screen.queryByText("default")).not.toBeInTheDocument();
    expect(screen.queryByText("kube-system")).not.toBeInTheDocument();
  });

  it("calls onSelect when a namespace is chosen", () => {
    const onSelect = vi.fn();
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={false}
        disabled={false}
        onSelect={onSelect}
        onRefresh={vi.fn()}
      />
    );

    // Open dropdown
    const button = screen.getByRole("button", { name: "Select a namespace…" });
    fireEvent.click(button);

    // Click on an option
    fireEvent.click(screen.getByText("default"));
    expect(onSelect).toHaveBeenCalledWith("default");
  });

  it("disables the select when disabled", () => {
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={false}
        disabled={true}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    const button = screen.getByRole("button", { name: "Select a namespace…" });
    expect(button).toBeDisabled();
  });

  it("disables the select when there are no namespaces", () => {
    render(
      <NamespaceSelector
        namespaces={[]}
        selected=""
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    const button = screen.getByRole("button", { name: "Select a namespace…" });
    expect(button).toBeDisabled();
  });

  it("calls onRefresh when the refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={onRefresh}
      />
    );
    fireEvent.click(screen.getByTitle("Refresh"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("disables the refresh button when the selector is disabled", () => {
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={false}
        disabled={true}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByTitle("Refresh")).toBeDisabled();
  });

  it("disables the refresh button while loading", () => {
    render(
      <NamespaceSelector
        namespaces={sampleNamespaces}
        selected=""
        loading={true}
        disabled={false}
        onSelect={vi.fn()}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByTitle("Refreshing…")).toBeDisabled();
  });
});
