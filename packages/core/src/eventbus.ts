import type { BusEvent, JsonObject, LegacyEvent } from "./types.js";

/**
 * Normalize a legacy protocol event into the canonical BusEvent shape.
 *
 * Legacy sources (routing dev_server / pipeline SSE, blackboard HTTP store) emit flat JSON
 * where the discriminator is `event_type` (or `kind`) and the remaining fields sit at the
 * top level. Blocks only ever see canonical `{ type, ts, payload }`.
 */
export function normalizeBusEvent(raw: LegacyEvent): BusEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const type =
    typeof raw["event_type"] === "string"
      ? (raw["event_type"] as string)
      : typeof raw["kind"] === "string"
        ? (raw["kind"] as string)
        : typeof raw["type"] === "string"
          ? (raw["type"] as string)
          : null;
  if (!type) return null;
  const ts =
    typeof raw["ts"] === "number"
      ? (raw["ts"] as number)
      : typeof raw["timestamp"] === "number"
        ? (raw["timestamp"] as number)
        : Date.now();
  const payload: JsonObject = { ...raw };
  delete payload["event_type"];
  delete payload["kind"];
  delete payload["type"];
  delete payload["ts"];
  delete payload["timestamp"];
  return { type, ts, payload };
}

export type EventListener = (evt: BusEvent) => void;

export interface EventSourceLike {
  connect(onEvent: (evt: BusEvent) => void, onStatus?: (status: string) => void): () => void;
}

/** In-process event bus: a typed emitter with subscribe/unsubscribe and ordered fan-out. */
export class EventBus {
  private listeners = new Set<EventListener>();
  private history: BusEvent[] = [];

  subscribe(fn: EventListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  publish(evt: BusEvent): void {
    this.history.push(evt);
    if (this.history.length > 500) this.history.shift();
    for (const fn of this.listeners) {
      try {
        fn(evt);
      } catch (err) {
        // A bad listener must not break the bus for everyone else.
        console.error("[eventbus] listener threw:", err);
      }
    }
  }

  /** Replay previously published events into `fn` (used by blocks on mount, `autostart`). */
  replay(fn: EventListener): void {
    for (const evt of this.history) fn(evt);
  }

  get size(): number {
    return this.listeners.size;
  }
}

/** SSE client wiring for `/api/pipeline/stream`. Browser EventSource based, drain-protected. */
export class SseClient implements EventSourceLike {
  constructor(
    private readonly url: string,
    private readonly reconnectMs = 2500,
  ) {}

  connect(onEvent: (evt: BusEvent) => void, onStatus?: (status: string) => void): () => void {
    let closed = false;
    let source: EventSource | null = null;

    const open = () => {
      if (closed) return;
      const es = new EventSource(this.url);
      source = es;
      es.onopen = () => onStatus?.("open");
      es.onmessage = (msg) => {
        try {
          const raw = JSON.parse(msg.data) as JsonObject;
          const evt = normalizeBusEvent(raw);
          if (evt) onEvent(evt);
        } catch {
          onStatus?.("parse-error");
        }
      };
      es.onerror = () => {
        es.close();
        onStatus?.("reconnecting");
        if (!closed) setTimeout(open, this.reconnectMs);
      };
    };

    open();
    return () => {
      closed = true;
      source?.close();
    };
  }
}

/** SSE snapshot fallback (`/api/pipeline/snapshot`) + event stream replay. */
export async function fetchSnapshot(
  url: string,
): Promise<{ snapshot: JsonObject; events: BusEvent[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  const raw = (await res.json()) as JsonObject;
  const events: BusEvent[] = [];
  const recent = Array.isArray(raw["recentEvents"]) ? (raw["recentEvents"] as JsonObject[]) : [];
  for (const ev of recent) {
    const norm = normalizeBusEvent(ev);
    if (norm) events.push(norm);
  }
  return { snapshot: raw, events };
}