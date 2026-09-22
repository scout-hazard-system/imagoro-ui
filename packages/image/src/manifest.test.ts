import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createImageManifest } from "./manifest.js";
import { verifyImageManifest } from "./verify.js";
import type { ImageBlockRef, ImageSection } from "./types.js";

const root = mkdtempSync(join(tmpdir(), "imagoro-image-"));
mkdirSync(join(root, "assets"), { recursive: true });
writeFileSync(join(root, "index.html"), "<!doctype html><title>cc</title>");
writeFileSync(join(root, "assets", "app.js"), "export const app = 1;");

const blocks: ImageBlockRef[] = [
  {
    id: "imagoro.map",
    name: "Map",
    version: "0.1.0",
    family: "map",
    substrate: "react",
    module: "@imagoro/block-map",
    entry: "index.tsx",
    size: { min: [2, 2], ideal: [4, 3] },
    ports: { in: [{ name: "route", type: "Route" }], out: [] },
  },
  {
    id: "imagoro.metrics",
    name: "Metrics",
    version: "0.1.0",
    family: "metrics",
    substrate: "react",
    module: "@imagoro/block-metrics",
    entry: "index.tsx",
    size: { min: [2, 1], ideal: [3, 2] },
    ports: { in: [], out: [{ name: "sample", type: "number" }] },
  },
];

const sections: ImageSection[] = [
  {
    id: "overview",
    label: "Overview",
    blurb: "At a glance",
    span: "full",
    align: "start",
    slots: [{ block: "imagoro.metrics" }],
  },
  {
    id: "ops",
    label: "Operations",
    blurb: "Live ops",
    span: "pair",
    align: "start",
    slots: [{ block: "imagoro.map", span: "full" }],
  },
];

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("imagoro-image manifest", () => {
  it("builds a manifest with hashed dist files and a stable integrity digest", async () => {
    const image = await createImageManifest({
      imageId: "org.example.crm",
      imageVersion: "0.1.0",
      renderer: "react",
      shell: { entry: "src/shell.tsx", sections },
      blocks,
      distDir: root,
    });

    expect(image.schema).toBe("imagoro.image/v1");
    expect(image.dist.length).toBe(2);
    expect(image.integrity.files).toBe(2);
    expect(image.integrity.digest).toMatch(/^[0-9a-f]{64}$/);

    const report = await verifyImageManifest(image, root);
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("verifies a clean manifest and flags tampering", async () => {
    const image = await createImageManifest({
      imageId: "org.example.crm",
      imageVersion: "0.1.0",
      renderer: "react",
      shell: { entry: "src/shell.tsx", sections },
      blocks,
      distDir: root,
    });
    const clean = await verifyImageManifest(image, root);
    expect(clean.ok).toBe(true);

    writeFileSync(join(root, "index.html"), "<!doctype html><title>tampered</title>");
    const dirty = await verifyImageManifest(image, root);
    expect(dirty.ok).toBe(false);
    expect(dirty.errors.length).toBeGreaterThan(0);
    // restore
    writeFileSync(join(root, "index.html"), "<!doctype html><title>cc</title>");
    const restored = await verifyImageManifest(image, root);
    expect(restored.ok).toBe(true);
  });

  it("rejects a section slot pointing at an unknown block", async () => {
    const badSections: ImageSection[] = [
      {
        id: "broken",
        label: "Broken",
        blurb: "x",
        span: "full",
        align: "start",
        slots: [{ block: "imagoro.ghost" }],
      },
    ];
    const image = await createImageManifest({
      imageId: "org.example.crm",
      imageVersion: "0.1.0",
      renderer: "react",
      shell: { entry: "src/shell.tsx", sections: badSections },
      blocks,
      distDir: root,
    });
    const report = await verifyImageManifest(image, root);
    expect(report.ok).toBe(false);
    expect(report.errors.join(" ")).toContain("unknown block \"imagoro.ghost\"");
  });
});