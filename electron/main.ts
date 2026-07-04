import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import {
  getContexts,
  getNamespaces,
  getPods,
  listFiles,
  downloadFile,
} from "./kubernetes";
import { initLogger, patchConsole, closeLogger } from "./logger";

// ESM polyfill: __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

// Initialise the logger – truncates output.log and patches console.log/error
initLogger();
patchConsole();

// Use a dedicated cache directory inside the project during development
// to avoid permission conflicts with system-level Chromium caches.
if (isDev) {
  const userDataPath = path.join(__dirname, "..", ".electron-cache");
  app.setPath("userData", userDataPath);
}

function createWindow(): BrowserWindow {
  // Prevent creating a second window if one already exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "K8sDownloader",
    backgroundColor: "#0f172a",
    icon: path.join(__dirname, "..", "public", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    // DevTools are opened on demand via Ctrl+Shift+I; auto-opening
    // produces noisy Autofill/VE-context errors in the console.
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Log renderer crashes to help debugging
  win.webContents.on(
    "render-process-gone",
    (_event, details) => {
      console.error("Renderer process gone:", details.reason, details.exitCode);
    }
  );

  win.on("closed", () => {
    mainWindow = null;
  });

  mainWindow = win;
  return win;
}

function registerIpcHandlers(): void {
  ipcMain.handle("get-contexts", async () => {
    return getContexts();
  });

  ipcMain.handle("get-namespaces", async (_event, contextName: string) => {
    return getNamespaces(contextName);
  });

  ipcMain.handle(
    "get-pods",
    async (_event, contextName: string, namespace: string) => {
      return getPods(contextName, namespace);
    }
  );

  ipcMain.handle(
    "list-files",
    async (
      _event,
      contextName: string,
      namespace: string,
      podName: string,
      containerName: string | null,
      dirPath: string
    ) => {
      return listFiles(contextName, namespace, podName, containerName, dirPath);
    }
  );

  ipcMain.handle("show-save-dialog", async (_event, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      title: "Save file",
    });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle(
    "download-file",
    async (
      _event,
      contextName: string,
      namespace: string,
      podName: string,
      containerName: string | null,
      sourcePath: string,
      destPath: string
    ) => {
      return downloadFile(
        contextName,
        namespace,
        podName,
        containerName,
        sourcePath,
        destPath
      );
    }
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  closeLogger();
});
