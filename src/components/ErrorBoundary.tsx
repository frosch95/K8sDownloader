import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Catches render errors in children and displays a fallback UI instead of crashing the app. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Component render error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-8 text-center"
        >
          <span className="text-3xl mb-3">⚠️</span>
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-k8s-muted mb-4 max-w-md leading-relaxed">
            {this.state.error?.message || "An unexpected render error occurred."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
