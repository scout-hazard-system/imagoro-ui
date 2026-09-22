import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.pipeline",
  name: "Pipeline Monitor",
  version: "0.1.0",
  family: "pipeline",
  substrates: ["react"],
  size: { min: [320, 140], ideal: [520, 200] },
  ports: {
    in: [{ name: "run", type: "pipeline/run" }],
    out: [{ name: "state", type: "pipeline/state" }]
  },
  api: ["pipeline/snapshot", "pipeline/stream"]
};
