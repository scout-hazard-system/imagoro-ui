import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.audit",
  name: "Audit / Notification",
  version: "0.1.0",
  family: "audit" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [3, 2] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "notifications", type: "Notification[]" },
    ],
    out: [{ name: "ack", type: "AckAction" }],
  },
  theme: { tokens: ["--chip-ok", "--chip-warn", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};