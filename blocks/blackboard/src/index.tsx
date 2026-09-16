import { canRead, maskSnapshot, normalizeRole, ROLE_LABEL, type Role } from "@imagoro/core";
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
  api: ["blackboard:pipeline", "pipeline/snapshot", "acl/role"]
};

interface BlackboardState {
  category: string;
  role: Role;
  values: Record<string, unknown>;
  masked: boolean;
}

function snapshotValue(v: unknown): string {
  return typeof v === "object" && v !== null ? (JSON.stringify(v) ?? String(v)) : String(v);
}

function onBlackboard(state: BlackboardState, evt: BusEvent): BlackboardState {
  const role = state.role;
  if (evt.type === "pipeline/snapshot") {
    const bb = payload(evt).blackboard as Record<string, Record<string, unknown>> | undefined;
    if (!bb) return state;
    const masked = maskSnapshot(role, bb as Record<string, unknown>);
    return { ...state, values: masked, masked: false };
  }
  if (evt.type === "blackboard/snapshot") {
    const p = payload(evt);
    const category = String(p.category ?? state.category);
    const values = p.values as Record<string, unknown> | undefined;
    if (!values) return state;
    const permitted = canRead(role, category, "summary");
    return {
      category,
      role,
      values: permitted ? values : { masked: true, reason: "acl:category" },
      masked: !permitted
    };
  }
  return state;
}

export default function BlackboardBlock({ ctx }: BlockComponentProps) {
  const role = normalizeRole(ctx.config.role);
  const state = useBlockState(ctx, { category: "pipeline", role, values: {}, masked: false }, onBlackboard);
  return (
    <section className="block">
      <div className="row">
        <h3>Blackboard · {state.category}</h3>
        <span className={`pill ${state.masked ? "warn" : "mute"}`}>{ROLE_LABEL[state.role]}</span>
      </div>
      <dl className="kv">
        {Object.entries(state.values).map(([k, v]) =>
          v && typeof v === "object" && (v as { masked?: boolean }).masked ? (
            <span key={k}>
              <dt>{k}</dt>
              <dd className="muted">(masked — ACL)</dd>
            </span>
          ) : (
            <span key={k}>
              <dt>{k}</dt>
              <dd>{snapshotValue(v)}</dd>
            </span>
          )
        )}
      </dl>
    </section>
  );
}