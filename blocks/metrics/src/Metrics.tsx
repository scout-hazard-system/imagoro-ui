import { useMemo } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface MetricRow { key: string; label: string; value: number; }

/** Metrics block: run counters from snapshot.metrics + latest run_summary payload. */
export default function MetricsBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const rows = useMemo<MetricRow[]>(() => {
    const snapshot = state["snapshot"] as JsonObject | undefined;
    const snap = snapshot?.["metrics"] as JsonObject | undefined;
    const evts = events(state);
    const sum = evts.filter((e) => e.type === "run_summary").at(-1)?.payload;
    const src = (sum ?? snap ?? {}) as JsonObject;
    const labels: [string, string][] = [
      ["captured", "Captured"],
      ["skipped_silence", "Skip (silence)"],
      ["skipped_clipped", "Skip (clipped)"],
      ["llm_alert", "LLM alerts"],
      ["soft_alert_fallback", "Soft fallback"],
    ];
    return labels
      .filter(([k]) => typeof src[k] === "number")
      .map(([k, label]) => ({ key: k, label, value: Number(src[k]) }));
  }, [state]);

  return (
    <div className="block block-metrics" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{rows.length} counters</span>
      </header>
      <div className="block-metrics__grid">
        {rows.map((r) => (
          <div className="block-metrics__cell" key={r.key}>
            <span className="block-metrics__value">{r.value}</span>
            <span className="block-metrics__label">{r.label}</span>
          </div>
        ))}
        {rows.length === 0 && <div className="block__empty">no metrics yet</div>}
      </div>
    </div>
  );
}