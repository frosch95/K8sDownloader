import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("shows switch to light mode when in dark mode", () => {
    render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);
    expect(
      screen.getByLabelText("Switch to light mode")
    ).toBeInTheDocument();
  });

  it("shows switch to dark mode when in light mode", () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);
    expect(
      screen.getByLabelText("Switch to dark mode")
    ).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="dark" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("has correct title attribute in dark mode", () => {
    render(<ThemeToggle theme="dark" onToggle={vi.fn()} />);
    expect(screen.getByTitle("Switch to light mode")).toBeInTheDocument();
  });

  it("has correct title attribute in light mode", () => {
    render(<ThemeToggle theme="light" onToggle={vi.fn()} />);
    expect(screen.getByTitle("Switch to dark mode")).toBeInTheDocument();
  });
});
