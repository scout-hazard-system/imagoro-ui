import { useMemo, useRef, useEffect } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface LogLine { ts: number; type: string; body: string; }

/** Console/log block: every BusEvent rendered as a log line with its payload summary. */
export default function ConsoleBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const listRef = useRef<HTMLUListElement>(null);
  const lines = useMemo<LogLine[]>(() => {
    return [...events(state)]
      .sort((a, b) => a.ts - b.ts)
      .slice(-500)
      .map((e) => ({ ts: e.ts, type: e.type, body: JSON.stringify(e.payload) }));
  }, [state]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className="block block-console" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{lines.length} lines</span>
      </header>
      <ul ref={listRef} className="block-console__log">
        {lines.map((l, i) => (
          <li key={`${l.ts}-${i}`} className="block-console__line">
            <time className="block-console__ts">{new Date(l.ts).toISOString().slice(11, 19)}</time>
            <span className="block-console__type">{l.type}</span>
            <span className="block-console__body">{l.body}</span>
          </li>
        ))}
        {lines.length === 0 && <li className="block__empty">no events</li>}
      </ul>
    </div>
  );
}