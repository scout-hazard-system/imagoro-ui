import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

export function mapEvents(state: JsonObject): BusEvent[] {
  const evts = state.events;
  return Array.isArray(evts) ? (evts as BusEvent[]) : [];
}

interface RoutePoint { lat: number; lon: number; }

function alerts(events: BusEvent[]): { lat: number; lon: number; text: string }[] {
  return events
    .filter((e) => e.type === "alert_triggered")
    .map((e) => ({
      lat: Number(e.payload["lat"]),
      lon: Number(e.payload["lon"]),
      text: String(e.payload["alert"] ?? ""),
    }))
    .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lon));
}

function routePoints(events: BusEvent[]): RoutePoint[] {
  const e = events.filter((x) => x.type === "route_planned").at(-1);
  const pts = e?.payload["route_points"];
  if (!Array.isArray(pts)) return [];
  return pts
    .map((p) => ({ lat: Number((p as JsonObject)["lat"]), lon: Number((p as JsonObject)["lon"]) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
}

/** Map block: Leaflet canvas, plotted from alert_triggered coords + route_planned polyline.
 *  Fallback (jsdom / offline / no WebGL): a static coordinate grid so the block always renders. */
export default function MapBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [degraded, setDegraded] = useState(false);

  const alertsList = alerts(mapEvents(state));
  const waypoints = routePoints(mapEvents(state));

  // jsdom / headless: no real layout, Leaflet cannot measure the container.
  const isHeadless = typeof navigator !== "undefined" && /jsdom/.test(navigator.userAgent);

  useEffect(() => {
    const el = divRef.current;
    if (!el || typeof window === "undefined") return;
    if (isHeadless) {
      setDegraded(true);
      return;
    }
    try {
      const m = L.map(el, { center: [34.04, -118.25], zoom: 10 });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(m);
      layerRef.current = L.layerGroup().addTo(m);
      mapRef.current = m;
    } catch {
      setDegraded(true);
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const m = mapRef.current;
    if (!layer || !m) return;
    layer.clearLayers();
    for (const a of alertsList) {
      L.circleMarker([a.lat, a.lon], { radius: 9, color: "#ff5252", fillOpacity: 0.4 })
        .bindPopup(a.text)
        .addTo(layer);
    }
    if (waypoints.length >= 2) {
      L.polyline(waypoints.map((p) => [p.lat, p.lon] satisfies [number, number]), {
        color: "#4f8cff",
        weight: 3,
      }).addTo(layer);
    }
    const last = alertsList.at(-1);
    if (last) m.setView([last.lat, last.lon], 12);
  }, [alertsList, waypoints]);

  const lastAlert = alertsList.at(-1);

  return (
    <div className="block block-map" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{alertsList.length} alerts · {waypoints.length} route pts</span>
      </header>
      <div ref={divRef} className="block-map__canvas" />
      {degraded && (
        <div className="block-map__fallback" data-testid="map-fallback">
          <div className="block-map__grid" aria-hidden="true" />
          {waypoints.map((p, i) => (
            <span key={i} className="block-map__marker" style={{ left: `${(p.lon + 118.25) * 20}%`, top: `${(34.05 - p.lat) * 20}%` }} />
          ))}
          {lastAlert && <span className="block-map__marker block-map__marker--alert" title={lastAlert.text} />}
        </div>
      )}
    </div>
  );
}