import PipelineBlock from "./Pipeline.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { PipelineBlock };
export default {
  manifest,
  component: PipelineBlock,
} satisfies BlockPackage;