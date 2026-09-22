import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8791,
    strictPort: true,
    proxy: {
      // MCP HTTP gateway (harness/bin serve-http) — JSON-RPC over /rpc.
      // Local dev: IMAGORO_MCP_PORT=19001 node harness/bin/imagoro-kao.mjs serve-http
      "/api": {
        target: "http://127.0.0.1:19001",
        changeOrigin: true
      }
    }
  }
});