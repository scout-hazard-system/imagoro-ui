import { useMemo } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface Entry { ts: number; category: string; role: string; kind: string; title: string; body: string; tags: string[]; }

/** Blackboard watcher: entries from blackboard_entry events (mirrors scout_crew blackboard category/role/kind). */
export default function BlackboardBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const entries = useMemo<Entry[]>(() => {
    return events(state)
      .filter((e) => e.type === "blackboard_entry")
      .map((e) => ({
        ts: e.ts,
        category: String(e.payload["category"] ?? "?"),
        role: String(e.payload["role"] ?? "?"),
        kind: String(e.payload["kind"] ?? "?"),
        title: String(e.payload["title"] ?? "Untitled"),
        body: String(e.payload["body"] ?? ""),
        tags: Array.isArray(e.payload["tags"]) ? (e.payload["tags"] as string[]) : [],
      }))
      .reverse();
  }, [state]);

  return (
    <div className="block block-blackboard" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{entries.length} entries</span>
      </header>
      <ul className="block-blackboard__list">
        {entries.map((en, i) => (
          <li key={`${en.ts}-${i}`} className="block-blackboard__entry">
            <div className="block-blackboard__meta">
              <span className="block-blackboard__cat">{en.category}</span>
              <span className="block-blackboard__role">{en.role}/{en.kind}</span>
              <time className="block-blackboard__ts">{new Date(en.ts).toLocaleTimeString()}</time>
            </div>
            <div className="block-blackboard__title">{en.title}</div>
            {en.body && <div className="block-blackboard__body">{en.body}</div>}
            {en.tags.length > 0 && (
              <div className="block-blackboard__tags">{en.tags.map((t) => <span key={t} className="block-blackboard__tag">{t}</span>)}</div>
            )}
          </li>
        ))}
        {entries.length === 0 && <li className="block__empty">no blackboard entries</li>}
      </ul>
    </div>
  );
}