import ConsoleBlock from "./Console.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { ConsoleBlock };
export default {
  manifest,
  component: ConsoleBlock,
} satisfies BlockPackage;