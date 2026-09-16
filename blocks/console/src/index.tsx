import type { BlockManifest, BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export const manifest: BlockManifest = {
  id: "imagoro.console",
  name: "Console",
  version: "0.1.0",
  family: "console",
  substrates: ["react"],
  size: { min: [320, 140], ideal: [560, 260] },
  ports: { in: [{ name: "events", type: "event[]" }], out: [] },
  api: ["pipeline/stream"]
};

interface ConsoleState {
  lines: string[];
}

const initial: ConsoleState = { lines: ["[imagoro] console block ready"] };

function onConsole(state: ConsoleState, evt: BusEvent): ConsoleState {
  if (evt.type === "console/log") {
    const line = String(payload(evt).line ?? "");
    if (!line) return state;
    return { lines: [...state.lines.slice(-200), line] };
  }
  return state;
}

export default function ConsoleBlock({ ctx }: BlockComponentProps) {
  const state = useBlockState(ctx, initial, onConsole);
  return (
    <section className="block">
      <h3>Console</h3>
      <pre className="log-lines">{state.lines.join("\n")}</pre>
    </section>
  );
}