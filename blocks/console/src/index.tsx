import type { BusEvent } from "@imagoro/core";
import { useBlockState, payload, type BlockComponentProps } from "@imagoro/renderer-react";

export { manifest } from "./manifest.js";

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