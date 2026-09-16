import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.terminal",
  name: "Terminal",
  version: "0.1.0",
  family: "terminal",
  substrates: ["react"],
  size: { min: [320, 160], ideal: [560, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/stream"]
};

interface TerminalState {
  pwd: string;
  running: boolean;
  prompt: string;
}

const initial: TerminalState = { pwd: "~", running: false, prompt: "$" };

function onTerminal(state: TerminalState, evt: BusEvent): TerminalState {
  if (evt.type === "terminal/state") {
    const p = payload(evt);
    return {
      pwd: String(p.pwd ?? state.pwd),
      running: Boolean(p.running ?? state.running),
      prompt: String(p.prompt ?? state.prompt)
    };
  }
  if (evt.type === "pipeline/run") {
    const status = String(payload(evt).status ?? "");
    return { ...state, running: status === "running" };
  }
  return state;
}

export default function TerminalBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onTerminal);
  return (
    <section className="block">
      <h3>Terminal</h3>
      <pre className="log-lines">
        <span className="muted">[{state.pwd}]&nbsp;</span>
        {state.prompt} <span className={`pill ${state.running ? "ok" : "mute"}`}>{state.running ? "running" : "idle"}</span>
      </pre>
    </section>
  );
}