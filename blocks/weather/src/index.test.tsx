import { describe, expect, it } from "vitest";
import pkg from "./index.js";
import { manifest } from "./manifest.js";

describe("@imagoro/block-weather manifest", () => {
  it("exposes a valid BlockManifest", () => {
    expect(manifest.id).toMatch(/^imagoro\.block\./);
    expect(manifest.family).toBeTruthy();
    expect(manifest.substrates).toContain("react");
    expect(manifest.lifecycle?.autostart).toBe(true);
  });

  it("package exports matching manifest + component", () => {
    expect(pkg.manifest).toBe(manifest);
    expect(typeof pkg.component).toBe("function");
  });
});