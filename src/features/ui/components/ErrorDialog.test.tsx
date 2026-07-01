import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorDialog } from "./ErrorDialog";

describe("ErrorDialog", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(
      <ErrorDialog message={null} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the error message", () => {
    render(
      <ErrorDialog message="Something went wrong!" onClose={vi.fn()} />
    );
    expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
  });

  it("renders the error heading", () => {
    render(
      <ErrorDialog message="Connection failed" onClose={vi.fn()} />
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders the Dismiss button", () => {
    render(
      <ErrorDialog message="Oops" onClose={vi.fn()} />
    );
    expect(screen.getByText("Dismiss")).toBeInTheDocument();
  });

  it("calls onClose when Dismiss button clicked", () => {
    const onClose = vi.fn();
    render(
      <ErrorDialog message="Oops" onClose={onClose} />
    );
    fireEvent.click(screen.getByText("Dismiss"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key pressed", () => {
    const onClose = vi.fn();
    render(
      <ErrorDialog message="Oops" onClose={onClose} />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose for non-Escape keys", () => {
    const onClose = vi.fn();
    render(
      <ErrorDialog message="Oops" onClose={onClose} />
    );
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("has alertdialog role", () => {
    render(
      <ErrorDialog message="Critical error" onClose={vi.fn()} />
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("has aria-modal set to true", () => {
    render(
      <ErrorDialog message="Modal error" onClose={vi.fn()} />
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("cleans up keydown listener on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <ErrorDialog message="Will unmount" onClose={onClose} />
    );
    unmount();
    // Should not throw or call onClose after unmount
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("has scrollable content area for long messages", () => {
    const longMessage = "Error: ".repeat(50); // Very long message
    render(
      <ErrorDialog message={longMessage} onClose={vi.fn()} />
    );
    
    // Use a regex to find the content area that contains the error message
    const contentArea = screen.getByRole("alertdialog").querySelector(".max-h-64.overflow-y-auto");
    expect(contentArea).toBeInTheDocument();
    expect(contentArea).toHaveClass("max-h-64");
    expect(contentArea).toHaveClass("overflow-y-auto");
  });
});
