import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.console",
  name: "Console",
  version: "0.1.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 140], ideal: [560, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/stream"]
};
