import type { BlockFamily, BlockManifest } from "@imagoro/core";

export const manifest: BlockManifest = {
  id: "imagoro.block.weather",
  name: "Weather",
  version: "0.1.0",
  family: "weather" satisfies BlockFamily,
  substrates: ["react"],
  size: { min: [2, 1], ideal: [3, 1] },
  ports: {
    in: [
      { name: "events", type: "BusEvent" },
      { name: "forecast", type: "Forecast[]" },
    ],
    out: [{ name: "route_advisory", type: "WeatherAdvisory" }],
  },
  theme: { tokens: ["--accent", "--muted", "--card", "--card-border"] },
  lifecycle: { autostart: true },
};