import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import path from "path";
import renderer from 'vite-plugin-electron-renderer'
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';

// package.json sicher einlesen und parsen
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
);

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              // Don't externalize electron for now
              // external: ["electron"],
            },
            minify: false,
            sourcemap: true,
          },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              // Don't externalize electron for now
              // external: ["electron"],
            },
            minify: false,
            sourcemap: true,
          },
        },
      },
    ]),
    renderer(),
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
              '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; connect-src \'self\' http://localhost:5173 ws://localhost:5173;">'
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
        manualChunks: {
          react: ["react", "react-dom"],
          zustand: ["zustand"],
          kubernetes: ["@kubernetes/client-node"],
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
