import { useMemo } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface Stage { name: string; count: number; ok: boolean; }

/** Pipeline monitor: pipeline_ready → chunk lifecycle → run_summary, with running counters. */
export default function PipelineBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const view = useMemo(() => {
    const evs = events(state);
    const ready = evs.some((e) => e.type === "pipeline_ready");
    const summary = evs.filter((e) => e.type === "run_summary").at(-1);
    const summaryPayload = summary?.payload ?? {};
    const counts = (k: string): number => {
      if (typeof summaryPayload[k] === "number") return Number(summaryPayload[k]);
      return evs.filter((e) => e.type === k).length;
    };
    const stages: Stage[] = [
      { name: "capture", count: counts("chunk_captured"), ok: true },
      { name: "skip(silence)", count: counts("chunk_skipped_silence"), ok: true },
      { name: "skip(clipped)", count: counts("chunk_skipped_clipped"), ok: true },
      { name: "alerts", count: counts("alert_triggered"), ok: true },
    ];
    return { ready, host: typeof evs.filter((e) => e.type === "pipeline_ready").at(-1)?.payload?.["host"] === "string" ? (evs.filter((e) => e.type === "pipeline_ready").at(-1)?.payload?.["host"] as string) : undefined, stages };
  }, [state]);

  return (
    <div className="block block-pipeline" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{view.ready ? "ready" : "starting…"}</span>
      </header>
      <div className="block-pipeline__status">
        {view.ready ? (
          <span className="block-pipeline__dot block-pipeline__dot--ok">●</span>
        ) : (
          <span className="block-pipeline__dot">○</span>
        )}
        <span>pipeline @ {view.host ?? "?"}</span>
      </div>
      <div className="block-pipeline__stages">
        {view.stages.map((s) => (
          <div className="block-pipeline__stage" key={s.name}>
            <span className="block-pipeline__stage-name">{s.name}</span>
            <span className="block-pipeline__stage-count">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}