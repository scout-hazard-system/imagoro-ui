import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Core dev harness: served from the repo root so the relative links in
// harness/index.html (design/gen.css, ./src/main.ts) resolve, with the same
// /api proxy contract the renderer uses (SSE fallback: routing dev_server.py).
export default defineConfig({
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:18080",
        changeOrigin: true,
      },
    },
  },
});