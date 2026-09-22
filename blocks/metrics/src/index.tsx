import type { BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

interface MetricsState {
  captured: number;
  skippedSilence: number;
  skippedClipped: number;
  llmAlert: number;
  softFallback: number;
  jurisdictionCount: number;
}

const initial: MetricsState = {
  captured: 0,
  skippedSilence: 0,
  skippedClipped: 0,
  llmAlert: 0,
  softFallback: 0,
  jurisdictionCount: 0
};

function onMetrics(state: MetricsState, evt: BusEvent): MetricsState {
  if (evt.type === "pipeline/snapshot") {
    const m = payload(evt).metrics as MetricsState | undefined;
    return m ? { ...state, ...m } : state;
  }
  if (evt.type === "metrics/update") {
    return { ...state, ...(payload(evt) as Partial<MetricsState>) };
  }
  return state;
}

export default function MetricsBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onMetrics);
  const rows: Array<[string, number]> = [
    ["Captured", state.captured],
    ["Skipped silence", state.skippedSilence],
    ["Skipped clipped", state.skippedClipped],
    ["LLM alerts", state.llmAlert],
    ["Fallback alerts", state.softFallback],
    ["Jurisdiction", state.jurisdictionCount]
  ];
  return (
    <section className="block">
      <h3>Run Metrics</h3>
      <div className="metrics-row">
        {rows.map(([label, value]) => (
          <div className="metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}