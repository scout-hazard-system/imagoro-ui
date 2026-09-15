import VisualizerBlock from "./Visualizer.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { VisualizerBlock };
export default {
  manifest,
  component: VisualizerBlock,
} satisfies BlockPackage;