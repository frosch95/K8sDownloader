/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import path from "path";
import renderer from 'vite-plugin-electron-renderer'
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// package.json sicher einlesen und parsen
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
);

export default defineConfig({
    // ---> HIER HINZUFÜGEN: Verhindert das Sperren von Cache-Dateien unter Windows <---
  server: {
    watch: {
      ignored: ['**/.electron-cache/**']
    }
  },
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"]
            },
            minify: false,
            sourcemap: true,
          },
        },
      },
      {
        entry: "electron/preload.ts",
        // onstart bewusst weggelassen – args.reload() verursacht
        // in manchen vite-plugin-electron-Versionen einen zweiten
        // Electron-Start und damit ein zweites Fenster.
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"]
            },
            minify: false,
            sourcemap: true,
          },
        },
      },
    ]),
    renderer(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/*',
          dest: 'dist'
        }
      ]
    }),
    // Custom plugin to handle CSP for Electron
    {
      name: 'electron-csp-fix',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          // Remove strict CSP for Electron environment
          if (process.env.NODE_ENV === 'development') {
            // For development with Electron, use a more permissive CSP
            return html.replace(
              /<meta http-equiv="Content-Security-Policy" content=".*?" \/>/,
              '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; connect-src \'self\' http://localhost:5173 ws://localhost:5173; worker-src \'self\' blob:;">'
            );
          } else {
            // For production, keep a reasonable CSP
            return html.replace(
              /<meta http-equiv="Content-Security-Policy" content=".*?" \/>/,
              '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\' https://fonts.gstatic.com;">'
            );
          }
        }
      }
    }
  ],
  // Hier definieren wir die Variable für das Frontend
  define: {
    'process.env.npm_package_version': JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@types": path.resolve(__dirname, "./src/shared/types"),
    },
  },

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          if (id.includes("node_modules/zustand")) {
            return "zustand";
          }
          if (id.includes("node_modules/@kubernetes/client-node")) {
            return "kubernetes";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@types": path.resolve(__dirname, "./src/shared/types"),
    },
  },
});
