import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.route",
  name: "Route",
  version: "0.1.0",
  family: "route" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [3, 2] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "route", type: "RoutePlan" },
    ],
    out: [{ name: "eta", type: "EtaUpdate" }],
  },
  theme: { tokens: ["--accent", "--chip-ok", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};