import { useMemo, useState, useRef, useEffect } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface TermLine { text: string; className: string; }

/** Terminal block: read-only live feed of pipeline/ops events rendered monospace. */
export default function TerminalBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const [input, setInput] = useState("");
  const outRef = useRef<HTMLDivElement>(null);
  const lines = useMemo<TermLine[]>(() => {
    const evs = [...events(state)].sort((a, b) => a.ts - b.ts);
    const out: TermLine[] = [
      { className: "t-dim", text: "imagoro-ui terminal v0.1 — listen only (M2)" },
    ];
    for (const e of evs) {
      const t = new Date(e.ts).toISOString().slice(11, 19);
      if (e.type === "alert_triggered") {
        out.push({ className: "t-alert", text: `[${t}] ! ${String(e.payload["kind"] ?? "alert")}: ${String(e.payload["alert"] ?? "")}` });
      } else if (e.type === "pipeline_ready") {
        out.push({ className: "t-ok", text: `[${t}] pipeline ready @ ${String(e.payload["host"] ?? "")}` });
      } else if (e.type === "run_summary") {
        out.push({ className: "t-dim", text: `[${t}] summary: ${JSON.stringify(e.payload)}` });
      } else if (e.type === "chunk_captured") {
        out.push({ className: "t-info", text: `[${t}] chunk captured (e=${String(e.payload["energy"] ?? "?")} rms=${String(e.payload["rms"] ?? "?")})` });
      } else {
        out.push({ className: "t-dim", text: `[${t}] ${e.type} ${Object.keys(e.payload).length ? `(${Object.keys(e.payload).join(",")})` : ""}` });
      }
    }
    return out.slice(-200);
  }, [state]);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const submit = (): void => {
    setInput("");
  };

  return (
    <div className="block block-terminal" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{lines.length} lines</span>
      </header>
      <div ref={outRef} className="block-terminal__screen">
        {lines.map((l, i) => (
          <div key={i} className={`block-terminal__line ${l.className}`}>{l.text}</div>
        ))}
      </div>
      <form
        className="block-terminal__bar"
        onSubmit={(ev) => {
          ev.preventDefault();
          submit();
        }}
      >
        <span className="block-terminal__prompt">$</span>
        <input
          className="block-terminal__input"
          value={input}
          onChange={(ev) => setInput(ev.target.value)}
          placeholder="read-only in M2"
          aria-label="terminal input"
        />
      </form>
    </div>
  );
}