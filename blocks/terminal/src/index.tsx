import TerminalBlock from "./Terminal.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { TerminalBlock };
export default {
  manifest,
  component: TerminalBlock,
} satisfies BlockPackage;