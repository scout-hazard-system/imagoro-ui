import { useMemo } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface RouteInfo {
  start?: string;
  end?: string;
  durationMs?: number;
  distanceM?: number;
  points: { lat: number; lon: number }[];
}

function lastRoute(events: BusEvent[]): RouteInfo | null {
  const e = events.filter((x) => x.type === "route_planned").at(-1);
  if (!e) return null;
  const p = e.payload;
  const raw = Array.isArray(p["route_points"]) ? (p["route_points"] as JsonObject[]) : [];
  return {
    start: typeof p["start"] === "string" ? p["start"] : undefined,
    end: typeof p["end"] === "string" ? p["end"] : undefined,
    durationMs: typeof p["duration_ms"] === "number" ? p["duration_ms"] : undefined,
    distanceM: typeof p["distance_m"] === "number" ? p["distance_m"] : undefined,
    points: raw
      .map((pt) => ({ lat: Number(pt["lat"]), lon: Number(pt["lon"]) }))
      .filter((pt) => Number.isFinite(pt.lat) && Number.isFinite(pt.lon)),
  };
}

/** Route block: turn-by-turn summary + canvas sketch of a planned route. */
export default function RouteBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const route = useMemo(() => lastRoute(events(state)), [state]);
  const pts = route?.points ?? [];
  const durMin = route?.durationMs ? Math.round(route.durationMs / 60000) : 0;

  return (
    <div className="block block-route" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">
          {route ? `${pts.length} pts · ${durMin} min · ${route.distanceM ?? 0} m` : "no route yet"}
        </span>
      </header>
      {route ? (
        <div className="block-route__body">
          <div className="block-route__stops">
            <RouteStop label="Start" text={route.start ?? "—"} />
            <RouteStop label="End" text={route.end ?? "—"} />
          </div>
          <RouteSketch points={pts} />
        </div>
      ) : (
        <div className="block__empty">waiting for route_planned</div>
      )}
    </div>
  );
}

function RouteStop({ label, text }: { label: string; text: string }): JSX.Element {
  return (
    <div className="block-route__stop">
      <span className="block-route__stop-label">{label}</span>
      <span className="block-route__stop-text">{text}</span>
    </div>
  );
}

function RouteSketch({ points }: { points: { lat: number; lon: number }[] }): JSX.Element {
  const latMin = Math.min(...points.map((p) => p.lat));
  const latMax = Math.max(...points.map((p) => p.lat));
  const lonMin = Math.min(...points.map((p) => p.lon));
  const lonMax = Math.max(...points.map((p) => p.lon));
  const span = Math.max(latMax - latMin, lonMax - lonMin, 1e-4) || 1e-4;
  const x = (p: { lon: number }) => ((p.lon - lonMin) / span) * 100;
  const y = (p: { lat: number }) => 100 - ((p.lat - latMin) / span) * 100;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="-4 -4 108 108" className="block-route__sketch" role="img" aria-label="route sketch">
      <polyline points={path.replace(/\b[ML]\b/g, "")} fill="none" stroke="var(--accent, #4f8cff)" strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p)} cy={y(p)} r="1.6" fill={i === 0 ? "#9ff7ae" : "#4f8cff"} />
      ))}
    </svg>
  );
}