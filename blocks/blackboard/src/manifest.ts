import type { BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.blackboard",
  name: "Blackboard",
  version: "0.1.0",
  family: "blackboard",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [480, 240] },
  ports: {
    in: [{ name: "snapshot", type: "blackboard/snapshot" }],
    out: [{ name: "values", type: "kv" }]
  },
  api: ["blackboard:pipeline", "pipeline/snapshot", "acl/role"]
};
