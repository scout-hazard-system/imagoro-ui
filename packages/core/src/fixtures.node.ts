/**
 * Node-only fixture loader: reads the replay fixtures from disk. Import from tests/harness
 * servers, never from a browser entry point (this module uses node:fs and is NOT re-exported
 * through `./index.js`).
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FixtureSet } from "./types.js";
import { parseFixtureSet } from "./fixtures.js";

/** Locate fixtures/events.json from the caller's cwd (works regardless of which package's
 *  vitest runs); falls back to the core package location. */
export const FIXTURES_PATH: string = ((): string => {
  const cwd = process.cwd().replace(/\\/g, "/");
  const candidates = [
    "./fixtures/events.json",
    "../core/fixtures/events.json",
    "packages/core/fixtures/events.json",
    "core/fixtures/events.json",
    "../../packages/core/fixtures/events.json",
  ];
  for (const rel of candidates) {
    const url = new URL(rel, `file://${cwd}/`);
    if (existsSync(fileURLToPath(url))) return url.href;
  }
  throw new Error("fixtures/events.json not found (searched candidates from cwd)");
})();

export function loadFixtureSetFromNode(input: string = FIXTURES_PATH): FixtureSet {
  const path = input.startsWith("file:") ? fileURLToPath(new URL(input)) : input;
  return parseFixtureSet(readFileSync(path, "utf8"));
}