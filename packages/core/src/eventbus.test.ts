import { describe, expect, it } from "vitest";
import { normalizeBusEvent } from "./eventbus.js";

describe("normalizeBusEvent", () => {
  it("maps legacy event_type + top-level fields into BusEvent", () => {
    const raw = {
      event_type: "alert_triggered",
      ts: 123,
      kind: "llm_alert",
      alert: "fire response",
      lat: 34.05,
    };
    expect(normalizeBusEvent(raw)).toEqual({
      type: "alert_triggered",
      ts: 123,
      payload: { alert: "fire response", lat: 34.05 },
    });
  });

  it("supports kind and timestamp aliases", () => {
    const raw = { kind: "chunk_captured", timestamp: 456, transcript: "hello" };
    expect(normalizeBusEvent(raw)).toEqual({
      type: "chunk_captured",
      ts: 456,
      payload: { transcript: "hello" },
    });
  });

  it("returns null when no discriminator present", () => {
    expect(normalizeBusEvent({ hello: "world" })).toBeNull();
    expect(normalizeBusEvent(null as never)).toBeNull();
  });
});