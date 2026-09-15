import AuditBlock from "./Audit.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { AuditBlock };
export default {
  manifest,
  component: AuditBlock,
} satisfies BlockPackage;