import { useEffect, useRef } from "react";
import type { BlockManifest, BusEvent } from "@imagoro/core";
import type { BlockComponentProps } from "@imagoro/renderer-react";
import { payload } from "@imagoro/renderer-react";
import L from "leaflet";

export const manifest: BlockManifest = {
  id: "imagoro.map",
  name: "Integrated Map",
  version: "0.1.0",
  family: "map",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [520, 320] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/stream", "map/scene"]
};

export default function MapBlock({ ctx }: BlockComponentProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const map = L.map(el).setView([33.4484, -112.074], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    const off = ctx.subscribe((evt: BusEvent) => {
      const p = payload(evt);
      if (evt.type === "map/gps" || evt.type === "map/alert") {
        const lat = Number(p.lat);
        const lon = Number(p.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        if (evt.type === "map/gps") {
          map.panTo([lat, lon]);
        } else {
          L.marker([lat, lon]).addTo(map).bindPopup(String(p.label ?? "alert"));
        }
      }
    });

    return () => {
      off();
      map.remove();
    };
  }, [ctx]);

  return <div ref={ref} className="block-map" role="region" aria-label="live map block" />;
}