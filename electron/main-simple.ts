import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import {
  getContexts,
  getNamespaces,
  getPods,
  listFiles,
  downloadFile,
} from "./kubernetes";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

// Fix Windows GPU cache "Zugriff verweigert" errors by disabling the disk cache.
// These errors are harmless but noisy; this silences them.
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");

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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Simple loading logic - try dev server first, then built files
  if (isDev) {
    win.loadURL("http://localhost:5173").catch(() => {
      // If dev server fails, try built files
      try {
        win.loadFile(path.join(__dirname, "../dist/index.html"));
      } catch (e) {
        console.error("Failed to load application:", e);
        // Show simple error message
        win.loadURL("data:text/html,<html><body><h1>K8sDownloader</h1><p>Please run <code>pnpm dev</code> first</p></body></html>");
      }
    });
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