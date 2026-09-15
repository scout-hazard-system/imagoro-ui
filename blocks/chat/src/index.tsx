import ChatBlock from "./Chat.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { ChatBlock };
export default {
  manifest,
  component: ChatBlock,
} satisfies BlockPackage;