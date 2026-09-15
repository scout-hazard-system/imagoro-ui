import { describe, expect, it, vi } from "vitest";
import { BlockRegistry } from "./registry.js";
import type { Block, BlockContext, BlockManifest } from "./types.js";

function makeBlock(id: string, onEvent = vi.fn()): Block {
  const manifest: BlockManifest = {
    id,
    name: id,
    version: "0.1.0",
    family: "metrics",
    substrates: ["react"],
    size: { min: [1, 1], ideal: [2, 2] },
    ports: { in: [], out: [] },
    lifecycle: { autostart: true },
  };
  return {
    manifest,
    mount: vi.fn((el: HTMLElement, ctx: BlockContext) => {
      el.dataset["mounted"] = id;
    }),
    render: vi.fn(),
    onEvent,
    unmount: vi.fn(),
  };
}

describe("BlockRegistry", () => {
  it("registers, lists manifests, mounts and dispatches to mounted blocks in order", () => {
    const r = new BlockRegistry();
    const a = makeBlock("a");
    const b = makeBlock("b");
    r.register("a", a);
    r.register("b", b);
    expect(r.list().map((m) => m.id)).toEqual(["a", "b"]);

    const slotA = document.createElement("div");
    const slotB = document.createElement("div");
    r.mount(slotA, { id: "a", config: { x: 1 } });
    r.mount(slotB, { id: "b" });
    expect(slotA.dataset["mounted"]).toBe("a");
    expect(slotB.dataset["mounted"]).toBe("b");

    const evt = { type: "t", ts: 1, payload: {} };
    r.dispatch(evt);
    expect(a.onEvent).toHaveBeenCalledWith(evt);
    expect(b.onEvent).toHaveBeenCalledWith(evt);
    const aOrder = (a.onEvent as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0] ?? 0;
    const bOrder = (b.onEvent as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0] ?? 0;
    expect(aOrder).toBeLessThan(bOrder);
  });

  it("unmounts via handle and stops receiving events", () => {
    const r = new BlockRegistry();
    const a = makeBlock("a");
    r.register("a", a);
    const h = r.mount(document.createElement("div"), { id: "a" });
    expect(r.size).toBe(1);
    h.unmount();
    expect(r.size).toBe(0);
    expect(a.unmount).toHaveBeenCalledTimes(1);
    r.dispatch({ type: "t", ts: 1, payload: {} });
    expect(a.onEvent).not.toHaveBeenCalled();
  });

  it("throws when mounting an unknown block", () => {
    const r = new BlockRegistry();
    expect(() => r.mount(document.createElement("div"), { id: "nope" })).toThrow(/not registered/);
  });

  it("unregister tears down its mounts", () => {
    const r = new BlockRegistry();
    const a = makeBlock("a");
    r.register("a", a);
    r.mount(document.createElement("div"), { id: "a" });
    r.unregister("a");
    expect(r.size).toBe(0);
    expect(r.list()).toEqual([]);
  });
});