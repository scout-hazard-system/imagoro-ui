import WeatherBlock from "./Weather.js";
import { manifest } from "./manifest.js";
import type { BlockPackage } from "@imagoro/core";

export { manifest };
export { WeatherBlock };
export default {
  manifest,
  component: WeatherBlock,
} satisfies BlockPackage;