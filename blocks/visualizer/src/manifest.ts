import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.visualizer",
  name: "Audio Visualizer",
  version: "0.1.0",
  family: "audio/visualizer" satisfies BlockFamily,
  substrates: ["react", "canvas"],
  size: { min: [2, 1], ideal: [3, 1] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "audio_meter", type: "AudioLevel[]" },
    ],
    out: [{ name: "clip_event", type: "ClipDetected" }],
  },
  theme: { tokens: ["--accent", "--chip-ok", "--chip-warn", "--card"] },
  lifecycle: { autostart: true },
};