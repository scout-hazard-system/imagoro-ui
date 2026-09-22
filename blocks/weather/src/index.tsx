import type { BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

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