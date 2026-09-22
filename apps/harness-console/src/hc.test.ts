import { describe, expect, it } from "vitest";
import { SECTIONS } from "./sections.js";
import { toolResultEvent, mcpErrorEvent } from "./mcp.js";

const KNOWN = new Set([
  "imagoro.map",
  "imagoro.route",
  "imagoro.metrics",
  "imagoro.audit",
  "imagoro.weather",
  "imagoro.visualizer",
  "imagoro.chat",
  "imagoro.console",
  "imagoro.terminal",
  "imagoro.blackboard",
  "imagoro.pipeline",
  "imagoro.graph",
  "imagoro.intent",
  "imagoro.sidebar"
]);

describe("harness-console sections", () => {
  it("declares at least five workspaces", () => {
    expect(SECTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("each section has unique id, label and non-empty slots", () => {
    const ids = new Set<string>();
    for (const s of SECTIONS) {
      expect(s.id).toMatch(/^[a-z]+$/);
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.blurb.length).toBeGreaterThan(0);
      expect(s.slots.length).toBeGreaterThan(0);
    }
  });

  it("every slot references a registered block id and mandates the blackboard+console surface", () => {
    const all = SECTIONS.flatMap((s) => s.slots).map((slot) => slot.block);
    for (const block of all) expect(KNOWN.has(block)).toBe(true);
    expect(all).toContain("imagoro.blackboard");
    expect(all).toContain("imagoro.console");
    expect(all).toContain("imagoro.terminal");
  });

  it("MCP client emits bus-mineable events (console/log) only", () => {
    const evt = toolResultEvent("scout_status", "ok");
    expect(evt.type).toBe("console/log");
    expect(typeof evt.payload.line).toBe("string");
    const err = mcpErrorEvent("scout_status", new Error("boom"));
    expect(err.type).toBe("console/log");
    expect(String(err.payload.line)).toContain("boom");
  });

  it("no duplicate slot within a section", () => {
    for (const s of SECTIONS) {
      const seen = new Set<string>();
      for (const slot of s.slots) {
        expect(seen.has(slot.block)).toBe(false);
        seen.add(slot.block);
      }
    }
  });
});