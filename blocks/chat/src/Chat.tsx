import { useMemo, useState } from "react";
import type { BlockRenderProps, BusEvent, JsonObject } from "@imagoro/core";

function events(state: JsonObject): BusEvent[] {
  const e = state["events"];
  return Array.isArray(e) ? (e as BusEvent[]) : [];
}

interface Msg { id: string; ts: number; kind: string; text: string; }

/** Chat block: transcript messages from chunk_captured + alert transcripts + blackboard entries. */
export default function ChatBlock({ manifest, state }: BlockRenderProps): JSX.Element {
  const [draft, setDraft] = useState("");
  const msgs = useMemo<Msg[]>(() => {
    const out: Msg[] = [];
    for (const e of events(state)) {
      if (e.type === "chunk_captured" && typeof e.payload["transcript"] === "string") {
        out.push({ id: `${e.ts}-t`, ts: e.ts, kind: "radio", text: e.payload["transcript"] as string });
      } else if (e.type === "alert_triggered" && typeof e.payload["alert"] === "string") {
        out.push({ id: `${e.ts}-a`, ts: e.ts, kind: "alert", text: e.payload["alert"] as string });
      } else if (e.type === "blackboard_entry" && typeof e.payload["title"] === "string") {
        out.push({ id: `${e.ts}-b`, ts: e.ts, kind: "board", text: e.payload["title"] as string });
      }
    }
    return out;
  }, [state]);

  const submit = (): void => {
    if (!draft.trim()) return;
    setDraft("");
  };

  return (
    <div className="block block-chat" data-mid={manifest.id}>
      <header className="block__head">
        <span className="block__title">{manifest.name}</span>
        <span className="block__hint">{msgs.length} msgs</span>
      </header>
      <ul className="block-chat__thread">
        {msgs.map((m) => (
          <li key={m.id} className={`block-chat__msg block-chat__msg--${m.kind}`}>
            <span className="block-chat__bubble">{m.text}</span>
            <time className="block-chat__time">{new Date(m.ts).toLocaleTimeString()}</time>
          </li>
        ))}
        {msgs.length === 0 && <li className="block__empty">no messages</li>}
      </ul>
      <form
        className="block-chat__compose"
        onSubmit={(ev) => {
          ev.preventDefault();
          submit();
        }}
      >
        <input
          className="block-chat__input"
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          placeholder="Say something…"
          aria-label="chat input"
        />
        <button className="block-chat__send" type="submit">Send</button>
      </form>
    </div>
  );
}