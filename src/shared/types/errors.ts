export enum ErrorCode {
  KUBECONFIG_NOT_FOUND = 'KUBECONFIG_NOT_FOUND',
  KUBECTL_NOT_INSTALLED = 'KUBECTL_NOT_INSTALLED',
  KUBECTL_EXEC_FAILED = 'KUBECTL_EXEC_FAILED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',
  NAMESPACE_NOT_FOUND = 'NAMESPACE_NOT_FOUND',
  POD_NOT_FOUND = 'POD_NOT_FOUND',
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_PATH = 'INVALID_PATH',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: string,
    public readonly timestamp: Date = new Date()
  ) {
    super(message);
    this.name = 'AppError';
  }

  static fromError(error: unknown): AppError {
    if (error instanceof AppError) return error;

    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    // Map common errors to specific codes. Order matters: several of kubectl's
    // own error messages contain "kubectl" *and* a more specific diagnostic
    // (e.g. "kubectl exec failed: cat: /x: Permission denied"), so the
    // specific checks must run before the generic 'kubectl' fallback below.
    if (lower.includes('timed out') || lower.includes('etimedout')) {
      return new AppError(ErrorCode.TIMEOUT, message);
    }

    if (lower.includes('permission denied') || lower.includes('forbidden')) {
      return new AppError(ErrorCode.PERMISSION_DENIED, message);
    }

    if (
      lower.includes('econnrefused') ||
      lower.includes('enotfound') ||
      lower.includes('eai_again') ||
      lower.includes('dial tcp') ||
      lower.includes('no route to host') ||
      lower.includes('unable to connect to the server')
    ) {
      return new AppError(ErrorCode.NETWORK_ERROR, message);
    }

    if (lower.includes('kubernetes config not found')) {
      return new AppError(ErrorCode.KUBECONFIG_NOT_FOUND, message);
    }

    if (/container\s.*\snot found/.test(lower)) {
      return new AppError(ErrorCode.CONTAINER_NOT_FOUND, message);
    }

    if (
      lower.includes('no such file or directory') ||
      lower.includes('cannot find the file specified') ||
      lower.includes('the system cannot find the file')
    ) {
      return new AppError(ErrorCode.FILE_NOT_FOUND, message);
    }

    if (message.includes('kubectl')) {
      if (message.includes('ENOENT')) {
        return new AppError(ErrorCode.KUBECTL_NOT_INSTALLED, message);
      }
      return new AppError(ErrorCode.KUBECTL_EXEC_FAILED, message);
    }

    if (lower.includes('invalid') || lower.includes('unsupported characters') || lower.includes('traversal')) {
      return new AppError(ErrorCode.INVALID_INPUT, message);
    }

    if (lower.includes('path')) {
      return new AppError(ErrorCode.INVALID_PATH, message);
    }

    return new AppError(ErrorCode.UNKNOWN_ERROR, message);
  }
}