import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.route",
  name: "Route Planner",
  version: "0.1.0",
  family: "route",
  substrates: ["react"],
  size: { min: [320, 240], ideal: [520, 360] },
  ports: {
    in: [{ name: "gps", type: "coordinate" }],
    out: [{ name: "route", type: "route" }]
  },
  api: ["pipeline/stream"]
};

interface RouteState {
  start: string;
  end: string;
  stops: string[];
  status: string;
}

function onRoute(state: RouteState, evt: BusEvent): RouteState {
  if (evt.type === "pipeline/run") {
    return { ...state, status: String(payload(evt).phase ?? payload(evt).status ?? "") };
  }
  if (evt.type === "pipeline/snapshot") {
    const run = payload(evt).run as Record<string, unknown> | undefined;
    return run ? { ...state, status: String(run.phase ?? "") } : state;
  }
  return state;
}

export default function RouteBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState<RouteState>(ctx, {
    start: String(ctx.config.start ?? ""),
    end: String(ctx.config.end ?? ""),
    stops: [],
    status: "idle"
  }, onRoute);

  return (
    <section className="block">
      <h3>Route Planner</h3>
      <div className="row">
        <input className="field" placeholder="Start (address or lat,lon)" defaultValue={state.start} />
        <input className="field" placeholder="Destination" defaultValue={state.end} />
      </div>
      <ul className="list">
        {state.stops.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <div className="row">
        <button className="btn" type="button" disabled={!state.end}>
          Plan route
        </button>
        <span className={`pill ${state.status === "idle" ? "mute" : "warn"}`}>{state.status}</span>
      </div>
    </section>
  );
}