import BlackboardBlock from "./Blackboard.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { BlackboardBlock };
export default {
  manifest,
  component: BlackboardBlock,
} satisfies BlockPackage;