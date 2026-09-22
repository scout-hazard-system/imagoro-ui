import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.terminal",
  name: "Terminal",
  version: "0.1.0",
  family: "terminal",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [560, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/stream"]
};
