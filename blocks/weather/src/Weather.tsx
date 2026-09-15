import { useMemo } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface ForecastStep { segment: string; time: string; tempC: number; condition: string; }

/** Weather block: per-segment forecast along a planned route. */
export default function WeatherBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const f = useMemo<ForecastStep[] | null>(() => {
    const e = events(state).filter((x) => x.type === "weather_forecast").at(-1);
    if (!e) return null;
    const raw = Array.isArray(e.payload["forecast"]) ? (e.payload["forecast"] as JsonObject[]) : [];
    return raw.map((s) => ({
      segment: String(s["segment"] ?? "?"),
      time: String(s["time"] ?? "?"),
      tempC: Number(s["temp_c"]),
      condition: String(s["condition"] ?? "?"),
    }));
  }, [state]);

  return (
    <div className="block block-weather" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{f ? `${f[0]?.tempC ?? 0}°C` : "no forecast"}</span>
      </header>
      {f ? (
        <ul className="block-weather__list">
          {f.map((s, i) => (
            <li className="block-weather__row" key={i}>
              <span className="block-weather__seg">{s.segment}</span>
              <span className="block-weather__time">{s.time}</span>
              <span className="block-weather__temp">{s.tempC}°C</span>
              <span className="block-weather__cond">{s.condition}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="block__empty">waiting for weather_forecast</div>
      )}
    </div>
  );
}