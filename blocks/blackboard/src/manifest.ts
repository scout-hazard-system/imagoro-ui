import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.blackboard",
  name: "Blackboard Watcher",
  version: "0.1.0",
  family: "blackboard" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [3, 3] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "entries", type: "BlackboardEntry[]" },
    ],
    out: [{ name: "entry", type: "BlackboardEntry" }],
  },
  theme: { tokens: ["--accent", "--text", "--muted", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};