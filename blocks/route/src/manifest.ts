import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.route",
  name: "Route Planner",
  version: "0.1.0",
  family: "route",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [520, 360] },
  ports: {
    in: [{ name: "gps", type: "coordinate" }],
    out: [{ name: "route", type: "route" }]
  },
  api: ["pipeline/stream"]
};
