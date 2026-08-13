import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RefreshButton } from "./RefreshButton";

describe("RefreshButton", () => {
  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<RefreshButton onClick={onClick} />);
    fireEvent.click(screen.getByTitle("Refresh"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when the disabled prop is set", () => {
    const onClick = vi.fn();
    render(<RefreshButton onClick={onClick} disabled />);
    const button = screen.getByTitle("Refresh");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is disabled and shows a spinning icon while loading", () => {
    const onClick = vi.fn();
    render(<RefreshButton onClick={onClick} loading />);
    const button = screen.getByTitle("Refreshing…");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is enabled by default", () => {
    render(<RefreshButton onClick={vi.fn()} />);
    expect(screen.getByTitle("Refresh")).not.toBeDisabled();
  });
});
