import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.audit",
  name: "Notification Workflow Audit",
  version: "0.1.0",
  family: "audit",
  substrates: ["react"],
  size: { min: [320, 180], ideal: [520, 240] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/snapshot", "pipeline/stream"]
};
