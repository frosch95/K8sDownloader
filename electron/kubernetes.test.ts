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

// downloadFile's own module graph: kubernetes.ts imports plain "child_process",
// "fs", "os" and "path" (unlike src/utils/kubectl.ts, which uses the "node:"
// specifiers mocked above). These must be mocked separately so that importing
// kubernetes.ts below doesn't route through vite-plugin-electron-renderer's
// browser shims for those built-ins.
const spawnMock = vi.hoisted(() => vi.fn());
const createWriteStreamMock = vi.hoisted(() => vi.fn());

vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
  spawn: spawnMock,
}));

vi.mock("fs", () => ({
  default: {
    // Vite/Vitest resolve "fs" and "node:fs" to the same underlying module,
    // so this must share existsSyncMock rather than defining its own —
    // otherwise resolveKubectlCommand's "node:fs" mock above gets shadowed.
    existsSync: existsSyncMock,
    writeFileSync: vi.fn(),
    createWriteStream: createWriteStreamMock,
  },
}));

vi.mock("os", () => ({
  default: { homedir: () => "/home/test" },
}));

// Shares node:path's mock shape ("path" and "node:path" resolve to the same
// underlying module) so resolveKubectlCommand's PATH-splitting keeps working.
vi.mock("path", () => ({
  default: {
    delimiter: ";",
    join: (...parts: string[]) => parts.join("\\"),
  },
}));

const { downloadFile } = await import("./kubernetes");

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

// ── downloadFile ─────────────────────────────────────────────────────────────

// A minimal stand-in for Node's EventEmitter: importing the real "events"
// module here would hit the same vite-plugin-electron-renderer shim problem
// that "child_process"/"fs"/"os"/"path" are mocked away from above.
class FakeEmitter {
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): this {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

interface MockChild extends FakeEmitter {
  stdout: FakeEmitter & { pipe: ReturnType<typeof vi.fn> };
  stderr: FakeEmitter;
  kill: ReturnType<typeof vi.fn>;
}

interface MockWriteStream extends FakeEmitter {
  end: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

function createMockChild(): MockChild {
  const child = new FakeEmitter() as MockChild;
  child.stdout = Object.assign(new FakeEmitter(), { pipe: vi.fn() });
  child.stderr = new FakeEmitter();
  child.kill = vi.fn();
  return child;
}

function createMockWriteStream(): MockWriteStream {
  const stream = new FakeEmitter() as MockWriteStream;
  stream.end = vi.fn((cb?: () => void) => cb?.());
  stream.destroy = vi.fn();
  return stream;
}

/** Queues up one mock child + write stream pair per successive spawn() call. */
function queueSpawnAttempts(count: number): { children: MockChild[]; writeStreams: MockWriteStream[] } {
  const children: MockChild[] = [];
  const writeStreams: MockWriteStream[] = [];

  for (let i = 0; i < count; i++) {
    const child = createMockChild();
    const writeStream = createMockWriteStream();
    children.push(child);
    writeStreams.push(writeStream);
    spawnMock.mockImplementationOnce(() => child);
    createWriteStreamMock.mockImplementationOnce(() => writeStream);
  }

  return { children, writeStreams };
}

/** Drains the microtask queue so an in-flight promise chain (e.g. the
 *  cat->type fallback) reaches its next spawn() call before we drive it. */
function flushAsync(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

const CONTEXT = "prod-us-admin";
const NAMESPACE = "user-management";
const POD = "authentication-service-65f4d88684-5x9jw";
const CONTAINER = "authentication-service";
const SOURCE = "/app/logs/app.log";
const DEST = "D:\\downloads\\app.log";

describe("downloadFile", () => {
  beforeEach(() => {
    spawnMock.mockReset();
    createWriteStreamMock.mockReset();
    existsSyncMock.mockReset();
  });

  it("writes the file via cat when the Linux attempt succeeds", async () => {
    const { children, writeStreams } = queueSpawnAttempts(1);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);
    children[0].stdout.emit("data", Buffer.from("log contents"));
    children[0].emit("close", 0);

    await expect(promise).resolves.toBeUndefined();
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["cat", SOURCE]),
      expect.any(Object)
    );
    expect(createWriteStreamMock).toHaveBeenCalledWith(DEST);
    expect(writeStreams[0].end).toHaveBeenCalled();
  });

  it("surfaces the real cat error instead of falling back when cat starts but fails", async () => {
    const { children } = queueSpawnAttempts(1);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);
    children[0].stderr.emit("data", Buffer.from("cat: /app/logs/app.log: No such file or directory"));
    children[0].emit("close", 1);

    await expect(promise).rejects.toThrow(/No such file or directory/);

    // Must not attempt the Windows fallback for a real cat failure.
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to Windows type only when cat itself cannot be started", async () => {
    const { children, writeStreams } = queueSpawnAttempts(2);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);

    children[0].stderr.emit(
      "data",
      Buffer.from(
        'OCI runtime exec failed: exec failed: unable to start container process: ' +
        'exec: "cat": executable file not found in $PATH: unknown'
      )
    );
    children[0].emit("close", 126);

    await flushAsync(); // let the fallback's spawn() call actually happen

    children[1].stdout.emit("data", Buffer.from("windows contents"));
    children[1].emit("close", 0);

    await expect(promise).resolves.toBeUndefined();
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.arrayContaining(["cmd", "/c", "type"]),
      expect.any(Object)
    );
    expect(writeStreams[1].end).toHaveBeenCalled();
  });

  it("throws the type fallback error when both cat and type fail to start", async () => {
    const { children } = queueSpawnAttempts(2);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);

    children[0].stderr.emit("data", Buffer.from('exec: "cat": executable file not found in $PATH: unknown'));
    children[0].emit("close", 126);

    await flushAsync(); // let the fallback's spawn() call actually happen

    children[1].stderr.emit("data", Buffer.from('exec: "cmd": executable file not found in $PATH: unknown'));
    children[1].emit("close", 126);

    await expect(promise).rejects.toThrow(/"cmd": executable file not found/);
  });

  it("throws immediately when kubectl cannot be spawned at all", async () => {
    const { children } = queueSpawnAttempts(1);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);
    children[0].emit("error", new Error("spawn kubectl ENOENT"));

    await expect(promise).rejects.toThrow(/ENOENT/);
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });
});
