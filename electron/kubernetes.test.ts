import { beforeEach, describe, expect, it, vi } from "vitest";

const existsSyncMock = vi.hoisted(() => vi.fn());

vi.mock("node:fs", () => ({
  default: {
    existsSync: existsSyncMock,
  },
}));

vi.mock("node:path", () => ({
  default: {
    delimiter: ";",
    join: (...parts: string[]) => parts.join("\\"),
  },
}));

const { resolveKubectlCommand } = await import("../src/utils/kubectl");

describe("resolveKubectlCommand", () => {
  beforeEach(() => {
    existsSyncMock.mockReset();
    delete process.env.KUBECTL_PATH;
    delete process.env.KUBECTL_BIN;
  });

  it("prefers an explicit kubectl path from the environment", () => {
    process.env.KUBECTL_PATH = "C:/tools/kubectl.exe";
    existsSyncMock.mockReturnValue(true);

    expect(resolveKubectlCommand()).toBe("C:/tools/kubectl.exe");
  });

  it("falls back to a platform-appropriate command name when no override exists", () => {
    const result = resolveKubectlCommand();

    expect(result).toBe(process.platform === "win32" ? "kubectl.exe" : "kubectl");
  });
});
