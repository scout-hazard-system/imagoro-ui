import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.pipeline",
  name: "Pipeline Monitor",
  version: "0.1.0",
  family: "pipeline",
  substrates: ["react"],
  size: { min: [320, 140], ideal: [520, 200] },
  ports: {
    in: [{ name: "run", type: "pipeline/run" }],
    out: [{ name: "state", type: "pipeline/state" }]
  },
  api: ["pipeline/snapshot", "pipeline/stream"]
};

interface PipelineState {
  status: string;
  phase: string;
  started: number;
  artifact: string;
}

const initial: PipelineState = { status: "idle", phase: "—", started: 0, artifact: "—" };

function onPipeline(state: PipelineState, evt: BusEvent): PipelineState {
  if (evt.type === "pipeline/snapshot") {
    const run = payload(evt).run as PipelineState | undefined;
    return run ? { ...state, ...run } : state;
  }
  if (evt.type === "pipeline/run") {
    const p = payload(evt);
    return {
      status: String(p.status ?? state.status),
      phase: String(p.phase ?? state.phase),
      started: Number(p.started ?? state.started),
      artifact: String(p.artifact ?? state.artifact)
    };
  }
  return state;
}

export default function PipelineBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onPipeline);
  return (
    <section className="block">
      <h3>Pipeline Monitor</h3>
      <dl className="kv">
        <dt>Status</dt>
        <dd>
          <span className={`pill ${state.status === "running" ? "ok" : "mute"}`}>{state.status}</span>
        </dd>
        <dt>Phase</dt>
        <dd>{state.phase}</dd>
        <dt>Started</dt>
        <dd>{state.started ? new Date(state.started).toLocaleTimeString() : "—"}</dd>
        <dt>Artifact</dt>
        <dd>{state.artifact}</dd>
      </dl>
    </section>
  );
}