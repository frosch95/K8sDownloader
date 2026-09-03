import { describe, it, expect } from "vitest";
import { AppError, ErrorCode } from "./errors";

describe("AppError.fromError", () => {
  it("passes an existing AppError through unchanged", () => {
    const original = new AppError(ErrorCode.POD_NOT_FOUND, "Pod name is required");
    expect(AppError.fromError(original)).toBe(original);
  });

  it("wraps a plain string as UNKNOWN_ERROR", () => {
    const result = AppError.fromError("boom");
    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(result.message).toBe("boom");
  });

  it("classifies a spawnSync timeout as TIMEOUT", () => {
    const result = AppError.fromError(new Error("kubectl command timed out after 30s (killed with SIGTERM)"));
    expect(result.code).toBe(ErrorCode.TIMEOUT);
  });

  it("classifies an exec download timeout as TIMEOUT", () => {
    const result = AppError.fromError(new Error("kubectl exec timed out after 600s while downloading via cat"));
    expect(result.code).toBe(ErrorCode.TIMEOUT);
  });

  it("classifies a Node ETIMEDOUT error as TIMEOUT", () => {
    const result = AppError.fromError(new Error("spawnSync kubectl ETIMEDOUT"));
    expect(result.code).toBe(ErrorCode.TIMEOUT);
  });

  it("classifies a denied cat/ls as PERMISSION_DENIED", () => {
    const result = AppError.fromError(new Error("kubectl exec failed: cat: /root/secret: Permission denied"));
    expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
  });

  it("classifies an RBAC-forbidden kubectl response as PERMISSION_DENIED", () => {
    const result = AppError.fromError(
      new Error('kubectl failed: Error from server (Forbidden): pods is forbidden: User "x" cannot list resource "pods"')
    );
    expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
  });

  it("classifies a connection failure to the cluster as NETWORK_ERROR", () => {
    const result = AppError.fromError(
      new Error("kubectl failed: Unable to connect to the server: dial tcp 10.0.0.1:6443: connect: connection refused")
    );
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it("classifies a missing kubeconfig file as KUBECONFIG_NOT_FOUND", () => {
    const result = AppError.fromError(new Error("Kubernetes config not found at C:\\Users\\test\\.kube\\config"));
    expect(result.code).toBe(ErrorCode.KUBECONFIG_NOT_FOUND);
  });

  it("classifies a missing container as CONTAINER_NOT_FOUND", () => {
    const result = AppError.fromError(new Error("error: container nginx not found in pod mypod_default"));
    expect(result.code).toBe(ErrorCode.CONTAINER_NOT_FOUND);
  });

  it("classifies a missing file on Linux as FILE_NOT_FOUND", () => {
    const result = AppError.fromError(new Error("kubectl exec failed: cat: /missing: No such file or directory"));
    expect(result.code).toBe(ErrorCode.FILE_NOT_FOUND);
  });

  it("classifies a missing file on Windows as FILE_NOT_FOUND", () => {
    const result = AppError.fromError(
      new Error("kubectl exec failed: The system cannot find the file specified.")
    );
    expect(result.code).toBe(ErrorCode.FILE_NOT_FOUND);
  });

  it("classifies kubectl not being installed as KUBECTL_NOT_INSTALLED", () => {
    const result = AppError.fromError(new Error("kubectl failed: spawnSync kubectl ENOENT"));
    expect(result.code).toBe(ErrorCode.KUBECTL_NOT_INSTALLED);
  });

  it("classifies a generic kubectl failure as KUBECTL_EXEC_FAILED", () => {
    const result = AppError.fromError(new Error("kubectl failed: exit code 1"));
    expect(result.code).toBe(ErrorCode.KUBECTL_EXEC_FAILED);
  });

  it("classifies unsupported-character validation errors as INVALID_INPUT", () => {
    const result = AppError.fromError(new Error("Context name contains unsupported characters"));
    expect(result.code).toBe(ErrorCode.INVALID_INPUT);
  });

  it("classifies traversal-style paths as INVALID_INPUT", () => {
    const result = AppError.fromError(new Error("Path traversal detected in container path"));
    expect(result.code).toBe(ErrorCode.INVALID_INPUT);
  });

  it("classifies other path-related errors as INVALID_PATH", () => {
    const result = AppError.fromError(new Error("Container path must be absolute"));
    expect(result.code).toBe(ErrorCode.INVALID_PATH);
  });
});
