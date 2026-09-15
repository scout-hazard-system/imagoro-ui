import { useMemo } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface AuditItem { ts: number; kind: string; text: string; }

/** Audit / notification block: alert_triggered events as an acknowledgement feed. */
export default function AuditBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const items = useMemo<AuditItem[]>(() => {
    const alerts = events(state)
      .filter((e) => e.type === "alert_triggered")
      .map((e) => ({
        ts: e.ts,
        kind: String(e.payload["kind"] ?? "alerts"),
        text: String(e.payload["alert"] ?? "—"),
      }))
      .reverse();
    const blackboard = events(state)
      .filter((e) => e.type === "blackboard_entry")
      .map((e) => ({
        ts: e.ts,
        kind: "log",
        text: `${String(e.payload["role"] ?? "info")}: ${String(e.payload["title"] ?? "—")}`,
      }))
      .reverse();
    return [...alerts, ...blackboard].sort((a, b) => b.ts - a.ts);
  }, [state]);

  return (
    <div className="block block-audit" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{items.length} items</span>
      </header>
      <ul className="block-audit__list">
        {items.map((it, i) => (
          <li key={`${it.ts}-${i}`} className={`block-audit__item block-audit__item--${it.kind}`}>
            <span className="block-audit__kind">{it.kind}</span>
            <span className="block-audit__text">{it.text}</span>
            <time className="block-audit__time">{new Date(it.ts).toLocaleTimeString()}</time>
          </li>
        ))}
        {items.length === 0 && <li className="block__empty">no alerts yet</li>}
      </ul>
    </div>
  );
}