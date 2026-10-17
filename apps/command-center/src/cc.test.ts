import { describe, expect, it } from "vitest";
import { SECTIONS } from "./sections.js";

describe("command-center sections", () => {
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

  it("every slot references a registered block id", () => {
    const known = new Set([
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
      "imagoro.sidebar",
      "engine.map.inspector",
      "engine.map.tools",
      "engine.map.structural",
      "engine.map.sync",
      "engine.map.terrain",
      "engine.map.scene",
      "engine.map.prefabs",
      "engine.model.camera",
      "engine.model.locomotion",
      "engine.model.character",
      "engine.model.weapons",
      "engine.visuals.params",
      "engine.visuals.presets",
      "engine.visuals.lighting",
      "engine.status.telemetry",
      "engine.console.log"
    ]);
    for (const s of SECTIONS) {
      for (const slot of s.slots) expect(known.has(slot.block)).toBe(true);
    }
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