import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.sidebar",
  name: "Sidebar",
  version: "0.1.0",
  family: "sidebar",
  substrates: ["react"],
  size: { min: [260, 320], ideal: [320, 640] },
  ports: {
    in: [{ name: "activate", type: "sidebar/activate" }],
    out: [{ name: "activate", type: "sidebar/activate" }]
  },
  api: ["sidebar/activate"],
  lifecycle: { autostart: true }
};