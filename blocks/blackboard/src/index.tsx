import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.blackboard",
  name: "Blackboard",
  version: "0.1.0",
  family: "blackboard",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [480, 240] },
  ports: {
    in: [{ name: "snapshot", type: "blackboard/snapshot" }],
    out: [{ name: "values", type: "kv" }]
  },
  api: ["blackboard:pipeline", "pipeline/snapshot"]
};

interface BlackboardState {
  category: string;
  values: Record<string, unknown>;
}

const initial: BlackboardState = { category: "pipeline", values: {} };

function onBlackboard(state: BlackboardState, evt: BusEvent): BlackboardState {
  if (evt.type === "pipeline/snapshot") {
    const bb = payload(evt).blackboard as Record<string, Record<string, unknown>> | undefined;
    const values = bb?.[state.category];
    return values ? { ...state, values: { ...values } } : state;
  }
  if (evt.type === "blackboard/snapshot") {
    const p = payload(evt);
    const values = p.values as Record<string, unknown> | undefined;
    return {
      category: String(p.category ?? state.category),
      values: values ? { ...values } : state.values
    };
  }
  return state;
}

export default function BlackboardBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onBlackboard);
  return (
    <section className="block">
      <h3>Blackboard · {state.category}</h3>
      <dl className="kv">
        {Object.entries(state.values).map(([k, v]) => (
          <span key={k}>
            <dt>{k}</dt>
            <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
          </span>
        ))}
      </dl>
    </section>
  );
}