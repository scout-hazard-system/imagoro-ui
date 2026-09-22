import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.visualizer",
  name: "Audio Visualizer",
  version: "0.1.0",
  family: "audio/visualizer",
  substrates: ["react"],
  size: { min: [320, 120], ideal: [560, 160] },
  ports: { in: [{ name: "rms", type: "number[]" }], out: [] },
  api: ["pipeline/stream"]
};
