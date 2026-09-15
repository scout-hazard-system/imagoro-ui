import type { FixtureSet } from "./types.js";

export function parseFixtureSet(json: string): FixtureSet {
  const parsed = JSON.parse(json) as FixtureSet;
  if (!parsed.meta?.id || !Array.isArray(parsed.stream)) {
    throw new Error("fixture set missing meta.id or stream[]");
  }
  return parsed;
}

/**
 * Browser-safe fixture loader: fetches a served JSON asset. Vite resolves
 * `new URL("../fixtures/events.json", import.meta.url)` into a real asset URL, so
 * consumers running under a bundler can `await loadFixtureSet(DEFAULT_FIXTURES_URL)`.
 * Node/test environments should use the JSON module import or the Node loader in
 * `./fixtures.node.js`.
 */
export async function loadFixtureSet(input: string): Promise<FixtureSet> {
  const res = await fetch(input);
  if (!res.ok) throw new Error(`fixtures ${res.status}`);
  return parseFixtureSet(await res.text());
}

/** Asset URL of the replay fixtures, resolved relative to this module (bundler only). */
export const DEFAULT_FIXTURES_URL = new URL("../fixtures/events.json", import.meta.url).href;