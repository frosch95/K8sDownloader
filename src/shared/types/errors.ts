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

    // Map common errors to specific codes
    if (message.includes('kubectl')) {
      if (message.includes('ENOENT')) {
        return new AppError(ErrorCode.KUBECTL_NOT_INSTALLED, message);
      }
      return new AppError(ErrorCode.KUBECTL_EXEC_FAILED, message);
    }

    return new AppError(ErrorCode.UNKNOWN_ERROR, message);
  }
}