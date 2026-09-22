import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { imagoroImagePlugin } from "./imagoro-image-plugin";

export default defineConfig({
  plugins: [
    react(),
    imagoroImagePlugin({ imageId: "imagoro.command-center", imageVersion: "0.1.0" })
  ],
  server: {
    port: 8790,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:18080",
        changeOrigin: true
      }
    }
  }
});