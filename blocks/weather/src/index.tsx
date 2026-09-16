import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.weather",
  name: "Weather (Current Route)",
  version: "0.1.0",
  family: "weather",
  substrates: ["react"],
  size: { min: [320, 120], ideal: [360, 180] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/snapshot", "pipeline/stream", "route/weather"]
};

interface WeatherState {
  conditions: string;
  tempF: number;
  humidity: number;
  windMph: number;
}

const initial: WeatherState = { conditions: "—", tempF: 0, humidity: 0, windMph: 0 };

function onWeather(state: WeatherState, evt: BusEvent): WeatherState {
  if (evt.type === "pipeline/snapshot") {
    const w = payload(evt).weather as WeatherState | undefined;
    return w ? { ...w } : state;
  }
  if (evt.type === "weather/update") {
    return { ...state, ...(payload(evt) as Partial<WeatherState>) };
  }
  return state;
}

export default function WeatherBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onWeather);
  return (
    <section className="block">
      <h3>Weather Forecast (Current Route)</h3>
      <dl className="kv">
        <dt>Conditions</dt>
        <dd>{state.conditions}</dd>
        <dt>Temp</dt>
        <dd>{state.tempF}°F</dd>
        <dt>Humidity</dt>
        <dd>{state.humidity}%</dd>
        <dt>Wind</dt>
        <dd>{state.windMph} mph</dd>
      </dl>
    </section>
  );
}