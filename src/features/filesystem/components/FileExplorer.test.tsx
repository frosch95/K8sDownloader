import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileExplorer } from "./FileExplorer";
import type { FileEntry } from "../../../shared/types/kubernetes";

const sampleFiles: FileEntry[] = [
  { name: "src", path: "/src", isDir: true, size: 0, modified: "Jun 1 12:00" },
  { name: "app.js", path: "/app.js", isDir: false, size: 4096, modified: "Jun 2 14:30" },
  { name: "config", path: "/config", isDir: true, size: 0, modified: "May 28 09:00" },
  { name: "README.md", path: "/README.md", isDir: false, size: 2048, modified: "Jun 1 10:00" },
];

const defaultProps = {
  files: sampleFiles,
  currentPath: "/",
  loading: false,
  disabled: false,
  contextName: "prod-cluster",
  namespace: "default",
  podName: "nginx-abc",
  containerName: "nginx",
  onNavigate: vi.fn(),
  onBack: vi.fn(),
  onError: vi.fn(),
};

describe("FileExplorer", () => {
  it("shows placeholder when disabled", () => {
    render(<FileExplorer {...defaultProps} disabled={true} />);
    expect(
      screen.getByText("Select a context, namespace, and pod to browse files")
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<FileExplorer {...defaultProps} loading={true} />);
    expect(screen.getByText("Loading files…")).toBeInTheDocument();
  });

  it("shows 'Empty directory' when no files", () => {
    render(<FileExplorer {...defaultProps} files={[]} />);
    expect(screen.getByText("Empty directory")).toBeInTheDocument();
  });

  it("renders file entries", () => {
    render(<FileExplorer {...defaultProps} />);
    expect(screen.getByText("src")).toBeInTheDocument();
    expect(screen.getByText("app.js")).toBeInTheDocument();
    expect(screen.getByText("config")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });

  it("renders breadcrumbs correctly", () => {
    render(<FileExplorer {...defaultProps} currentPath="/src/components" />);
    // Both "src" appear in breadcrumb button and file list; "components" only in breadcrumb
    expect(screen.getAllByText("src")).toHaveLength(2);
    expect(screen.getByText("components")).toBeInTheDocument();
  });

  it("shows back button disabled at root path", () => {
    render(<FileExplorer {...defaultProps} currentPath="/" />);
    const backButton = screen.getByTitle("Go up");
    expect(backButton).toBeDisabled();
  });

  it("shows back button enabled at subpath", () => {
    render(<FileExplorer {...defaultProps} currentPath="/src" />);
    const backButton = screen.getByTitle("Go up");
    expect(backButton).not.toBeDisabled();
  });

  it("navigates to directory on double-click", () => {
    const onNavigate = vi.fn();
    render(<FileExplorer {...defaultProps} onNavigate={onNavigate} />);
    // Find the row containing "src" and double-click it
    const srcRow = screen.getByText("src").closest("tr");
    fireEvent.doubleClick(srcRow!);
    expect(onNavigate).toHaveBeenCalledWith("/src");
  });

  it("does not navigate on double-click of a file", () => {
    const onNavigate = vi.fn();
    render(<FileExplorer {...defaultProps} onNavigate={onNavigate} />);
    const fileRow = screen.getByText("app.js").closest("tr");
    fireEvent.doubleClick(fileRow!);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("navigates on directory name click", () => {
    const onNavigate = vi.fn();
    render(<FileExplorer {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("config"));
    expect(onNavigate).toHaveBeenCalledWith("/config");
  });

  it("does not navigate on file name click", () => {
    const onNavigate = vi.fn();
    render(<FileExplorer {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("README.md"));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("shows download button only for files", () => {
    render(<FileExplorer {...defaultProps} />);
    // Directories should not show download button; count download buttons by title
    const downloadButtons = screen.getAllByTitle("Download file");
    expect(downloadButtons).toHaveLength(2); // app.js and README.md
  });

  it("displays file sizes formatted", () => {
    render(<FileExplorer {...defaultProps} />);
    expect(screen.getByText("4 KB")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
  });

  it("shows item count in status bar", () => {
    render(<FileExplorer {...defaultProps} />);
    expect(screen.getByText("4 items")).toBeInTheDocument();
  });

  it("shows singular 'item' for single file", () => {
    render(
      <FileExplorer
        {...defaultProps}
        files={[{ name: "only.txt", path: "/only.txt", isDir: false, size: 100, modified: "Now" }]}
      />
    );
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  it("navigates to root when root breadcrumb clicked", () => {
    const onNavigate = vi.fn();
    render(
      <FileExplorer {...defaultProps} currentPath="/src/components" onNavigate={onNavigate} />
    );
    // Click the root breadcrumb button (first non-back button), not separator spans
    const rootBtn = screen.getByRole("button", { name: "/" });
    fireEvent.click(rootBtn);
    expect(onNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates to breadcrumb path on click", () => {
    const onNavigate = vi.fn();
    render(
      <FileExplorer {...defaultProps} currentPath="/src/components" onNavigate={onNavigate} />
    );
    // Click the breadcrumb button (not the file list entry) — use getAllByText and pick the button
    const allSrc = screen.getAllByText("src");
    const breadcrumbBtn = allSrc.find((el) => el.tagName === "BUTTON")!;
    fireEvent.click(breadcrumbBtn);
    expect(onNavigate).toHaveBeenCalledWith("/src");
  });
});
