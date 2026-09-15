import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.pipeline",
  name: "Pipeline Monitor",
  version: "0.1.0",
  family: "pipeline" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 1], ideal: [2, 2] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "stats", type: "JsonObject" },
    ],
    out: [{ name: "health", type: "PipelineHealth" }],
  },
  api: ["sse"],
  theme: { tokens: ["--chip-ok", "--chip-warn", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};