import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.terminal",
  name: "Terminal",
  version: "0.1.0",
  family: "terminal" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [4, 2] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "stdout", type: "Line[]" },
    ],
    out: [{ name: "stdin", type: "Line" }],
  },
  theme: { tokens: ["--text", "--chip-ok", "--chip-warn", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};