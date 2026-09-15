import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlackboardClient } from "./blackboard.js";

describe("BlackboardClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads with category query and auth header", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ category: "pipeline", kind: "raw" }],
    });
    const c = new BlackboardClient("http://127.0.0.1:8765", "tok-123");
    const out = await c.read({ category: "pipeline", role: "alert", limit: 5 });
    expect(out.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/read?category=pipeline&role=alert&limit=5",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok-123" }) }),
    );
  });

  it("writes via POST /v1/write", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    const c = new BlackboardClient("http://127.0.0.1:8765");
    const out = await c.write({ category: "pipeline", role: "alert", kind: "raw", title: "t", body: "b" });
    expect(out.id).toBe(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:8765/v1/write");
    expect(init.method).toBe("POST");
  });

  it("snapshots with default hermes role", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ pipeline: [] }) });
    const c = new BlackboardClient("http://127.0.0.1:8765");
    await c.snapshot();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/snapshot?role=hermes&limit_per_category=15",
      expect.anything(),
    );
  });

  it("throws on non-ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    const c = new BlackboardClient("http://127.0.0.1:8765");
    await expect(c.read({ category: "pipeline" })).rejects.toThrow(/403/);
  });
});