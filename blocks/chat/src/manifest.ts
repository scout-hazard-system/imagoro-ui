import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.chat",
  name: "Chat",
  version: "0.1.0",
  family: "chat" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [3, 3] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "messages", type: "Message[]" },
    ],
    out: [{ name: "send", type: "ChatMessage" }],
  },
  theme: { tokens: ["--text", "--muted", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};