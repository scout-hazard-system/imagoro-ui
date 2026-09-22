import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.map",
  name: "Integrated Map",
  version: "0.1.0",
  family: "map",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [520, 320] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/stream", "map/scene"]
};
