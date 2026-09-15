import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.map",
  name: "Map",
  version: "0.1.0",
  family: "map" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [4, 4] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "route_points", type: "GeoPoint[]" },
    ],
    out: [{ name: "viewport", type: "MapViewport" }],
  },
  api: ["leaflet"],
  theme: { tokens: ["--accent", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};