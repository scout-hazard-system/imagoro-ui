import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// MCP HTTP gateway (harness/bin serve-http) — JSON-RPC over /rpc.
//   Local:  IMAGORO_MCP_PORT=19001 node harness/bin/imagoro-kao.mjs serve-http
//   Remote: IMAGORO_MCP_URL=http://10.66.2.2:19001 (Kao on the agent box, over
//           the Scout mesh) IMAGORO_MCP_TOKEN=<gateway token>
// The token is attached here, server-side, so it never ships in the browser
// bundle (VITE_IMAGORO_MCP_TOKEN still works for a fully local setup).
const target = process.env.IMAGORO_MCP_URL || "http://127.0.0.1:19001";
const token = process.env.IMAGORO_MCP_TOKEN || "";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8791,
    strictPort: true,
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
        // the gateway serves POST /rpc; the console calls /api/rpc
        rewrite: (path: string) => path.replace(/^\/api/, ""),
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      }
    }
  }
});
