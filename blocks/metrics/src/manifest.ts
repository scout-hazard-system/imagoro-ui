import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.metrics",
  name: "Metrics",
  version: "0.1.0",
  family: "metrics" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 1], ideal: [2, 1] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "snapshot", type: "JsonObject" },
    ],
    out: [{ name: "counter_delta", type: "MetricDelta" }],
  },
  theme: { tokens: ["--accent", "--text", "--muted", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};