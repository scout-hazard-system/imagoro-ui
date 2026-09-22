import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    ssr: resolve(__dirname, "src/index.ts"),
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: "es",
        entryFileNames: "index.js"
      }
    },
    sourcemap: true,
    minify: false
  }
});