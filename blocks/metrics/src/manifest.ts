import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.metrics",
  name: "Run Metrics",
  version: "0.1.0",
  family: "metrics",
  substrates: ["react"],
  size: { min: [320, 120], ideal: [480, 160] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/snapshot", "pipeline/stream"]
};
