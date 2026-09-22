import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.weather",
  name: "Weather (Current Route)",
  version: "0.1.0",
  family: "weather",
  substrates: ["react"],
  size: { min: [320, 120], ideal: [360, 180] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/snapshot", "pipeline/stream", "route/weather"]
};
