import MapBlock from "./Map.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { MapBlock };
export default {
  manifest,
  component: MapBlock,
} satisfies BlockPackage;