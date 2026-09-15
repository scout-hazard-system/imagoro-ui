import type { Block, BlockContext, BusEvent } from "@imagoro/core";

/**
 * Dev-only sample block: renders the last N observed events as a scannable stream.
 * Demonstrates the core Block contract (mount/render/onEvent/unmount) with zero React.
 */
export class EventStreamBlock implements Block {
  readonly manifest = {
    id: "imagoro.dev.event-stream",
    name: "Event Stream (dev)",
    version: "0.1.0",
    family: "console",
    substrates: ["web"],
    size: { min: [2, 1] as [number, number], ideal: [4, 2] as [number, number] },
    ports: { in: [{ name: "events", type: "BusEvent" }], out: [] as [] },
    lifecycle: { autostart: true },
  };
  private ctx: BlockContext | null = null;
  private el: HTMLElement | null = null;
  private events: BusEvent[] = [];
  private uniforms: string[] = [];

  mount(el: HTMLElement, ctx: BlockContext): void {
    this.el = el;
    this.ctx = ctx;
    el.classList.add("bb-block", "bb-event-stream");
    const head = document.createElement("h3");
    head.textContent = "Event Stream";
    const box = document.createElement("div");
    box.className = "bb-stream";
    const foot = document.createElement("div");
    foot.className = "bb-foot";
    this.el.append(head, box, foot);
    ctx.subscribe((evt) => this.onEvent(evt));
    this.render({ events: this.events });
  }

  onEvent(evt: BusEvent): void {
    this.events.push(evt);
    if (this.events.length > 40) this.events.shift();
    this.render({ events: this.events });
  }

  render(state: { events?: BusEvent[] }): void {
    if (!this.el) return;
    const box = this.el.querySelector<HTMLElement>(".bb-stream");
    const foot = this.el.querySelector<HTMLElement>(".bb-foot");
    if (!box || !foot) return;
    const events = state.events ?? this.events;
    box.textContent = "";
    for (const e of events.slice(-20)) {
      const row = document.createElement("div");
      row.className = "bb-event";
      const tag = document.createElement("span");
      tag.className = "bb-ev-type";
      tag.textContent = e.type;
      row.appendChild(tag);
      const pre = document.createElement("code");
      pre.textContent = JSON.stringify(e.payload).slice(0, 140);
      row.appendChild(pre);
      box.appendChild(row);
    }
    foot.textContent = `${events.length} events • last ${events.at(-1)?.type ?? "–"}`;
  }

  unmount(): void {
    this.events = [];
    this.el = null;
    this.ctx = null;
  }
}