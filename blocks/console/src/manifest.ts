import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.console",
  name: "Console / Log",
  version: "0.1.0",
  family: "console" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 2], ideal: [4, 2] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "logs", type: "LogEntry[]" },
    ],
    out: [{ name: "command", type: "ConsoleCommand" }],
  },
  theme: { tokens: ["--text", "--muted", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};