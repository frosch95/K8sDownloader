import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { app } from "electron";

// ESM polyfill: __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Logger module that writes all output to a log file.
 * On every app start, output.log is truncated (empty file).
 *
 * In development, the file is placed in the project root (.electron-cache/).
 * In production, it is placed in the app's userData directory.
 */

let logStream: fs.WriteStream | null = null;

function getLogDir(): string {
  if (!app.isPackaged) {
    // Development: use the same directory as .electron-cache
    return path.join(__dirname, "..", ".electron-cache");
  }
  // Production: use the app's userData directory
  return app.getPath("userData");
}

/**
 * Initialise the logger. Must be called once at app startup.
 * Creates/truncates output.log and starts writing.
 */
export function initLogger(): void {
  const logDir = getLogDir();

  // Ensure the directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, "output.log");
  logStream = fs.createWriteStream(logFile, { flags: "w" }); // 'w' = truncate & write

  write("Logger initialised");
  write(`Log file: ${logFile}`);
  write(`App version: ${app.getVersion()}`);
  write(`Electron: ${process.versions.electron}, Chrome: ${process.versions.chrome}, Node: ${process.versions.node}`);
  write("---");
}

/**
 * Write a single log line with a timestamp.
 */
export function write(message: string): void {
  if (!logStream) return;

  const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
  logStream.write(`[${timestamp}] ${message}\n`);
}

/**
 * Override console.log and console.error to also write to the log file.
 */
export function patchConsole(): void {
  const origLog = console.log;
  const origError = console.error;

  console.log = (...args: unknown[]) => {
    const message = args.map(String).join(" ");
    write(message);
    origLog.apply(console, args);
  };

  console.error = (...args: unknown[]) => {
    const message = args.map(String).join(" ");
    write(message);
    origError.apply(console, args);
  };
}

/**
 * Close the log stream gracefully.
 */
export function closeLogger(): void {
  if (logStream) {
    write("Logger shutting down");
    logStream.end();
    logStream = null;
  }
}
