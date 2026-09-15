import MetricsBlock from "./Metrics.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { MetricsBlock };
export default {
  manifest,
  component: MetricsBlock,
} satisfies BlockPackage;