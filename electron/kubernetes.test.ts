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
const spawnSyncMock = vi.hoisted(() => vi.fn());
const createWriteStreamMock = vi.hoisted(() => vi.fn());

vi.mock("child_process", () => ({
  spawnSync: spawnSyncMock,
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

const { downloadFile, listFiles } = await import("./kubernetes");

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
  stdout: FakeEmitter & {
    pipe: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
  };
  stderr: FakeEmitter;
  kill: ReturnType<typeof vi.fn>;
}

interface MockWriteStream extends FakeEmitter {
  write: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  writableFinished: boolean;
}

function createMockChild(): MockChild {
  const child = new FakeEmitter() as MockChild;
  child.stdout = Object.assign(new FakeEmitter(), {
    pipe: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  });
  child.stderr = new FakeEmitter();
  child.kill = vi.fn();
  return child;
}

function createMockWriteStream(): MockWriteStream {
  const stream = new FakeEmitter() as MockWriteStream;
  stream.write = vi.fn(() => true);
  stream.end = vi.fn((cb?: () => void) => cb?.());
  stream.destroy = vi.fn();
  stream.writableFinished = false;
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

/** Builds a minimal single-file ustar archive buffer for the tar fallback tests. */
function buildTarBuffer(fileName: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512);
  header.write(fileName, 0, 100, "utf8");
  header.write("0000644\0", 100, 8, "ascii"); // mode
  header.write("0000000\0", 108, 8, "ascii"); // uid
  header.write("0000000\0", 116, 8, "ascii"); // gid
  header.write(content.length.toString(8).padStart(11, "0") + "\0", 124, 12, "ascii"); // size
  header.write("00000000000\0", 136, 12, "ascii"); // mtime
  header[156] = 0x30; // typeflag '0' = regular file
  header.fill(0x20, 148, 156); // checksum field as spaces during computation
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");

  const paddedSize = Math.ceil(content.length / 512) * 512;
  const archive = Buffer.alloc(512 + paddedSize + 1024); // header + data + end-of-archive blocks
  header.copy(archive, 0);
  content.copy(archive, 512);
  return archive;
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

  it("throws a helpful error when cat, type, and tar all fail to start", async () => {
    const { children } = queueSpawnAttempts(3);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);

    children[0].stderr.emit("data", Buffer.from('exec: "cat": executable file not found in $PATH: unknown'));
    children[0].emit("close", 126);
    await flushAsync();

    children[1].stderr.emit("data", Buffer.from('exec: "cmd": executable file not found in $PATH: unknown'));
    children[1].emit("close", 126);
    await flushAsync();

    children[2].stderr.emit("data", Buffer.from('exec: "tar": executable file not found in $PATH: unknown'));
    children[2].emit("close", 126);

    await expect(promise).rejects.toThrow(/no supported download tool/);
    expect(spawnMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to tar when cat and type cannot be started", async () => {
    const { children, writeStreams } = queueSpawnAttempts(3);
    const tarData = buildTarBuffer("app.log", Buffer.from("tar file contents"));

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);

    children[0].stderr.emit("data", Buffer.from('exec: "cat": executable file not found in $PATH'));
    children[0].emit("close", 126);
    await flushAsync();

    children[1].stderr.emit("data", Buffer.from('exec: "cmd": executable file not found in $PATH'));
    children[1].emit("close", 126);
    await flushAsync();

    children[2].stdout.emit("data", tarData);
    children[2].emit("close", 0);

    await expect(promise).resolves.toBeUndefined();
    expect(spawnMock).toHaveBeenCalledTimes(3);
    expect(spawnMock).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      expect.arrayContaining(["tar", "-cf", "-", SOURCE]),
      expect.any(Object)
    );
    // Only the raw file bytes (not the tar header/padding) must be written out.
    const written = writeStreams[2].write.mock.calls
      .flat()
      .filter((arg): arg is Buffer => Buffer.isBuffer(arg));
    expect(Buffer.concat(written).toString("utf-8")).toBe("tar file contents");
  });

  it("surfaces a real type error instead of falling back to tar", async () => {
    const { children } = queueSpawnAttempts(2);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);

    children[0].stderr.emit("data", Buffer.from('exec: "cat": executable file not found in $PATH'));
    children[0].emit("close", 126);
    await flushAsync();

    children[1].stderr.emit("data", Buffer.from("The system cannot find the file specified."));
    children[1].emit("close", 1);

    await expect(promise).rejects.toThrow(/system cannot find the file/);
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces a real tar error when tar starts but fails", async () => {
    const { children } = queueSpawnAttempts(3);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);

    children[0].stderr.emit("data", Buffer.from('exec: "cat": executable file not found in $PATH'));
    children[0].emit("close", 126);
    await flushAsync();

    children[1].stderr.emit("data", Buffer.from('exec: "cmd": executable file not found in $PATH'));
    children[1].emit("close", 126);
    await flushAsync();

    children[2].stderr.emit(
      "data",
      Buffer.from("tar: /app/logs/app.log: Cannot stat: No such file or directory")
    );
    children[2].emit("close", 2);

    await expect(promise).rejects.toThrow(/Cannot stat/);
    expect(spawnMock).toHaveBeenCalledTimes(3);
  });

  it("throws immediately when kubectl cannot be spawned at all", async () => {
    const { children } = queueSpawnAttempts(1);

    const promise = downloadFile(CONTEXT, NAMESPACE, POD, CONTAINER, SOURCE, DEST);
    children[0].emit("error", new Error("spawn kubectl ENOENT"));

    await expect(promise).rejects.toThrow(/ENOENT/);
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });
});

