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
      />
    );
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4); // 3 namespaces + 1 placeholder
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(screen.getByText("kube-system")).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
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
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "default" },
    });
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
      />
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("disables the select when there are no namespaces", () => {
    render(
      <NamespaceSelector
        namespaces={[]}
        selected=""
        loading={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
