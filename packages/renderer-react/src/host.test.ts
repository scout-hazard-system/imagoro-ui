import { describe, expect, it } from "vitest";
import type { BusEvent } from "@imagoro/core";
import { ReactBlockHost, makeCtx, payload, type BlockEntry } from "./host.js";

describe("ReactBlockHost", () => {
  it("registers and lists entries", () => {
    const host = new ReactBlockHost();
    host.register("t.one", {
      manifest: {
        id: "t.one",
        name: "Test",
        version: "0.1.0",
        family: "metrics",
        substrates: ["react"],
        size: { min: [100, 100], ideal: [200, 200] },
        ports: { in: [], out: [] }
      },
      Component: () => null
    });
    expect(host.size).toBe(1);
    expect(host.ids()).toEqual(["t.one"]);
  });

  it("rejects mismatched id and conflicting versions", () => {
    const host = new ReactBlockHost();
    const entry: BlockEntry = {
      manifest: {
        id: "t.one",
        name: "Test",
        version: "0.1.0",
        family: "metrics",
        substrates: ["react"],
        size: { min: [100, 100], ideal: [200, 200] },
        ports: { in: [], out: [] }
      },
      Component: () => null
    };
    expect(() => host.register("t.other", entry)).toThrow("must equal registration id");
    host.register("t.one", entry);
    expect(() => host.register("t.one", { ...entry, manifest: { ...entry.manifest, version: "0.2.0" } })).toThrow(
      "refusing"
    );
  });
});

describe("ctx + payload", () => {
  it("makeCtx bridges dispatch and subscribe", () => {
    const seen: BusEvent[] = [];
    const bus = {
      dispatch: (e: BusEvent) => seen.push(e),
      subscribe: (fn: (e: BusEvent) => void) => {
        const off = () => {};
        void fn;
        return off;
      }
    };
    const ctx = makeCtx({ k: "v" }, bus);
    expect(ctx.config).toEqual({ k: "v" });
    const e = { type: "t", ts: 1, payload: { x: 1 } } as BusEvent;
    expect(payload(e)).toEqual({ x: 1 });
  });
});