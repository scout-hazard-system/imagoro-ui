import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.graph",
  name: "Node Canvas",
  version: "0.1.0",
  family: "graph",
  substrates: ["react"],
  size: { min: [480, 320], ideal: [720, 480] },
  ports: { in: [], out: [{ name: "graph", type: "object" }] },
  api: ["graph/set", "graph/connect"]
};
