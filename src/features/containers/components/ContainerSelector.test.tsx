import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContainerSelector } from "./ContainerSelector";

describe("ContainerSelector", () => {
  it("renders nothing when there are no containers", () => {
    const { container } = render(
      <ContainerSelector containers={[]} selected={null} onSelect={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is only one container", () => {
    const { container } = render(
      <ContainerSelector containers={["nginx"]} selected="nginx" onSelect={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the label and all container options when there are multiple containers", () => {
    render(
      <ContainerSelector
        containers={["app", "sidecar"]}
        selected="app"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Container")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "app" });
    fireEvent.click(button);

    expect(screen.getByText("sidecar")).toBeInTheDocument();
  });

  it("calls onSelect when a different container is chosen", () => {
    const onSelect = vi.fn();
    render(
      <ContainerSelector
        containers={["app", "sidecar"]}
        selected="app"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "app" }));
    fireEvent.click(screen.getByText("sidecar"));

    expect(onSelect).toHaveBeenCalledWith("sidecar");
  });
});
