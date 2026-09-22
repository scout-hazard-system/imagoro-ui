import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.intent",
  name: "Intent",
  version: "0.1.0",
  family: "chat",
  substrates: ["react"],
  size: { min: [360, 240], ideal: [720, 300] },
  ports: {
    in: [{ name: "proposal", type: "intent/proposal" }],
    out: [
      { name: "proposal", type: "intent/proposal" },
      { name: "execute", type: "intent/execute" }
    ]
  },
  api: ["intent/propose", "intent/execute"],
  lifecycle: { autostart: true }
};