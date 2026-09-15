import { describe, expect, it } from "vitest";
import { parseFixtureSet } from "./fixtures.js";
import { loadFixtureSetFromNode, FIXTURES_PATH } from "./fixtures.node.js";

describe("fixtures", () => {
  it("parses the replay fixture set from disk", () => {
    const f = loadFixtureSetFromNode(FIXTURES_PATH);
    expect(f.meta.id).toMatch(/imagoro\.core\.fixtures/);
    expect(f.snapshot.metrics).toBeTruthy();
    expect(f.stream.length).toBeGreaterThan(10);
    for (const evt of f.stream) {
      expect(evt.type).toBeTruthy();
      expect(typeof evt.ts).toBe("number");
      expect(evt.payload).toBeTruthy();
    }
  });

  it("validates missing meta", () => {
    expect(() => parseFixtureSet('{"stream":[]}')).toThrow(/meta\.id/);
  });
});