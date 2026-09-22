import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.chat",
  name: "Chat",
  version: "0.1.0",
  family: "chat",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [520, 360] },
  ports: { in: [{ name: "messages", type: "chat/message[]" }], out: [] },
  api: ["pipeline/stream"]
};