// ── listFiles ──────────────────────────────────────────────────────────────

const DIR = "/app/logs";

const LS_SAMPLE = [
  "total 12",
  "drwxr-xr-x  2 root root  4096 Jan 01 12:00 subdir",
  "-rw-r--r--  1 root root  1234 Jan 02 13:00 file.txt",
].join("\n");

const FIND_SAMPLE = [
  "d|4096|2026-08-13 12:34|/app/logs/subdir",
  "f|1234|2026-08-13 12:35|/app/logs/file.txt",
].join("\n");

const DIR_SAMPLE = [
  " Directory of C:\\app\\logs",
  "",
  "01/01/2024  12:00 PM    <DIR>          subdir",
  "01/02/2024  01:00 PM             1,234 file.txt",
].join("\n");

function kubectlResult(status: number, stdout = "", stderr = "") {
  return { status, stdout, stderr };
}

describe("listFiles", () => {
  beforeEach(() => {
    spawnSyncMock.mockReset();
  });

  it("returns entries from Linux ls when it succeeds", () => {
    spawnSyncMock.mockReturnValue(kubectlResult(0, LS_SAMPLE));

    const entries = listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR);

    expect(entries).toHaveLength(2);
    expect(entries[0].isDir).toBe(true);
    expect(entries[0].name).toBe("subdir");
    expect(spawnSyncMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["ls", "-la", DIR]),
      expect.any(Object)
    );
  });

  it("falls back to Linux find when ls is missing", () => {
    spawnSyncMock
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "ls": executable file not found in $PATH')
      )
      .mockReturnValue(kubectlResult(0, FIND_SAMPLE));

    const entries = listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR);

    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("subdir");
    expect(entries[0].path).toBe("/app/logs/subdir");
    expect(spawnSyncMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["/usr/bin/find", DIR, "-maxdepth", "1", "-printf"]),
      expect.any(Object)
    );
  });

  it("falls back to busybox ls when ls and find are missing", () => {
    spawnSyncMock
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "ls": executable file not found in $PATH')
      )
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "/usr/bin/find": stat /usr/bin/find: no such file or directory')
      )
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "/bin/find": stat /bin/find: no such file or directory')
      )
      .mockReturnValue(kubectlResult(0, LS_SAMPLE));

    const entries = listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR);

    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("subdir");
    expect(spawnSyncMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["busybox", "ls", "-la", DIR]),
      expect.any(Object)
    );
  });

  it("falls back to Windows dir when no Linux tooling is available", () => {
    spawnSyncMock
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "ls": executable file not found in $PATH')
      )
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "/usr/bin/find": stat /usr/bin/find: no such file or directory')
      )
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "/bin/find": stat /bin/find: no such file or directory')
      )
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "busybox": executable file not found in $PATH')
      )
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "/bin/busybox": stat /bin/busybox: no such file or directory')
      )
      .mockReturnValue(kubectlResult(0, DIR_SAMPLE));

    const entries = listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR);

    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("subdir");
    expect(spawnSyncMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["cmd", "/c", "dir"]),
      expect.any(Object)
    );
  });

  it("surfaces a real ls error instead of falling back", () => {
    spawnSyncMock.mockReturnValue(
      kubectlResult(2, "", "ls: cannot access '/app/logs': Permission denied")
    );

    expect(() => listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR)).toThrow(
      /Permission denied/
    );
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces a real find error instead of falling back to Windows", () => {
    spawnSyncMock
      .mockReturnValueOnce(
        kubectlResult(126, "", 'exec: "ls": executable file not found in $PATH')
      )
      .mockReturnValue(
        kubectlResult(1, "", "find: '/app/logs': Permission denied")
      );

    expect(() => listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR)).toThrow(
      /Permission denied/
    );
    expect(spawnSyncMock).toHaveBeenCalledTimes(2);
  });

  it("throws a helpful error when no listing tool is available", () => {
    spawnSyncMock.mockReturnValue(
      kubectlResult(126, "", 'exec: "cmd": executable file not found in $PATH')
    );

    expect(() => listFiles(CONTEXT, NAMESPACE, POD, CONTAINER, DIR)).toThrow(
      /no supported file listing tool/
    );
  });
});
